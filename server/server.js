const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

/**********************
 * SCENE POOL
 **********************/
const SCENE_POOL = [
  {
    movie: "the dark knight",
    folder: "darkknight",
    totalScenes: 3
  },
  {
    movie: "forrest gump",
    folder: "forrestgump",
    totalScenes: 3
  },
  {
    movie: "goodfellas",
    folder: "goodfellas",
    totalScenes: 3
  },
  {
    movie: "inception",
    folder: "inception",
    totalScenes: 3
  },
  {
    movie: "interstellar",
    folder: "interstellar",
    totalScenes: 3
  },
  {
    movie: "pulp fiction",
    folder: "pulpfiction",
    totalScenes: 3
  },
  {
    movie: "the shawshank redemption",
    folder: "theshawshankredemption",
    totalScenes: 3
  },
  {
    movie: "fight club",
    folder: "fightclub",
    totalScenes: 3
  },
  {
    movie: "kill bill",
    folder: "killbill",
    totalScenes: 3
  },
  {
    movie: "12 angry men",
    folder: "12angrymen",
    totalScenes: 3
  }
];


/**********************
 * ROOMS STATE
 **********************/
const rooms = {};

/**********************
 * SOCKET LOGIC
 **********************/
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /******** JOIN ROOM ********/
  socket.on("join-room", ({ roomCode, player }) => {
    if (roomCode === "AUTO") {
      roomCode = generateRoomCode();
    }

    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        hostId: socket.id,
        players: [],
        gameStarted: false,

        currentRound: 0,
        maxRounds: 5,
        usedMovies: [],

        movie: null,
        sceneIndex: 1,
        elapsedTime: 0,
        revealedLetters: 0,
        clue: "",
        timer: null
      };
    }

    const room = rooms[roomCode];

    room.players.push({
      ...player,
      socketId: socket.id
    });

    socket.join(roomCode);

    io.to(roomCode).emit("lobby-update", {
      roomCode,
      players: room.players,
      hostId: room.hostId
    });
  });

  /******** HOST START GAME ********/
  socket.on("start-game", (roomCode) => {
  const room = rooms[roomCode];
  if (!room) return;
  if (socket.id !== room.hostId) return;
  if (room.gameStarted) return;

  // 🔄 RESET SCORES
  room.players.forEach(player => {
    player.score = 0;
  });

  room.currentRound = 0;
  room.usedMovies = [];

  // 🔥 SYNC ALL CLIENTS
  io.to(roomCode).emit("lobby-update", {
    roomCode,
    players: room.players,
    hostId: room.hostId
  });

  io.to(roomCode).emit("new-game");

  startNextMovie(room, roomCode);
});


  /******** SUBMIT ANSWER ********/
  socket.on("submit-answer", ({ roomCode, answer }) => {
    const room = rooms[roomCode];
    if (!room || !room.gameStarted) return;

    const correct =
      answer.trim().toLowerCase() === room.movie.movie;

    if (correct) {
      const player = room.players.find(
        p => p.socketId === socket.id
      );

      if (player) {
        player.score += 10;
      }

      io.to(roomCode).emit("answer-result", {
        correct: true,
        playerName: player.name,
        answer: room.movie.movie,
        players: room.players
      });

      clearInterval(room.timer);

      setTimeout(() => {
        startNextMovie(room, roomCode);
      }, 3000);
    } else {
      socket.emit("answer-result", { correct: false });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/**********************
 * GAME HELPERS
 **********************/
function startNextMovie(room, roomCode) {
  room.currentRound++;

  if (room.currentRound > room.maxRounds) {
    io.to(roomCode).emit("game-over", {
      players: room.players
    });
    room.gameStarted = false;
    return;
  }

  const remaining = SCENE_POOL.filter(
    m => !room.usedMovies.includes(m.movie)
  );

  const movie = remaining[Math.floor(Math.random() * remaining.length)];
  room.usedMovies.push(movie.movie);

  room.movie = movie;
  room.sceneIndex = 1;
  room.elapsedTime = 0;
  room.revealedLetters = 0;
  room.clue = "";
  room.gameStarted = true;

  startTimer(room, roomCode);
}

function startTimer(room, roomCode) {
  if (room.timer) clearInterval(room.timer);

  room.timer = setInterval(() => {
    room.elapsedTime++;

    // 🎬 Scene switching
    if (room.elapsedTime === 30) room.sceneIndex = 2;
    if (room.elapsedTime === 60) room.sceneIndex = 3;

    // 🧩 Clue reveal
    if (room.elapsedTime > 60 && room.elapsedTime % 10 === 0) {
      room.revealedLetters++;
      room.clue = generateClue(
        room.movie.movie,
        room.revealedLetters
      );
    }

    // ⏱ Timeout → next movie
    if (room.elapsedTime >= 120) {
      clearInterval(room.timer);

      setTimeout(() => {
        startNextMovie(room, roomCode);
      }, 3000);

      return;
    }

    io.to(roomCode).emit("game-state", {
      movie: room.movie,
      sceneIndex: room.sceneIndex,
      elapsedTime: room.elapsedTime,
      clue: room.clue,
      gameOver: false
    });
  }, 1000);
}

/**********************
 * UTILITIES
 **********************/
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateClue(answer, revealed) {
  let out = "";
  let count = 0;

  for (let ch of answer) {
    if (ch === " ") {
      out += " ";
    } else if (count < revealed) {
      out += ch;
      count++;
    } else {
      out += "_";
    }
  }
  return out;
}

/**********************
 * START SERVER
 **********************/
server.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);

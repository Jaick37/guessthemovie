/**********************
 * SOCKET CONNECTION
 **********************/
console.log("script.js loaded");
const clueText = document.getElementById("clueText");


const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});

/**********************
 * STATE
 **********************/
let players = [];
let selectedAvatar = null;
let currentRoomCode = null;
let isHost = false;

let selectedMovie = null;
let currentSceneIndex = 1;
let elapsedTime = 0;

/**********************
 * DOM
 **********************/
const sceneImg = document.getElementById("scene");
const timerText = document.getElementById("timer");
const resultText = document.getElementById("result");
const answerInput = document.getElementById("answer");
const startBtn = document.getElementById("startBtn");

/**********************
 * AVATAR SELECTION
 **********************/
function selectAvatar(avatar, el) {
  selectedAvatar = avatar;
  document.querySelectorAll(".avatar").forEach(a =>
    a.classList.remove("selected")
  );
  el.classList.add("selected");
}

/**********************
 * JOIN ROOM
 **********************/
function joinGame() {
  console.log("joinGame function entered");

  const name = document.getElementById("playerName").value.trim();
  const roomInput = document
    .getElementById("roomCodeInput")
    .value
    .trim()
    .toUpperCase();

  if (!name || !selectedAvatar) {
    alert("Enter name and select avatar");
    return;
  }

  socket.emit("join-room", {
    roomCode: roomInput || "AUTO",
    player: {
      name,
      avatar: selectedAvatar,
      score: 0
    }
  });
}

/**********************
 * LOBBY UPDATE (SERVER)
 **********************/
socket.on("lobby-update", (data) => {
  console.log("Lobby update received", data);

  players = data.players;
  currentRoomCode = data.roomCode;
  isHost = socket.id === data.hostId;

  document.getElementById("roomCodeDisplay").innerText =
    "Room Code: " + currentRoomCode;

  document.getElementById("joinScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");

  startBtn.style.display = isHost ? "block" : "none";

  renderPlayers();
});

/**********************
 * HOST START GAME
 **********************/
function startGame() {
  console.log("Host started game");
  socket.emit("start-game", currentRoomCode);
}

/**********************
 * GAME STATE (SERVER)
 **********************/
socket.on("game-state", (state) => {
    if (elapsedTime === 0) {
  clueText.innerText = "";
}

  selectedMovie = state.movie;
  currentSceneIndex = state.sceneIndex;
  elapsedTime = state.elapsedTime;

  timerText.innerText = `Time: ${elapsedTime}s`;
  sceneImg.src =
    `scenes/${selectedMovie.folder}/${currentSceneIndex}.jpg`;

  if (state.clue && state.clue.length > 0) {
    clueText.innerText = "Clue: " + state.clue;
  }

  if (state.gameOver) {
    resultText.innerText =
      `⏱ Game Over! Answer: ${selectedMovie.movie}`;
  }

  

});

/**********************
 * ANSWER RESULT (SERVER)  ✅ STEP 3
 **********************/
socket.on("answer-result", (data) => {
  if (data.correct) {
    resultText.innerText =
      `🎉 ${data.playerName} guessed correctly!`;

    players = data.players;
    renderPlayers();
  } else {
    resultText.innerText = "❌ Wrong answer";
  }
});



/**********************
 * PLAYER LIST UI
 **********************/
function renderPlayers() {
  const list = document.getElementById("playerList");
  list.innerHTML = "";

  players.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span><img src="${p.avatar}" class="player-avatar"> ${p.name}</span>
      <span>${p.score}</span>
    `;
    list.appendChild(li);
  });
}

/**********************
 * SUBMIT ANSWER
 **********************/
function checkAnswer() {
  const answer = answerInput.value.trim();
  if (!answer) return;

  socket.emit("submit-answer", {
    roomCode: currentRoomCode,
    answer
  });

  answerInput.value = "";
}
function launchConfetti() {
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.innerText = "🎉";
    confetti.style.position = "fixed";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.top = "-20px";
    confetti.style.fontSize = "24px";
    confetti.style.animation = "fall 3s linear forwards";
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  }
}


/**********************
 * JOIN BUTTON LISTENER (SAFE)
 **********************/
const joinBtn = document.getElementById("joinBtn");
if (joinBtn) {
  joinBtn.addEventListener("click", () => {
    console.log("Join button clicked (listener)");
    joinGame();
  });
}
const playAgainBtn = document.getElementById("playAgainBtn");

if (playAgainBtn) {
  playAgainBtn.onclick = () => {
    if (!isHost) return;

    // Hide winner screen
    document.getElementById("winnerScreen").classList.add("hidden");

    // Reset UI
    document.getElementById("gameScreen").classList.remove("hidden");
    resultText.innerText = "";
    clueText.innerText = "";
    startBtn.style.display = "none";


    // Start new game
    socket.emit("start-game", currentRoomCode);
  };
}

socket.on("game-over", ({ players }) => {
  document.getElementById("gameScreen").classList.add("hidden");

  const winnerScreen = document.getElementById("winnerScreen");
  winnerScreen.classList.remove("hidden");

  players.sort((a, b) => b.score - a.score);

  document.getElementById("winnerName").innerText =
    `🏆 Winner: ${players[0].name} (${players[0].score} pts)`;

  const list = document.getElementById("finalLeaderboard");
  list.innerHTML = "";

  players.forEach((p, i) => {
    const li = document.createElement("li");
    if (i === 0) li.classList.add("winner");

   li.innerHTML = `
  <span>
    <img src="${p.avatar}" class="player-avatar">
    ${i + 1}. ${p.name}
  </span>
  <span>${p.score}</span>
`;

    list.appendChild(li);
  });
  launchConfetti(); 
  playAgainBtn.style.display = isHost ? "block" : "none";

});
socket.on("new-game", () => {
  // Hide winner screen everywhere
  document.getElementById("winnerScreen").classList.add("hidden");

  // Show game screen
  document.getElementById("gameScreen").classList.remove("hidden");

  // Reset UI
  resultText.innerText = "";
  clueText.innerText = "";

  renderPlayers();
});




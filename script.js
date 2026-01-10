/**********************
 * GLOBAL CONSTANTS
 **********************/
const MAX_PLAYERS = 5;

/**********************
 * GLOBAL STATE
 **********************/
let players = [];
let selectedAvatar = null;

let scenes = [
  { img: "scene1.jpg", answer: "the dark knight" },
  { img: "scene2.jpg", answer: "inception" }
];

let currentScene = 0;
let totalTime = 180;
let elapsedTime = 0;
let revealedLetters = 0;
let timer;

/**********************
 * DOM ELEMENTS
 **********************/
const sceneImg = document.getElementById("scene");
const timerText = document.getElementById("timer");
const resultText = document.getElementById("result");
const answerInput = document.getElementById("answer");

/**********************
 * JOIN SCREEN LOGIC
 **********************/
function selectAvatar(emoji, el) {
  selectedAvatar = emoji;

  document.querySelectorAll(".avatar").forEach(a =>
    a.classList.remove("selected")
  );

  el.classList.add("selected");
}

function joinGame() {
    console.log("Join button clicked");

  const name = document.getElementById("playerName").value.trim();

  if (!name || !selectedAvatar) {
    alert("Enter name and select avatar");
    return;
  }

  if (players.length >= MAX_PLAYERS) {
    alert("Room is full!");
    return;
  }

  players.push({
    name,
    avatar: selectedAvatar,
    score: 0
  });

  document.getElementById("joinScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");

  renderPlayers();
  startScene();
}

/**********************
 * PLAYER UI
 **********************/
function renderPlayers() {
  const list = document.getElementById("playerList");
  list.innerHTML = "";

  players.forEach((player, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
     <span>
  <img src="${player.avatar}" class="player-avatar">
  ${player.name}
</span>

      <span>${player.score}</span>
    `;
    if (index === 0) li.classList.add("active");
    list.appendChild(li);
  });
}

/**********************
 * GAME LOGIC
 **********************/
function startScene() {
  clearInterval(timer);

  elapsedTime = 0;
  revealedLetters = 0;
  answerInput.value = "";
  resultText.innerText = "";

  sceneImg.src = scenes[currentScene].img;
  timerText.innerText = "Time: 0s";

  timer = setInterval(gameLoop, 1000);
}

function gameLoop() {
  elapsedTime++;
  timerText.innerText = "Time: " + elapsedTime + "s";

  if (elapsedTime % 60 === 0) {
    revealedLetters++;
    showClue();
  }

  if (elapsedTime >= totalTime) {
    resultText.innerText =
      "❌ Time up! Answer: " + scenes[currentScene].answer;
    endScene();
  }
}

function checkAnswer() {
  let userAnswer = answerInput.value.toLowerCase().trim();

  if (userAnswer === scenes[currentScene].answer) {
    resultText.innerText = "🎉 Correct! +10 points";
    players[0].score += 10;
    renderPlayers();
    endScene();
  } else {
    resultText.innerText = "❌ Try again";
  }
}

function showClue() {
  let answer = scenes[currentScene].answer;
  let clue = "";

  for (let i = 0; i < answer.length; i++) {
    if (answer[i] === " ") clue += " ";
    else if (i < revealedLetters) clue += answer[i];
    else clue += "_";
  }

  resultText.innerText = "Clue: " + clue;
}

function endScene() {
  clearInterval(timer);

  setTimeout(() => {
    currentScene++;
    if (currentScene >= scenes.length) {
      resultText.innerText = "🎮 Game Over!";
      return;
    }
    startScene();
  }, 3000);
}
document.addEventListener("DOMContentLoaded", () => {
  // nothing needed now, but ensures DOM is ready
});


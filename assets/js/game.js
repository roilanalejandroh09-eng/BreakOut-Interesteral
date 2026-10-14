const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("game-score");
const bestElement = document.getElementById("game-best");
const livesElement = document.getElementById("game-lives");
const statusElement = document.getElementById("game-status");
const startButton = document.getElementById("start-game");
const pauseButton = document.getElementById("pause-game");
const leftButton = document.getElementById("move-left");
const rightButton = document.getElementById("move-right");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const BEST_SCORE_KEY = "breakout-best-score";
const brickColors = ["#f472e8", "#c084fc", "#818cf8", "#38bdf8", "#22d3ee"];
const keys = new Set();
const bricks = [];
const paddle = { width: 112, height: 13, x: (WIDTH - 112) / 2, y: HEIGHT - 34, speed: 7 };
const ball = { x: WIDTH / 2, y: paddle.y - 9, radius: 7, dx: 3.4, dy: -4.2, speed: 5.4 };

let score = 0;
let bestScore = 0;
let lives = 3;
let state = "ready";
let frameId = 0;
let previousFrame = 0;

function loadBestScore() {
  try {
    const storedScore = Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
    return Number.isFinite(storedScore) && storedScore >= 0 ? storedScore : 0;
  } catch (error) {
    console.error("Falha ao carregar o recorde local:", error);
    statusElement.textContent = "Não foi possível ler o recorde salvo neste navegador.";
    return 0;
  }
}

function createBricks() {
  bricks.length = 0;
  const columns = 10;
  const rows = 5;
  const width = 66;
  const height = 21;
  const gap = 8;
  const left = (WIDTH - columns * width - (columns - 1) * gap) / 2;
  const top = 64;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      bricks.push({
        x: left + column * (width + gap),
        y: top + row * (height + gap),
        width,
        height,
        color: brickColors[row],
        alive: true,
      });
    }
  }
}

function resetBall() {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius - 2;
  ball.dx = 3.4 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -4.2;
}

function updateHud() {
  scoreElement.textContent = String(score);
  bestElement.textContent = String(bestScore);
  livesElement.textContent = String(lives);
}

function setState(nextState, message) {
  state = nextState;
  statusElement.textContent = message;
  pauseButton.disabled = nextState !== "playing" && nextState !== "paused";
  pauseButton.textContent = nextState === "paused" ? "Continuar" : "Pausar";
  startButton.textContent =
    nextState === "paused"
      ? "Continuar jogo"
      : nextState === "playing"
        ? "Reiniciar jogo"
        : nextState === "ready"
          ? "Começar jogo"
          : "Jogar novamente";
  draw();
}

function saveBestScore() {
  if (score <= bestScore) {
    return true;
  }

  bestScore = score;
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    return true;
  } catch (error) {
    console.error("Falha ao salvar o recorde local:", error);
    return false;
  }
}

function finishGame(won) {
  const saved = saveBestScore();
  updateHud();
  const message = won
    ? "Setor concluído! Você destruiu todos os blocos."
    : "Fim de jogo. Tente bater seu recorde!";
  setState(
    won ? "won" : "lost",
    saved ? message : `${message} Não foi possível salvar o recorde neste navegador.`
  );
}

function startGame() {
  if (state === "paused") {
    setState("playing", "Partida em andamento. Boa sorte!");
    previousFrame = 0;
    frameId = requestAnimationFrame(gameLoop);
    return;
  }

  if (state === "ready" && lives < 3) {
    setState("playing", "Partida em andamento. Boa sorte!");
    previousFrame = 0;
    frameId = requestAnimationFrame(gameLoop);
    return;
  }

  score = 0;
  lives = 3;
  paddle.x = (WIDTH - paddle.width) / 2;
  createBricks();
  resetBall();
  updateHud();
  setState("playing", "Partida em andamento. Boa sorte!");
  previousFrame = 0;
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (state === "playing") {
    cancelAnimationFrame(frameId);
    setState("paused", "Jogo pausado. Continue quando estiver pronto.");
  } else if (state === "paused") {
    startGame();
  }
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#101936");
  gradient.addColorStop(1, "#070b18");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  for (let index = 0; index < 54; index += 1) {
    const x = (index * 137 + 31) % WIDTH;
    const y = (index * 83 + 19) % HEIGHT;
    context.globalAlpha = 0.25 + ((index * 17) % 70) / 100;
    context.fillStyle = "#dbeafe";
    context.fillRect(x, y, index % 7 === 0 ? 2 : 1, index % 7 === 0 ? 2 : 1);
  }
  context.globalAlpha = 1;
}

function draw() {
  drawBackground();

  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }
    context.shadowColor = brick.color;
    context.shadowBlur = 12;
    context.fillStyle = brick.color;
    context.beginPath();
    context.roundRect(brick.x, brick.y, brick.width, brick.height, 5);
    context.fill();
  }

  context.shadowColor = "#38bdf8";
  context.shadowBlur = 18;
  context.fillStyle = "#67e8f9";
  context.beginPath();
  context.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 7);
  context.fill();

  context.shadowColor = "#fff7ad";
  context.shadowBlur = 15;
  context.fillStyle = "#fff7ad";
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  if (state !== "playing") {
    const title =
      state === "paused"
        ? "PAUSADO"
        : state === "won"
          ? "SETOR CONCLUÍDO"
          : state === "lost"
            ? "FIM DE JOGO"
            : "PRONTO PARA JOGAR?";
    context.fillStyle = "rgba(4, 9, 24, 0.66)";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.textAlign = "center";
    context.fillStyle = "#f8fafc";
    context.font = "700 30px Segoe UI, sans-serif";
    context.fillText(title, WIDTH / 2, HEIGHT / 2 - 4);
    context.fillStyle = "#a5f3fc";
    context.font = "16px Segoe UI, sans-serif";
    context.fillText("Destrua os blocos e não deixe a bola cair", WIDTH / 2, HEIGHT / 2 + 28);
  }
}

function movePaddleFromPointer(event) {
  const bounds = canvas.getBoundingClientRect();
  const pointerX = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, pointerX - paddle.width / 2));
  if (state !== "playing") {
    resetBall();
    draw();
  }
}

function gameLoop(timestamp) {
  if (state !== "playing") {
    return;
  }

  const frameScale = previousFrame ? Math.min((timestamp - previousFrame) / (1000 / 60), 2) : 1;
  previousFrame = timestamp;
  update(frameScale);
  draw();
  if (state === "playing") {
    frameId = requestAnimationFrame(gameLoop);
  }
}

function update(frameScale) {
  if (keys.has("ArrowLeft") || keys.has("a")) {
    paddle.x -= paddle.speed * frameScale;
  }
  if (keys.has("ArrowRight") || keys.has("d")) {
    paddle.x += paddle.speed * frameScale;
  }
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));

  ball.x += ball.dx * frameScale;
  ball.y += ball.dy * frameScale;

  if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= WIDTH) {
    ball.dx *= -1;
    ball.x = Math.max(ball.radius, Math.min(WIDTH - ball.radius, ball.x));
  }
  if (ball.y - ball.radius <= 0) {
    ball.dy = Math.abs(ball.dy);
  }

  if (
    ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
  ) {
    const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const angle = hitPosition * (Math.PI / 3);
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
    ball.y = paddle.y - ball.radius;
  }

  for (const brick of bricks) {
    if (
      brick.alive &&
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width &&
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height
    ) {
      brick.alive = false;
      ball.dy *= -1;
      score += 10;
      updateHud();
      if (bricks.every((item) => !item.alive)) {
        finishGame(true);
      }
      break;
    }
  }

  if (ball.y - ball.radius > HEIGHT) {
    lives -= 1;
    updateHud();
    if (lives === 0) {
      finishGame(false);
      return;
    }
    resetBall();
    setState("ready", `Você perdeu uma vida. Restam ${lives}. Clique em Começar jogo para continuar.`);
  }
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
canvas.addEventListener("pointermove", movePaddleFromPointer);
canvas.addEventListener("pointerdown", (event) => {
  movePaddleFromPointer(event);
  if (state === "ready") {
    startGame();
  }
});

function bindTouchControl(button, direction) {
  const release = () => keys.delete(direction);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(direction);
    if (state === "ready") {
      startGame();
    }
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

bindTouchControl(leftButton, "ArrowLeft");
bindTouchControl(rightButton, "ArrowRight");

document.addEventListener("keydown", (event) => {
  if (
    event.target instanceof HTMLElement &&
    (event.target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName))
  ) {
    return;
  }
  if (["ArrowLeft", "ArrowRight", " ", "a", "A", "d", "D"].includes(event.key)) {
    event.preventDefault();
  }
  if (event.key === " " && (state === "playing" || state === "paused")) {
    togglePause();
    return;
  }
  keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});

bestScore = loadBestScore();
createBricks();
resetBall();
updateHud();
draw();

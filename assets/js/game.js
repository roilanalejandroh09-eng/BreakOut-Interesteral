const canvas = document.getElementById("gameCanvas");
const context = canvas ? canvas.getContext("2d") : null;
const scoreElement = document.getElementById("game-score");
const bestElement = document.getElementById("game-best");
const livesElement = document.getElementById("game-lives");
const statusElement = document.getElementById("game-status");
const startButton = document.getElementById("start-game");
const pauseButton = document.getElementById("pause-game");
const leftButton = document.getElementById("move-left");
const rightButton = document.getElementById("move-right");
const playerWelcome = document.querySelector(".player-welcome strong");

const PLAYERS_STORAGE_KEY = "breakout-players";
const CURRENT_PLAYER_KEY = "breakout-current-player";

function getCurrentPlayer() {
  try {
    const saved = localStorage.getItem(CURRENT_PLAYER_KEY);
    if (!saved) return null;
    const playerId = Number(saved);
    const players = JSON.parse(localStorage.getItem(PLAYERS_STORAGE_KEY) || "[]");
    return players.find(p => p.id === playerId) || null;
  } catch {
    return null;
  }
}

function savePlayerData(player) {
  try {
    const players = JSON.parse(localStorage.getItem(PLAYERS_STORAGE_KEY) || "[]");
    const idx = players.findIndex(p => p.id === player.id);
    if (idx >= 0) {
      players[idx] = player;
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
    }
  } catch (e) {
    console.error("Erro ao salvar dados do jogador:", e);
  }
}

function updateWelcomeMessage() {
  const player = getCurrentPlayer();
  if (playerWelcome) {
    playerWelcome.textContent = player ? player.name : "Visitante";
  }
  const coinsDisplay = document.getElementById("player-coins");
  if (coinsDisplay && player) {
    coinsDisplay.textContent = `${player.coins || 0} 🪙`;
  }
}

if (!canvas || !context || !scoreElement || !bestElement || !livesElement || !statusElement || !startButton || !pauseButton || !leftButton || !rightButton) {
  console.info("Página sem área de jogo; módulo ignorado.");
} else {

updateWelcomeMessage();

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const BEST_SCORE_KEY = "breakout-best-score";
const brickColors = ["#f472e8", "#c084fc", "#818cf8", "#38bdf8", "#22d3ee"];
const powerTypes = ["multi", "slow", "wide", "life", "shield", "fast", "explode", "triple"];
const keys = new Set();
const bricks = [];
const buffs = [];
const bonusBalls = [];
const paddle = { width: 112, height: 13, x: (WIDTH - 112) / 2, y: HEIGHT - 34, speed: 7, baseWidth: 112 };
const ball = { x: WIDTH / 2, y: paddle.y - 9, radius: 7, dx: 3.4, dy: -4.2, speed: 5.4 };

let score = 0;
let bestScore = 0;
let lives = 3;
let state = "ready";
let frameId = 0;
let previousFrame = 0;
let shieldActive = false;

function loadBestScore() {
  const player = getCurrentPlayer();
  if (player && Number.isFinite(player.score)) {
    return player.score;
  }
  try {
    const storedScore = Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
    return Number.isFinite(storedScore) && storedScore >= 0 ? storedScore : 0;
  } catch (error) {
    console.error("Falha ao carregar o recorde local:", error);
    statusElement.textContent = "Não foi possível ler o recorde salvo neste navegador.";
    return 0;
  }
}

function getPlayerPhase(score) {
  if (score >= 240) return "Imperador do espaço";
  if (score >= 160) return "Guardião estelar";
  if (score >= 90) return "Piloto avançado";
  if (score >= 40) return "Aspirante";
  return "Iniciante";
}

function createBricks() {
  bricks.length = 0;
  buffs.length = 0;
  bonusBalls.length = 0;
  const columns = 10;
  const rows = 5;
  const width = 66;
  const height = 21;
  const gap = 8;
  const left = (WIDTH - columns * width - (columns - 1) * gap) / 2;
  const top = 64;
  const buffIndexes = new Set();

  while (buffIndexes.size < 12) {
    buffIndexes.add(Math.floor(Math.random() * (columns * rows)));
  }

  let brickIndex = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const brick = {
        x: left + column * (width + gap),
        y: top + row * (height + gap),
        width,
        height,
        color: brickColors[row],
        alive: true,
        power: buffIndexes.has(brickIndex) ? powerTypes[Math.floor(Math.random() * powerTypes.length)] : null,
      };
      bricks.push(brick);
      brickIndex += 1;
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
  const player = getCurrentPlayer();
  const isNewBest = score > bestScore;
  
  if (isNewBest) {
    bestScore = score;
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
    } catch (error) {
      console.error("Falha ao salvar o recorde local:", error);
    }
  }

  if (player) {
    const scoreIncrease = Math.max(0, score - (player.score || 0));
    if (scoreIncrease > 0) {
      player.score = score;
    }
    player.games = (player.games || 0) + 1;
    player.lastPlayedAt = new Date().toISOString().slice(0, 10);
    player.phase = getPlayerPhase(score);
    
    const coinsEarned = Math.floor(score / 10) + (won ? 50 : 10);
    player.coins = (player.coins || 0) + coinsEarned;
    
    savePlayerData(player);
    updateWelcomeMessage();
    
    statusElement.textContent = won 
      ? `Setor concluído! +${coinsEarned} moedas. Recorde: ${bestScore}`
      : `Fim de jogo. +${coinsEarned} moedas. Tente bater seu recorde!`;
  } else {
    statusElement.textContent = won
      ? "Setor concluído! Você destruiu todos os blocos. (Entre na conta para salvar progresso)"
      : "Fim de jogo. Tente bater seu recorde! (Entre na conta para salvar progresso)";
  }

  updateHud();
  setState(won ? "won" : "lost", statusElement.textContent);
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

  const player = getCurrentPlayer();
  bestScore = player ? (player.score || 0) : loadBestScore();
  
  score = 0;
  lives = 3;
  shieldActive = false;
  bonusBalls.length = 0;
  paddle.width = paddle.baseWidth;
  ball.speed = 5.4;
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

function drawPowerIcon(x, y, type) {
  context.fillStyle = "#fff";
  context.font = "700 10px Segoe UI";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const labelMap = {
    multi: "x2",
    slow: "S",
    wide: "W",
    life: "+",
    shield: "⛨",
    fast: "F",
    explode: "BOOM",
    triple: "3x",
  };
  context.fillText(labelMap[type] || "!", x, y + (type === "explode" ? 1 : 0));
}

function drawBuffs() {
  for (const buff of buffs) {
    const color = buff.type === "multi" ? "#fbbf24" : buff.type === "slow" ? "#60a5fa" : buff.type === "wide" ? "#34d399" : buff.type === "life" ? "#f472b6" : buff.type === "shield" ? "#a78bfa" : buff.type === "fast" ? "#f87171" : buff.type === "explode" ? "#fb7185" : "#2dd4bf";
    context.save();
    context.shadowColor = color;
    context.shadowBlur = 22;
    context.fillStyle = color;
    context.beginPath();
    context.arc(buff.x, buff.y, buff.radius + 3, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.2)";
    context.beginPath();
    context.arc(buff.x, buff.y, buff.radius - 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    drawPowerIcon(buff.x, buff.y, buff.type);
  }
}

function getSkinColors(skinId, isPaddle) {
  const paddleColors = {
    default: { main: "#67e8f9", glow: "#38bdf8", accent: "#a5f3fc" },
    neon: { main: "#f472e8", glow: "#c084fc", accent: "#f9a8f4" },
    fire: { main: "#fb923c", glow: "#f97316", accent: "#fdba74" },
    ice: { main: "#67e8f9", glow: "#22d3ee", accent: "#a5f3fc" },
    galaxy: { main: "#a78bfa", glow: "#8b5cf6", accent: "#c4b5fd" },
    gold: { main: "#fbbf24", glow: "#f59e0b", accent: "#fde047" }
  };
  const ballColors = {
    default: { main: "#fff7ad", glow: "#fff7ad", accent: "#fef08a" },
    neon: { main: "#f472e8", glow: "#c084fc", accent: "#f9a8f4" },
    fire: { main: "#fb923c", glow: "#f97316", accent: "#fdba74" },
    ice: { main: "#67e8f9", glow: "#22d3ee", accent: "#a5f3fc" },
    galaxy: { main: "#a78bfa", glow: "#8b5cf6", accent: "#c4b5fd" },
    gold: { main: "#fbbf24", glow: "#f59e0b", accent: "#fde047" }
  };
  return isPaddle ? (paddleColors[skinId] || paddleColors.default) : (ballColors[skinId] || ballColors.default);
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

    if (brick.power) {
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255,255,255,0.7)";
      context.fillRect(brick.x + brick.width / 2 - 6, brick.y + brick.height / 2 - 3, 12, 6);
    }
  }

  drawBuffs();

  const player = getCurrentPlayer();
  const paddleSkin = player?.paddleSkin || 'default';
  const ballSkin = player?.ballSkin || 'default';
  const paddleColors = getSkinColors(paddleSkin, true);
  const ballColors = getSkinColors(ballSkin, false);

  context.shadowColor = paddleColors.glow;
  context.shadowBlur = 18;
  context.fillStyle = paddleColors.main;
  context.beginPath();
  context.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 7);
  context.fill();

  if (shieldActive) {
    context.strokeStyle = "rgba(167, 139, 250, 0.9)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(paddle.x + paddle.width / 2, paddle.y - 12, 18, 0, Math.PI * 2);
    context.stroke();
  }

  context.shadowColor = ballColors.glow;
  context.shadowBlur = 15;
  context.fillStyle = ballColors.main;
  context.beginPath();
  context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  context.fill();
  for (const extra of bonusBalls) {
    context.fillStyle = extra.color;
    context.beginPath();
    context.arc(extra.x, extra.y, extra.radius, 0, Math.PI * 2);
    context.fill();
  }
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

function spawnExtraBall() {
  const player = getCurrentPlayer();
  const ballSkin = player?.ballSkin || 'default';
  const ballColors = getSkinColors(ballSkin, false);
  
  const extra = {
    x: ball.x,
    y: ball.y,
    radius: ball.radius,
    dx: (Math.random() > 0.5 ? 1 : -1) * (Math.abs(ball.dx) + 1.2),
    dy: -Math.abs(ball.dy) * 0.95,
    speed: Math.max(ball.speed, 6.4),
    color: ballColors.main,
  };
  bonusBalls.push(extra);
}

function explodeNearbyBricks() {
  let destroyed = 0;
  for (const brick of bricks) {
    if (!brick.alive) {
      continue;
    }
    const distance = Math.hypot(brick.x + brick.width / 2 - ball.x, brick.y + brick.height / 2 - ball.y);
    if (distance < 170) {
      brick.alive = false;
      destroyed += 1;
      score += 20;
    }
  }
  if (destroyed > 0) {
    statusElement.textContent = `Poder ativo: explosão! ${destroyed} blocos destruídos.`;
    if (bricks.every((item) => !item.alive)) {
      finishGame(true);
    }
  }
}

function applyBuff(type) {
  switch (type) {
    case "multi":
      score += 60;
      spawnExtraBall();
      statusElement.textContent = "Poder ativo: bola extra! O campo ficou mais quente.";
      break;
    case "slow":
      ball.speed = Math.max(4.2, ball.speed * 0.8);
      ball.dx *= 0.9;
      ball.dy *= 0.9;
      statusElement.textContent = "Poder ativo: bola lenta e precisa!";
      break;
    case "wide":
      paddle.width = Math.min(220, paddle.width + 44);
      paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, paddle.x));
      statusElement.textContent = "Poder ativo: raquete expandida!";
      break;
    case "life":
      lives += 1;
      statusElement.textContent = "Poder ativo: vida extra!";
      break;
    case "shield":
      shieldActive = true;
      statusElement.textContent = "Poder ativo: escudo absorvente!";
      break;
    case "fast":
      ball.speed = Math.min(9.5, ball.speed + 1.5);
      const magnitude = Math.hypot(ball.dx, ball.dy) || ball.speed;
      ball.dx = (ball.dx / magnitude) * ball.speed;
      ball.dy = (ball.dy / magnitude) * ball.speed;
      statusElement.textContent = "Poder ativo: velocidade turbo!";
      break;
    case "explode":
      explodeNearbyBricks();
      break;
    case "triple":
      score += 80;
      spawnExtraBall();
      spawnExtraBall();
      statusElement.textContent = "Poder ativo: triplo impacto!";
      break;
    default:
      score += 10;
      statusElement.textContent = "Poder ativo: bônus extra!";
      break;
  }

  updateHud();
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

  const moveBall = (ballObject) => {
    ballObject.x += ballObject.dx * frameScale;
    ballObject.y += ballObject.dy * frameScale;

    if (ballObject.x - ballObject.radius <= 0 || ballObject.x + ballObject.radius >= WIDTH) {
      ballObject.dx *= -1;
      ballObject.x = Math.max(ballObject.radius, Math.min(WIDTH - ballObject.radius, ballObject.x));
    }
    if (ballObject.y - ballObject.radius <= 0) {
      ballObject.dy = Math.abs(ballObject.dy);
    }

    if (
      ballObject.dy > 0 &&
      ballObject.y + ballObject.radius >= paddle.y &&
      ballObject.y - ballObject.radius <= paddle.y + paddle.height &&
      ballObject.x >= paddle.x &&
      ballObject.x <= paddle.x + paddle.width
    ) {
      const hitPosition = (ballObject.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle = hitPosition * (Math.PI / 3);
      ballObject.dx = ballObject.speed * Math.sin(angle);
      ballObject.dy = -ballObject.speed * Math.cos(angle);
      ballObject.y = paddle.y - ballObject.radius;
    }

    for (const brick of bricks) {
      if (
        brick.alive &&
        ballObject.x + ballObject.radius > brick.x &&
        ballObject.x - ballObject.radius < brick.x + brick.width &&
        ballObject.y + ballObject.radius > brick.y &&
        ballObject.y - ballObject.radius < brick.y + brick.height
      ) {
        brick.alive = false;
        ballObject.dy *= -1;
        score += 10;
        if (brick.power) {
          buffs.push({
            x: brick.x + brick.width / 2,
            y: brick.y + brick.height / 2,
            radius: 10,
            type: brick.power,
            vy: 2.8,
          });
        }
        updateHud();
        if (bricks.every((item) => !item.alive)) {
          finishGame(true);
        }
        return true;
      }
    }

    return false;
  };

  moveBall(ball);

  for (let index = bonusBalls.length - 1; index >= 0; index -= 1) {
    const extra = bonusBalls[index];
    extra.x += extra.dx * frameScale;
    extra.y += extra.dy * frameScale;

    if (extra.x - extra.radius <= 0 || extra.x + extra.radius >= WIDTH) {
      extra.dx *= -1;
      extra.x = Math.max(extra.radius, Math.min(WIDTH - extra.radius, extra.x));
    }
    if (extra.y - extra.radius <= 0) {
      extra.dy = Math.abs(extra.dy);
    }

    if (
      extra.dy > 0 &&
      extra.y + extra.radius >= paddle.y &&
      extra.y - extra.radius <= paddle.y + paddle.height &&
      extra.x >= paddle.x &&
      extra.x <= paddle.x + paddle.width
    ) {
      const extraHit = (extra.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const extraAngle = extraHit * (Math.PI / 3);
      extra.dx = extra.speed * Math.sin(extraAngle);
      extra.dy = -extra.speed * Math.cos(extraAngle);
      extra.y = paddle.y - extra.radius;
    }

    for (const brick of bricks) {
      if (
        brick.alive &&
        extra.x + extra.radius > brick.x &&
        extra.x - extra.radius < brick.x + brick.width &&
        extra.y + extra.radius > brick.y &&
        extra.y - extra.radius < brick.y + brick.height
      ) {
        brick.alive = false;
        extra.dy *= -1;
        score += 10;
        if (brick.power) {
          buffs.push({
            x: brick.x + brick.width / 2,
            y: brick.y + brick.height / 2,
            radius: 10,
            type: brick.power,
            vy: 2.8,
          });
        }
        updateHud();
        if (bricks.every((item) => !item.alive)) {
          finishGame(true);
        }
        break;
      }
    }

    if (extra.y - extra.radius > HEIGHT) {
      bonusBalls.splice(index, 1);
    }
  }

  for (let index = buffs.length - 1; index >= 0; index -= 1) {
    const buff = buffs[index];
    buff.y += buff.vy;

    if (
      buff.y + buff.radius >= paddle.y &&
      buff.y - buff.radius <= paddle.y + paddle.height &&
      buff.x >= paddle.x &&
      buff.x <= paddle.x + paddle.width
    ) {
      applyBuff(buff.type);
      buffs.splice(index, 1);
      continue;
    }

    if (buff.y - buff.radius > HEIGHT) {
      buffs.splice(index, 1);
    }
  }

  if (ball.y - ball.radius > HEIGHT) {
    if (bonusBalls.length > 0) {
      bonusBalls.length = 0;
      resetBall();
      statusElement.textContent = "Bola extra perdida! A principal continua sem custo de vida.";
      return;
    }

    if (shieldActive) {
      shieldActive = false;
      ball.y = paddle.y - ball.radius - 2;
      ball.dy = -Math.abs(ball.dy) * 0.95;
      statusElement.textContent = "Escudo absorveu a colisão!";
      return;
    }

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

}

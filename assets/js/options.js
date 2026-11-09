const soundToggle = document.getElementById("sound-toggle");
const difficultyToggle = document.getElementById("difficulty-toggle");
const themeSelect = document.getElementById("theme-select");
const optionsStatus = document.getElementById("options-status");
const playerCoinsDisplay = document.getElementById("player-coins");
const optionsStorageKey = "breakout-options";
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

function updateCoinsDisplay() {
  const player = getCurrentPlayer();
  if (playerCoinsDisplay) {
    playerCoinsDisplay.textContent = `${player?.coins || 0} 🪙`;
  }
}

function loadOptions() {
  try {
    const saved = localStorage.getItem(optionsStorageKey);
    if (!saved) {
      return { sound: true, difficulty: false, theme: "space" };
    }
    return { ...{ sound: true, difficulty: false, theme: "space" }, ...JSON.parse(saved) };
  } catch (error) {
    console.error("Erro ao ler opções:", error);
    return { sound: true, difficulty: false, theme: "space" };
  }
}

function saveOptions() {
  const options = {
    sound: soundToggle.checked,
    difficulty: difficultyToggle.checked,
    theme: themeSelect.value,
  };
  localStorage.setItem(optionsStorageKey, JSON.stringify(options));

  if (optionsStatus) {
    optionsStatus.textContent = `Preferências salvas: ${options.sound ? "som ativo" : "som silencioso"}, ${options.difficulty ? "modo difícil" : "modo normal"}, tema ${options.theme}.`;
  }
}

const options = loadOptions();
if (soundToggle) soundToggle.checked = options.sound;
if (difficultyToggle) difficultyToggle.checked = options.difficulty;
if (themeSelect) themeSelect.value = options.theme;

soundToggle?.addEventListener("change", saveOptions);
difficultyToggle?.addEventListener("change", saveOptions);
themeSelect?.addEventListener("change", saveOptions);

saveOptions();
updateCoinsDisplay();

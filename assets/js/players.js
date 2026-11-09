const registrationForm = document.getElementById("cadastro-jogador");
const registrationMessage = document.getElementById("cadastro-mensagem");
const playersTable = document.getElementById("lista-jogadores");
const searchInput = document.getElementById("pesquisa-jogador");
const playerFilter = document.getElementById("filtro-resultado");
const playerSort = document.getElementById("ordenacao");
const detailsPanel = document.getElementById("detalhes-jogador");
const spaceFactPanel = document.getElementById("api-astronomia");
const playersStorageKey = "breakout-players";
const currentPlayerKey = "breakout-current-player";

const DEFAULT_SKINS = {
  paddle: ['default', 'neon', 'fire', 'ice', 'galaxy', 'gold'],
  ball: ['default', 'neon', 'fire', 'ice', 'galaxy', 'gold']
};

const SKIN_PRICES = {
  paddle: { default: 0, neon: 500, fire: 800, ice: 800, galaxy: 1200, gold: 2000 },
  ball: { default: 0, neon: 300, fire: 500, ice: 500, galaxy: 800, gold: 1500 }
};

if (!registrationForm || !playersTable || !searchInput || !playerFilter || !playerSort) {
  console.info("Página sem painel de jogadores; módulos de cadastro ignorados.");
} else {

function getPlayerPhase(score) {
  if (score >= 240) return "Imperador do espaço";
  if (score >= 160) return "Guardião estelar";
  if (score >= 90) return "Piloto avançado";
  if (score >= 40) return "Aspirante";
  return "Iniciante";
}

function normalizePlayer(player) {
  const name = typeof player?.name === "string" ? player.name.trim() : "Jogador";
  return {
    id: Number.isFinite(player?.id) ? Number(player.id) : Date.now() + Math.random(),
    name,
    score: Number.isFinite(Number(player?.score)) ? Number(player.score) : 0,
    phase: typeof player?.phase === "string" ? player.phase : getPlayerPhase(Number(player?.score) || 0),
    games: Number.isFinite(Number(player?.games)) ? Number(player.games) : 0,
    createdAt:
      typeof player?.createdAt === "string" ? player.createdAt : new Date().toISOString().slice(0, 10),
    lastPlayedAt:
      typeof player?.lastPlayedAt === "string" ? player.lastPlayedAt : "",
    coins: Number.isFinite(Number(player?.coins)) ? Number(player.coins) : 0,
    paddleSkin: typeof player?.paddleSkin === "string" ? player.paddleSkin : "default",
    ballSkin: typeof player?.ballSkin === "string" ? player.ballSkin : "default",
    unlockedPaddleSkins: Array.isArray(player?.unlockedPaddleSkins) ? player.unlockedPaddleSkins : ["default"],
    unlockedBallSkins: Array.isArray(player?.unlockedBallSkins) ? player.unlockedBallSkins : ["default"],
  };
}

function loadPlayers() {
  const savedPlayers = localStorage.getItem(playersStorageKey);
  if (!savedPlayers) {
    return [];
  }

  try {
    const parsedPlayers = JSON.parse(savedPlayers);
    if (!Array.isArray(parsedPlayers)) {
      return [];
    }

    return parsedPlayers.map(normalizePlayer);
  } catch (error) {
    console.error("Falha ao carregar jogadores salvos:", error);
    return [];
  }
}

function savePlayers(players) {
  localStorage.setItem(playersStorageKey, JSON.stringify(players));
}

function getCurrentPlayer() {
  try {
    const saved = localStorage.getItem(currentPlayerKey);
    if (!saved) return null;
    const playerId = Number(saved);
    const players = loadPlayers();
    return players.find(p => p.id === playerId) || null;
  } catch {
    return null;
  }
}

function setCurrentPlayer(playerId) {
  localStorage.setItem(currentPlayerKey, String(playerId));
}

function clearCurrentPlayer() {
  localStorage.removeItem(currentPlayerKey);
}

function addCoinsToCurrentPlayer(amount) {
  const players = loadPlayers();
  const currentId = Number(localStorage.getItem(currentPlayerKey));
  const idx = players.findIndex(p => p.id === currentId);
  if (idx >= 0) {
    players[idx].coins = (players[idx].coins || 0) + amount;
    savePlayers(players);
    return players[idx].coins;
  }
  return 0;
}

function spendCoinsCurrentPlayer(amount) {
  const players = loadPlayers();
  const currentId = Number(localStorage.getItem(currentPlayerKey));
  const idx = players.findIndex(p => p.id === currentId);
  if (idx >= 0 && (players[idx].coins || 0) >= amount) {
    players[idx].coins -= amount;
    savePlayers(players);
    return true;
  }
  return false;
}

function unlockSkinForCurrentPlayer(type, skinId) {
  const players = loadPlayers();
  const currentId = Number(localStorage.getItem(currentPlayerKey));
  const idx = players.findIndex(p => p.id === currentId);
  if (idx >= 0) {
    const key = type === 'paddle' ? 'unlockedPaddleSkins' : 'unlockedBallSkins';
    if (!players[idx][key].includes(skinId)) {
      players[idx][key].push(skinId);
      savePlayers(players);
      return true;
    }
  }
  return false;
}

function equipSkinForCurrentPlayer(type, skinId) {
  const players = loadPlayers();
  const currentId = Number(localStorage.getItem(currentPlayerKey));
  const idx = players.findIndex(p => p.id === currentId);
  if (idx >= 0) {
    const unlockedKey = type === 'paddle' ? 'unlockedPaddleSkins' : 'unlockedBallSkins';
    const equipKey = type === 'paddle' ? 'paddleSkin' : 'ballSkin';
    if (players[idx][unlockedKey].includes(skinId)) {
      players[idx][equipKey] = skinId;
      savePlayers(players);
      return true;
    }
  }
  return false;
}

function getSkinPrice(type, skinId) {
  return SKIN_PRICES[type]?.[skinId] ?? 9999;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Ainda não jogou";
  }

  const time = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(time.getTime())) {
    return dateValue;
  }

  return time.toLocaleDateString("pt-BR");
}

function updatePlayerDisplay() {
  const currentPlayer = getCurrentPlayer();
  const display = document.getElementById('current-player-display');
  const profile = document.getElementById('player-profile');
  const prompt = document.getElementById('login-prompt');
  const profileName = document.getElementById('profile-name');
  const profilePhase = document.getElementById('profile-phase');
  const profileScore = document.getElementById('profile-score');
  const profileCoins = document.getElementById('profile-coins');
  const profileGames = document.getElementById('profile-games');
  const logoutBtn = document.getElementById('logout-btn');

  if (currentPlayer) {
    if (display) {
      display.style.display = 'inline-block';
      display.textContent = `👤 ${currentPlayer.name} (${currentPlayer.coins || 0} 🪙)`;
    }
    if (profile) profile.style.display = 'block';
    if (prompt) prompt.style.display = 'none';
    if (profileName) profileName.textContent = currentPlayer.name;
    if (profilePhase) {
      profilePhase.textContent = currentPlayer.phase || getPlayerPhase(currentPlayer.score || 0);
    }
    if (profileScore) profileScore.textContent = currentPlayer.score || 0;
    if (profileCoins) profileCoins.textContent = currentPlayer.coins || 0;
    if (profileGames) profileGames.textContent = currentPlayer.games || 0;
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        clearCurrentPlayer();
        updatePlayerDisplay();
        renderPlayers();
        if (detailsPanel) {
          detailsPanel.innerHTML = '<p>Os detalhes serão exibidos após o cadastro de um jogador.</p>';
        }
        registrationMessage.textContent = 'Você saiu da conta.';
      };
    }
  } else {
    if (display) display.style.display = 'none';
    if (profile) profile.style.display = 'none';
    if (prompt) prompt.style.display = 'block';
  }
}

function showPlayerDetails(player) {
  const playerName = player?.name || "Jogador";
  const playerScore = Number(player?.score) || 0;
  const playerPhase = player?.phase || getPlayerPhase(playerScore);
  const playerGames = Number(player?.games) || 0;
  const playerCoins = Number(player?.coins) || 0;
  const playerPaddleSkin = player?.paddleSkin || "default";
  const playerBallSkin = player?.ballSkin || "default";
  const unlockedPaddle = player?.unlockedPaddleSkins || ["default"];
  const unlockedBall = player?.unlockedBallSkins || ["default"];

  if (!detailsPanel) {
    return;
  }

  const paddleOptions = DEFAULT_SKINS.paddle.map(skin => `
    <option value="${skin}" ${skin === playerPaddleSkin ? 'selected' : ''} ${!unlockedPaddle.includes(skin) ? 'disabled' : ''}>
      ${skin.charAt(0).toUpperCase() + skin.slice(1)} ${!unlockedPaddle.includes(skin) ? `(${getSkinPrice('paddle', skin)} moedas)` : '(desbloqueado)'}
    </option>
  `).join('');

  const ballOptions = DEFAULT_SKINS.ball.map(skin => `
    <option value="${skin}" ${skin === playerBallSkin ? 'selected' : ''} ${!unlockedBall.includes(skin) ? 'disabled' : ''}>
      ${skin.charAt(0).toUpperCase() + skin.slice(1)} ${!unlockedBall.includes(skin) ? `(${getSkinPrice('ball', skin)} moedas)` : '(desbloqueado)'}
    </option>
  `).join('');

  detailsPanel.innerHTML = `
    <div class="player-detail-card">
      <h3>${playerName}</h3>
      <p><strong>Fase:</strong> <span class="level-badge">${playerPhase}</span></p>
      <p><strong>Pontuação:</strong> ${playerScore}</p>
      <p><strong>Partidas:</strong> ${playerGames}</p>
      <p><strong>Moedas:</strong> <span class="coins-display">${playerCoins}</span> 🪙</p>
      <p><strong>Última partida:</strong> ${formatDate(player?.lastPlayedAt)}</p>
      <p><strong>Cadastro:</strong> ${formatDate(player?.createdAt)}</p>
    </div>
    <div class="player-detail-card customization-panel" style="margin-top: 1rem;">
      <h3>🎨 Personalização</h3>
      <div style="display: grid; gap: 1rem; margin-top: 1rem;">
        <div>
          <label for="skin-paddle" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Skin da Raquete</label>
          <select id="skin-paddle" class="skin-select">${paddleOptions}</select>
        </div>
        <div>
          <label for="skin-ball" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Skin da Bola</label>
          <select id="skin-ball" class="skin-select">${ballOptions}</select>
        </div>
      </div>
      <p id="skin-message" style="margin-top: 0.5rem; min-height: 1.2em;"></p>
    </div>
  `;

  const paddleSelect = document.getElementById('skin-paddle');
  const ballSelect = document.getElementById('skin-ball');
  const skinMessage = document.getElementById('skin-message');

  if (paddleSelect) {
    paddleSelect.addEventListener('change', () => {
      const skinId = paddleSelect.value;
      if (!unlockedPaddle.includes(skinId)) {
        const price = getSkinPrice('paddle', skinId);
        if (playerCoins >= price) {
          if (spendCoinsCurrentPlayer(price) && unlockSkinForCurrentPlayer('paddle', skinId)) {
            equipSkinForCurrentPlayer('paddle', skinId);
            skinMessage.textContent = `Skin "${skinId}" comprada e equipada!`;
            skinMessage.style.color = '#22d3ee';
            setTimeout(() => showPlayerDetails(getCurrentPlayer()), 500);
          }
        } else {
          skinMessage.textContent = `Moedas insuficientes! Precisa de ${price} moedas.`;
          skinMessage.style.color = '#f87171';
          paddleSelect.value = playerPaddleSkin;
        }
      } else {
        equipSkinForCurrentPlayer('paddle', skinId);
        skinMessage.textContent = `Skin da raquete alterada para "${skinId}".`;
        skinMessage.style.color = '#22d3ee';
        setTimeout(() => showPlayerDetails(getCurrentPlayer()), 500);
      }
    });
  }

  if (ballSelect) {
    ballSelect.addEventListener('change', () => {
      const skinId = ballSelect.value;
      if (!unlockedBall.includes(skinId)) {
        const price = getSkinPrice('ball', skinId);
        if (playerCoins >= price) {
          if (spendCoinsCurrentPlayer(price) && unlockSkinForCurrentPlayer('ball', skinId)) {
            equipSkinForCurrentPlayer('ball', skinId);
            skinMessage.textContent = `Skin "${skinId}" comprada e equipada!`;
            skinMessage.style.color = '#22d3ee';
            setTimeout(() => showPlayerDetails(getCurrentPlayer()), 500);
          }
        } else {
          skinMessage.textContent = `Moedas insuficientes! Precisa de ${price} moedas.`;
          skinMessage.style.color = '#f87171';
          ballSelect.value = playerBallSkin;
        }
      } else {
        equipSkinForCurrentPlayer('ball', skinId);
        skinMessage.textContent = `Skin da bola alterada para "${skinId}".`;
        skinMessage.style.color = '#22d3ee';
        setTimeout(() => showPlayerDetails(getCurrentPlayer()), 500);
      }
    });
  }
}

function renderPlayers() {
  const players = loadPlayers();
  const query = searchInput.value.trim().toLocaleLowerCase();
  const filter = playerFilter.value;
  const sort = playerSort.value;
  const currentPlayer = getCurrentPlayer();

  let visiblePlayers = players.filter((player) =>
    player.name.toLocaleLowerCase().includes(query)
  );

  if (filter === "sem-partidas") {
    visiblePlayers = visiblePlayers.filter((player) => Number(player.games) === 0);
  } else if (filter === "com-partidas") {
    visiblePlayers = visiblePlayers.filter((player) => Number(player.games) > 0);
  }

  if (sort === "jogador-asc") {
    visiblePlayers.sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
  } else if (sort === "data-desc") {
    visiblePlayers.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  playersTable.replaceChildren();

  if (visiblePlayers.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 7;
    emptyCell.textContent =
      players.length === 0
        ? "Ainda não há jogadores cadastrados."
        : "Nenhum jogador corresponde à pesquisa.";
    emptyRow.append(emptyCell);
    playersTable.append(emptyRow);
    return;
  }

  for (const player of visiblePlayers) {
    const row = document.createElement("tr");
    if (currentPlayer && player.id === currentPlayer.id) {
      row.classList.add("current-player-row");
    }

    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = player.name + (currentPlayer && player.id === currentPlayer.id ? " ✦" : "");

    const score = document.createElement("td");
    score.textContent = Number(player.score || 0);
    score.className = "score-value";

    const coins = document.createElement("td");
    coins.textContent = `${player.coins || 0} 🪙`;
    coins.className = "coins-value";

    const level = document.createElement("td");
    const currentPhase = player.phase || getPlayerPhase(Number(player.score) || 0);
    level.innerHTML = `<span class="level-badge">${currentPhase}</span>`;

    const games = document.createElement("td");
    games.textContent = Number(player.games) === 0 ? "Sem partidas" : String(player.games);

    const created = document.createElement("td");
    const createdTime = document.createElement("time");
    createdTime.dateTime = player.createdAt;
    createdTime.textContent = formatDate(player.createdAt);
    created.append(createdTime);

    const actions = document.createElement("td");
    actions.className = "action-buttons";

    const detailsButton = document.createElement("button");
    detailsButton.className = "action-btn view";
    detailsButton.type = "button";
    detailsButton.textContent = "Ver detalhes";
    detailsButton.addEventListener("click", () => showPlayerDetails(player));

    const selectButton = document.createElement("button");
    selectButton.className = "action-btn select";
    selectButton.type = "button";
    selectButton.textContent = currentPlayer && player.id === currentPlayer.id ? "Jogador atual" : "Entrar";
    selectButton.disabled = currentPlayer && player.id === currentPlayer.id;
    selectButton.addEventListener("click", () => {
      setCurrentPlayer(player.id);
      refreshAll();
      showPlayerDetails(player);
      registrationMessage.textContent = `Logado como ${player.name}.`;
    });

    const editButton = document.createElement("button");
    editButton.className = "action-btn edit";
    editButton.type = "button";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => {
      const updatedName = window.prompt("Novo nome de jogador:", player.name)?.trim();
      if (!updatedName) {
        return;
      }

      const nameIsTaken = players.some(
        (savedPlayer) =>
          savedPlayer.id !== player.id &&
          savedPlayer.name.toLocaleLowerCase() === updatedName.toLocaleLowerCase()
      );

      if (nameIsTaken) {
        registrationMessage.textContent = "Esse nome de jogador já está cadastrado.";
        return;
      }

      player.name = updatedName;
      player.phase = getPlayerPhase(Number(player.score) || 0);
      savePlayers(players);
      refreshAll();
      showPlayerDetails(player);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "action-btn delete";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", () => {
      if (!window.confirm(`Excluir o jogador ${player.name}?`)) {
        return;
      }

      const remainingPlayers = players.filter((savedPlayer) => savedPlayer.id !== player.id);
      savePlayers(remainingPlayers);
      if (currentPlayer && currentPlayer.id === player.id) {
        clearCurrentPlayer();
      }
      if (detailsPanel && detailsPanel.textContent.includes(player.name)) {
        detailsPanel.innerHTML = '<p>Os detalhes serão exibidos após o cadastro de um jogador.</p>';
      }
      refreshAll();
    });

    actions.append(detailsButton, selectButton, editButton, deleteButton);
    row.append(name, score, coins, level, games, created, actions);
    playersTable.append(row);
  }
}

function registerPlayer(name) {
  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    registrationMessage.textContent = "O nome deve ter pelo menos 3 caracteres.";
    return;
  }

  const players = loadPlayers();
  const alreadyRegistered = players.some(
    (player) => player.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase()
  );

  if (alreadyRegistered) {
    registrationMessage.textContent = "Esse nome de jogador já está cadastrado.";
    return;
  }

  const newPlayer = {
    id: Date.now(),
    name: trimmedName,
    score: 0,
    phase: "Iniciante",
    games: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    lastPlayedAt: "",
    coins: 0,
    paddleSkin: "default",
    ballSkin: "default",
    unlockedPaddleSkins: ["default"],
    unlockedBallSkins: ["default"],
  };

  players.push(newPlayer);
  savePlayers(players);
  registrationForm.reset();
  registrationMessage.textContent = "Jogador cadastrado com sucesso.";
  refreshAll();
  showPlayerDetails(newPlayer);
}

registrationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const nameInput = document.getElementById("novo-jogador");
  registerPlayer(nameInput.value);
});

searchInput.addEventListener("input", renderPlayers);
playerFilter.addEventListener("change", renderPlayers);
playerSort.addEventListener("change", renderPlayers);

function refreshAll() {
  renderPlayers();
  updatePlayerDisplay();
  const currentPlayer = getCurrentPlayer();
  if (currentPlayer) {
    showPlayerDetails(currentPlayer);
  }
}

async function loadSpaceFact() {
  if (!spaceFactPanel) {
    return;
  }

  try {
    const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!response.ok) {
      throw new Error("Resposta inválida da API");
    }

    const fact = await response.json();
    const latitude = Number(fact.latitude).toFixed(2);
    const longitude = Number(fact.longitude).toFixed(2);
    const velocity = Number(fact.velocity).toFixed(1);

    spaceFactPanel.innerHTML = `
      <div class="space-fact-card">
        <p class="space-fact-label">Rastreamento espacial</p>
        <h3>Estação Espacial Internacional</h3>
        <p><strong>Latitude:</strong> ${latitude}°</p>
        <p><strong>Longitude:</strong> ${longitude}°</p>
        <p><strong>Velocidade:</strong> ${velocity} km/h</p>
        <p>Os dados acima são atualizados em tempo real pela API pública Where the ISS at.</p>
      </div>
    `;
  } catch (error) {
    console.error("Erro ao buscar dado da ISS:", error);
    spaceFactPanel.innerHTML = `
      <div class="space-fact-card fallback">
        <p class="space-fact-label">Rastreamento espacial</p>
        <h3>Dados da ISS indisponíveis</h3>
        <p>O painel espacial não pôde carregar agora, mas a aplicação continua funcionando normalmente.</p>
      </div>
    `;
  }
}

  try {
    refreshAll();
    loadSpaceFact();
  } catch (error) {
    registrationMessage.textContent = "Não foi possível carregar os jogadores salvos neste navegador.";
    console.error("Falha ao carregar jogadores locais:", error);
  }
}

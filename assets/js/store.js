const PLAYERS_STORAGE_KEY = "breakout-players";
const CURRENT_PLAYER_KEY = "breakout-current-player";

const SKIN_CATALOG = {
  paddle: [
    { id: 'neon', name: 'Neon', price: 500, description: 'Raquete com brilho neon rosa', preview: '#f472e8' },
    { id: 'fire', name: 'Fogo', price: 800, description: 'Raquete com efeito de chamas', preview: '#fb923c' },
    { id: 'ice', name: 'Gelo', price: 800, description: 'Raquete com brilho glacial', preview: '#67e8f9' },
    { id: 'galaxy', name: 'Galáxia', price: 1200, description: 'Raquete com padrão galáctico', preview: '#a78bfa' },
    { id: 'gold', name: 'Ouro', price: 2000, description: 'Raquete dourada lendária', preview: '#fbbf24' }
  ],
  ball: [
    { id: 'neon', name: 'Neon', price: 300, description: 'Bola com brilho neon rosa', preview: '#f472e8' },
    { id: 'fire', name: 'Fogo', price: 500, description: 'Bola com efeito de chamas', preview: '#fb923c' },
    { id: 'ice', name: 'Gelo', price: 500, description: 'Bola com brilho glacial', preview: '#67e8f9' },
    { id: 'galaxy', name: 'Galáxia', price: 800, description: 'Bola com padrão galáctico', preview: '#a78bfa' },
    { id: 'gold', name: 'Ouro', price: 1500, description: 'Bola dourada lendária', preview: '#fbbf24' }
  ]
};

const storeGrid = document.getElementById("store-grid");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");
const playerCoinsDisplay = document.getElementById("player-coins");

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

function updateCoinsDisplay() {
  const player = getCurrentPlayer();
  if (playerCoinsDisplay) {
    playerCoinsDisplay.textContent = `${player?.coins || 0} 🪙`;
  }
}

function isSkinUnlocked(player, type, skinId) {
  const key = type === 'paddle' ? 'unlockedPaddleSkins' : 'unlockedBallSkins';
  return player[key]?.includes(skinId) ?? false;
}

function isSkinEquipped(player, type, skinId) {
  const key = type === 'paddle' ? 'paddleSkin' : 'ballSkin';
  return player[key] === skinId;
}

function renderStore() {
  if (!storeGrid) return;
  const player = getCurrentPlayer();
  updateCoinsDisplay();

  const allSkins = [
    ...SKIN_CATALOG.paddle.map(s => ({ ...s, type: 'paddle' })),
    ...SKIN_CATALOG.ball.map(s => ({ ...s, type: 'ball' }))
  ];

  storeGrid.innerHTML = allSkins
    .map((skin) => {
      const unlocked = player ? isSkinUnlocked(player, skin.type, skin.id) : false;
      const equipped = player ? isSkinEquipped(player, skin.type, skin.id) : false;
      const canAfford = player && (player.coins || 0) >= skin.price;
      
      let buttonHtml = '';
      if (unlocked) {
        if (equipped) {
          buttonHtml = `<button class="btn-submit small" type="button" disabled style="background: #22d3ee;">Equipada</button>`;
        } else {
          buttonHtml = `<button class="btn-submit small" type="button" data-type="${skin.type}" data-id="${skin.id}" data-action="equip">Equipar</button>`;
        }
      } else {
        buttonHtml = `<button class="btn-submit small" type="button" data-type="${skin.type}" data-id="${skin.id}" data-price="${skin.price}" ${!canAfford ? 'disabled' : ''} data-action="buy">Comprar (${skin.price} 🪙)</button>`;
      }

      return `
        <article class="store-card" style="border-left: 4px solid ${skin.preview};">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: ${skin.preview}; box-shadow: 0 0 15px ${skin.preview};"></div>
            <div>
              <h3 style="margin: 0;">${skin.name} (${skin.type === 'paddle' ? 'Raquete' : 'Bola'})</h3>
              <small style="color: #888;">${skin.type === 'paddle' ? 'Skin de raquete' : 'Skin de bola'}</small>
            </div>
          </div>
          <p style="font-size: 0.9rem; color: #ccc;">${skin.description}</p>
          <div class="store-card-row">
            <strong style="color: ${unlocked ? '#22d3ee' : (canAfford ? '#fbbf24' : '#f87171')};">
              ${unlocked ? 'DESBLOQUEADA' : `${skin.price} 🪙`}
            </strong>
            ${buttonHtml}
          </div>
        </article>
      `;
    })
    .join("");

  storeGrid.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      const id = button.dataset.id;
      const action = button.dataset.action;
      const price = Number(button.dataset.price || 0);
      
      if (action === 'buy') {
        buySkin(type, id, price);
      } else if (action === 'equip') {
        equipSkin(type, id);
      }
    });
  });
}

function buySkin(type, skinId, price) {
  const player = getCurrentPlayer();
  if (!player) {
    alert("Faça login no Sistema para comprar skins!");
    return;
  }

  if ((player.coins || 0) < price) {
    alert("Moedas insuficientes! Jogue mais partidas para ganhar moedas.");
    return;
  }

  const key = type === 'paddle' ? 'unlockedPaddleSkins' : 'unlockedBallSkins';
  if (!player[key]) player[key] = ['default'];
  if (player[key].includes(skinId)) {
    alert("Você já possui esta skin!");
    return;
  }

  player.coins -= price;
  player[key].push(skinId);
  player[`${type}Skin`] = skinId;
  
  savePlayerData(player);
  updateCoinsDisplay();
  renderStore();
  alert(`Skin "${skinId}" comprada e equipada com sucesso!`);
}

function equipSkin(type, skinId) {
  const player = getCurrentPlayer();
  if (!player) {
    alert("Faça login no Sistema para equipar skins!");
    return;
  }

  const key = type === 'paddle' ? 'unlockedPaddleSkins' : 'unlockedBallSkins';
  if (!player[key]?.includes(skinId)) {
    alert("Você não possui esta skin!");
    return;
  }

  player[`${type}Skin`] = skinId;
  savePlayerData(player);
  renderStore();
  alert(`Skin "${skinId}" equipada!`);
}

renderStore();
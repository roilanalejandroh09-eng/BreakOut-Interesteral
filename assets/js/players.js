const registrationForm = document.getElementById("cadastro-jogador");
const registrationMessage = document.getElementById("cadastro-mensagem");
const playersTable = document.getElementById("lista-jogadores");
const searchInput = document.getElementById("pesquisa-jogador");
const playerFilter = document.getElementById("filtro-resultado");
const playerSort = document.getElementById("ordenacao");
const playersStorageKey = "breakout-players";

function loadPlayers() {
  const savedPlayers = localStorage.getItem(playersStorageKey);
  if (!savedPlayers) {
    return [];
  }

  const players = JSON.parse(savedPlayers);
  if (
    !Array.isArray(players) ||
    players.some(
      (player) =>
        typeof player.name !== "string" ||
        typeof player.games !== "number" ||
        typeof player.createdAt !== "string"
    )
  ) {
    throw new Error("Os dados salvos de jogadores estão em formato inválido.");
  }
  return players;
}

function renderPlayers() {
  const players = loadPlayers();
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const filter = playerFilter.value;
  const sort = playerSort.value;
  let visiblePlayers = players.filter((player) =>
    player.name.toLocaleLowerCase("pt-BR").includes(query)
  );

  if (filter === "sem-partidas") {
    visiblePlayers = visiblePlayers.filter((player) => player.games === 0);
  } else if (filter === "com-partidas") {
    visiblePlayers = visiblePlayers.filter((player) => player.games > 0);
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
    emptyCell.colSpan = 6;
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
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = player.name;

    const score = document.createElement("td");
    score.textContent = "—";
    const level = document.createElement("td");
    level.textContent = "—";
    const games = document.createElement("td");
    games.textContent = player.games === 0 ? "Sem partidas" : String(player.games);
    const created = document.createElement("td");
    const createdTime = document.createElement("time");
    createdTime.dateTime = player.createdAt;
    createdTime.textContent = new Date(`${player.createdAt}T00:00:00`).toLocaleDateString("pt-BR");
    created.append(createdTime);

    const actions = document.createElement("td");
    actions.className = "action-buttons";
    const detailsButton = document.createElement("button");
    detailsButton.className = "action-btn view";
    detailsButton.type = "button";
    detailsButton.textContent = "Ver detalhes";
    detailsButton.addEventListener("click", () => {
      document.getElementById("detalhes-jogador").textContent =
        `${player.name} ainda não possui partidas registradas.`;
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
          savedPlayer.name.toLocaleLowerCase("pt-BR") === updatedName.toLocaleLowerCase("pt-BR") &&
          savedPlayer.name !== player.name
      );
      if (nameIsTaken) {
        registrationMessage.textContent = "Esse nome de jogador já está cadastrado.";
        return;
      }

      player.name = updatedName;
      localStorage.setItem(playersStorageKey, JSON.stringify(players));
      renderPlayers();
    });
    const deleteButton = document.createElement("button");
    deleteButton.className = "action-btn delete";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", () => {
      if (!window.confirm(`Excluir o jogador ${player.name}?`)) {
        return;
      }

      const remainingPlayers = players.filter((savedPlayer) => savedPlayer.name !== player.name);
      localStorage.setItem(playersStorageKey, JSON.stringify(remainingPlayers));
      renderPlayers();
    });
    actions.append(detailsButton, editButton, deleteButton);

    row.append(name, score, level, games, created, actions);
    playersTable.append(row);
  }
}

registrationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("novo-jogador").value.trim();

  try {
    const players = loadPlayers();
    const alreadyRegistered = players.some(
      (player) => player.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR")
    );
    if (alreadyRegistered) {
      registrationMessage.textContent = "Esse nome de jogador já está cadastrado.";
      return;
    }

    players.push({
      name,
      games: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    localStorage.setItem(playersStorageKey, JSON.stringify(players));
    registrationForm.reset();
    registrationMessage.textContent = "Jogador cadastrado.";
    renderPlayers();
  } catch (error) {
    registrationMessage.textContent = "Não foi possível cadastrar o jogador neste navegador.";
    console.error("Falha no cadastro local do jogador:", error);
  }
});

searchInput.addEventListener("input", renderPlayers);
playerFilter.addEventListener("change", renderPlayers);
playerSort.addEventListener("change", renderPlayers);

try {
  renderPlayers();
} catch (error) {
  registrationMessage.textContent = "Não foi possível carregar os jogadores salvos neste navegador.";
  console.error("Falha ao carregar jogadores locais:", error);
}

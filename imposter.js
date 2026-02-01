const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));


const WORD_BANK = {
  Animals: ["Elephant", "Giraffe", "Dolphin", "Kangaroo", "Penguin", "Octopus", "Cheetah", "Panda", "Falcon", "Koala"],
  Foods: ["Pizza", "Sushi", "Tacos", "Pancakes", "Ramen", "Burrito", "Croissant", "Dumplings", "Gelato", "Curry"],
  Places: ["Azerbaijan","Paris", "Tokyo", "New York", "London", "Rome", "Sydney", "Cairo", "Barcelona", "Dubai", "Rio"],
  Movies: ["Titanic", "Jaws", "Frozen", "Interstellar", "Up", "Matrix", "Avengers", "Batman", "Lord of the Rings", "Star Wars"],
  Jobs: ["Doctor", "Teacher", "Chef", "Pilot", "Engineer", "Artist", "Dentist", "Firefighter", "Lawyer", "Nurse"],
  People: ["LeBron James", "Cristiano Ronaldo", "Albert Einstein", "Helen Keller", "Taylor Swift", "Beyoncé", "MrBeast", "Elon Musk", "Michael Jordan", "Kim Kardashian", "Keanu Reeves", "Zendaya", "Snoop Dogg", "Oprah Winfrey", "Jack Black", "Princess Diana", "Dr. McGuirk", "Jeiden", "Tung Tung Tung Sahur", "Hoopify", "Oscar", "Juliud", "Deb"],
  Sports: ["Football", "Soccer", "Basketball", "Baseball", "Hockey", "Tennis", "Badminton", "Swimming", "Wrestling", "Track", "Volleyball", "Golf", "Boxing", "MMA", "Cricket"],
  School: ["Math", "History", "Science", "Biology", "Chemistry", "Physics", "English", "Literature", "PE", "Art", "Music", "Computer Science", "Economics"],
  Items: ["Phone charger", "Headphones", "Laptop", "TV remote", "Backpack", "Water bottle", "Wallet", "Keys", "Jacket", "Calculator", "Microwave", "Batteries", "Alarm clock", "Bluetooth speaker", "Soccer ball", "Gift card", "Credit card", "Deck of cards"],
  FastFood: ["McDonald's", "Burger King", "Wendy's", "Taco Bell", "KFC", "Subway", "Chick-fil-A", "Domino's", "Pizza Hut", "Dunkin'", "Starbucks", "Chipotle", "Five Guys", "In-N-Out", "Shake Shack", "Arby's", "Popeyes", "Little Caesars", "Panda Express", "IHOP"]
};

const PROMPT_BANK = {
  Random: [
    { innocent: "What's the longest you've spent in car?", imposter: "How long do you spend on your phone a day?" },
    { innocent: "What is the youngest age you would date?", imposter: "Pick a number 1-50" },
    { innocent: "What is the most amount of times you've went to the bathroom in a day?", imposter: "How many Thanksgiving plates could you eat before giving up?" },
    { innocent: "How old do you think the average person lives?", imposter: "What is the lowest test score you've gotten?" },
    { innocent: "What country do you think is the most dirty?", imposter: "Pick a random country"}
  ]
};

function getPromptCategories() {
  return Object.keys(PROMPT_BANK);
}

function pickRandomPromptPair(category = null) {
  const categories = getPromptCategories();
  const cat = (category && PROMPT_BANK[category]) 
    ? category 
    : categories[Math.floor(Math.random() * categories.length)];

  const list = PROMPT_BANK[cat];
  const pair = list[Math.floor(Math.random() * list.length)];
  return { category: cat, pair };
}

function choosePromptForGame(category = null) {
  const { category: cat, pair } = pickRandomPromptPair(category);
  state.promptCategory = cat;
  state.promptPair = pair;

  const meta = $("#promptMeta");
  const preview = $("#promptPreview");
  if (meta) meta.textContent = `Random prompt selected (hidden) • Category: ${cat}`;
  if (preview) preview.value = "Random prompt selected (hidden)";
}

function getPlayerPrompt(player) {
  if (!state.promptPair) return "";
  return player.isImpostor ? state.promptPair.imposter : state.promptPair.innocent;
}

function getPromptResultsText() {
  if (!state.promptPair) return "";
  return `Innocent prompt: ${state.promptPair.innocent} | Impostor prompt: ${state.promptPair.imposter}`;
}

const state = {
  gameMode: "word",
  players: [],
  category: "",
  word: "",
  impCount: 1,
  started: false,
  activePlayerIndex: null,
  pendingRandom: null,
  starterIndex: null,
  direction: null,
  promptCategory: "Balanced",
  promptPair: null
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setError(msg) {
  $("#setupError").textContent = msg || "";
}

function getCurrentPlayerInputValues() {
  return $$("#playersContainer input").map(i => i.value);
}

function buildPlayerInputs({ preserveExistingNames = true } = {}) {
  const count = clampInt($("#playerCount").value, 3, 20);
  $("#playerCount").value = String(count);

  const existing = preserveExistingNames ? getCurrentPlayerInputValues() : [];

  const container = $("#playersContainer");
  container.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const row = document.createElement("div");
    row.className = "player-field";

    const idx = document.createElement("div");
    idx.className = "idx";
    idx.textContent = String(i + 1);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Player ${i + 1} name`;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.dataset.playerIndex = String(i);

    if (existing[i] != null) input.value = existing[i];

    row.appendChild(idx);
    row.appendChild(input);
    container.appendChild(row);
  }
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function getImpMode() {
  return ($$("input[name='impMode']").find(r => r.checked)?.value) || "exact";
}

function resolveImpostorCount(playerCount) {
  const mode = getImpMode();

  if (mode === "exact") {
    const exact = clampInt($("#impExact").value, 1, Math.min(10, playerCount - 1));
    $("#impExact").value = String(exact);
    return exact;
  }

  let min = clampInt($("#impMin").value, 1, Math.min(10, playerCount - 1));
  let max = clampInt($("#impMax").value, 1, Math.min(10, playerCount - 1));
  if (min > max) [min, max] = [max, min];
  $("#impMin").value = String(min);
  $("#impMax").value = String(max);

  return randInt(min, max);
}

function normalizeNames(rawNames) {
  const cleaned = rawNames.map(n => n.trim().replace(/\s+/g, " ")).filter(Boolean);
  return cleaned;
}

function validateSetup(names, category, word, impCount) {
  if (names.length < 3) return "Enter at least 3 player names.";
  const unique = new Set(names.map(n => n.toLowerCase()));
  if (unique.size !== names.length) return "Player names must be unique.";
  if (!category) return "Enter a category (or pick random).";
  if (!word) return "Enter a secret word (or pick random).";
  if (impCount < 1) return "There must be at least 1 impostor.";
  if (impCount >= names.length) return "Impostors must be fewer than players.";
  return "";
}

function assignRoles(names, impCount) {
  const indices = shuffle([...names.keys()]);
  const impostorIdx = new Set(indices.slice(0, impCount));

  return names.map((name, i) => ({
    name,
    isImpostor: impostorIdx.has(i),
    viewed: false
  }));
}

function showSetup() {
  $("#setup").classList.remove("hidden");
  $("#game").classList.add("hidden");
  state.started = false;
}

function showGame() {
  $("#setup").classList.add("hidden");
  $("#game").classList.remove("hidden");
  renderNamesGrid();
  updateSeenCount();
}

function renderNamesGrid() {
  const grid = $("#namesGrid");
  grid.innerHTML = "";

  state.players.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "name-btn";
    btn.disabled = p.viewed;
    btn.dataset.idx = String(idx);

    const title = document.createElement("div");
    title.textContent = p.name;

    const sub = document.createElement("span");
    sub.className = "sub";
    sub.textContent = p.viewed ? "Viewed" : "Tap to view";

    btn.appendChild(title);
    btn.appendChild(sub);

    if (p.viewed) {
      const check = document.createElement("div");
      check.className = "check";
      check.textContent = "✓";
      btn.appendChild(check);
    }

    btn.addEventListener("click", () => openPlayerModal(idx));
    grid.appendChild(btn);
  });

  const allViewed = state.players.every(p => p.viewed);
  $("#gameNote").classList.toggle("hidden", !allViewed);
}

function updateSeenCount() {
  const seen = state.players.filter(p => p.viewed).length;
  $("#seenCount").textContent = `${seen}/${state.players.length} viewed`;
}

function lockBodyScroll(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

function openPlayerModal(playerIndex) {
  const p = state.players[playerIndex];
  if (!p || p.viewed) return;

  state.activePlayerIndex = playerIndex;

  $("#flashcard").classList.remove("flipped");
  $("#btnGotIt").disabled = true;

   $("#cardPlayerName").textContent = p.name;

  const isPromptMode = state.gameMode === "prompts";

  if (isPromptMode) {
    $("#cardRole").textContent = p.isImpostor ? "IMPOSTOR" : "NOT IMPOSTOR";
    $("#cardCategory").textContent = state.promptCategory || "Prompts";

    $("#wordRow").classList.add("hidden");
    $("#promptRow").classList.remove("hidden");

    $("#cardPrompt").textContent = getPlayerPrompt(p);

    if (p.isImpostor) {
      $("#impostorHint").classList.remove("hidden");
      $("#impostorHint").textContent = "Blend in by answering naturally.";
    } else {
      $("#impostorHint").classList.add("hidden");
    }
  } else {
    $("#cardCategory").textContent = state.category;

    $("#promptRow").classList.add("hidden");

    if (p.isImpostor) {
      $("#cardRole").textContent = "IMPOSTOR";
      $("#wordRow").classList.add("hidden");
      $("#impostorHint").classList.remove("hidden");
      $("#impostorHint").textContent = "If you are the impostor, blend in using the category.";
    } else {
      $("#cardRole").textContent = "NOT IMPOSTOR";
      $("#cardWord").textContent = state.word;
      $("#wordRow").classList.remove("hidden");
      $("#impostorHint").classList.add("hidden");
    }
  }

  $("#modal").classList.remove("hidden");
  lockBodyScroll(true);

  $("#flashcard").focus();
}

function closePlayerModal() {
  $("#modal").classList.add("hidden");
  lockBodyScroll(false);
  state.activePlayerIndex = null;
}

function markActiveViewed() {
  const idx = state.activePlayerIndex;
  if (idx == null) return;
  state.players[idx].viewed = true;
  updateSeenCount();
  renderNamesGrid();
}

function pickRandomWord() {
  const categories = Object.keys(WORD_BANK);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const word = WORD_BANK[category][Math.floor(Math.random() * WORD_BANK[category].length)];
  state.pendingRandom = { category, word };
  $("#category").value = category;
  $("#secretWord").value = ""; 
  $("#randomMeta").textContent = `Random word selected (hidden) • Category: ${category}`;
  $("#secretWord").placeholder = "Random word selected (hidden)";
}

function formatDirection(dir) {
  return dir === "counterclockwise" ? "Counterclockwise" : "Clockwise";
}
function updateTurnInfoUI() {
  const el = $("#turnInfo");
  if (!el) return;
  if (!state.started || state.starterIndex == null || !state.players[state.starterIndex]) {
    el.textContent = "";
    return;
  }
  const starterName = state.players[state.starterIndex].name;
  el.textContent = `Starts: ${starterName} • Direction: ${formatDirection(state.direction)}`;
}
function chooseStarterAndDirection() {
  state.starterIndex = randInt(0, state.players.length - 1);
  state.direction = Math.random() < 0.5 ? "clockwise" : "counterclockwise";
}

function startGame() {
    if (state.gameMode === "prompts") {
  setError("");

  const playerInputs = $$("#playersContainer input");
  if (playerInputs.length === 0) buildPlayerInputs();

  const rawNames = $$("#playersContainer input").map(i => i.value);
  const names = normalizeNames(rawNames);

  const impCount = resolveImpostorCount(names.length);

  if (!state.promptPair) {
    setError("Pick a random prompt first.");
    return;
  }

  if (names.length < 3) return setError("Enter at least 3 player names.");
  const unique = new Set(names.map(n => n.toLowerCase()));
  if (unique.size !== names.length) return setError("Player names must be unique.");
  if (impCount >= names.length) return setError("Impostors must be fewer than players.");

  state.impCount = impCount;
  state.players = assignRoles(names, impCount);
  state.started = true;
  chooseStarterAndDirection();
  showGame();
  updateTurnInfoUI();
  return;
}

  setError("");

  const playerInputs = $$("#playersContainer input");
  if (playerInputs.length === 0) buildPlayerInputs();

  const rawNames = $$("#playersContainer input").map(i => i.value);
  const names = normalizeNames(rawNames);

  const categoryInput = $("#category").value.trim().replace(/\s+/g, " ");
  const wordInput = $("#secretWord").value.trim().replace(/\s+/g, " ");
  const category = categoryInput || state.pendingRandom?.category || "";
  const word = wordInput || state.pendingRandom?.word || "";

  const impCount = resolveImpostorCount(names.length);

  const err = validateSetup(names, category, word, impCount);
  if (err) {
    setError(err);
    return;
  }

  state.category = category;
  state.word = word;
  state.impCount = impCount;
  state.players = assignRoles(names, impCount);
  state.started = true;
  chooseStarterAndDirection();
  showGame();
  updateTurnInfoUI();
}

function resetViewedOnly() {
  state.players.forEach(p => p.viewed = false);
  updateSeenCount();
  renderNamesGrid();
  $("#gameNote").classList.add("hidden");
}

function newGameToSetup() {
  showSetup();
  setError("");
}

function setupImpostorModeUI() {
  const mode = getImpMode();
  const exactBox = $("#impExact");
  const minBox = $("#impMin");
  const maxBox = $("#impMax");

  const exactDisabled = mode !== "exact";
  exactBox.disabled = exactDisabled;

  const rangeDisabled = mode !== "range";
  minBox.disabled = rangeDisabled;
  maxBox.disabled = rangeDisabled;
}

function openResultsModal() {
  try {
    const catEl = $("#resultsCategory");
    const wordEl = $("#resultsWord");
    const impsEl = $("#resultsImpostors");
    const modalEl = $("#resultsModal");

    if (!catEl || !wordEl || !impsEl || !modalEl) {
      alert("Results UI is missing an element (check IDs in HTML).");
      return;
    }

    const isPromptMode = state.gameMode === "prompts";

    const wordLabel = wordEl.closest(".kv")?.querySelector(".k");
    if (wordLabel) wordLabel.textContent = isPromptMode ? "Prompts" : "Secret word";

    if (isPromptMode) {
      catEl.textContent = state.promptCategory || "—";

      wordEl.classList.add("results-prompts");
      wordEl.replaceChildren();

      const line1 = document.createElement("div");
      line1.className = "prompt-line";
      const tag1 = document.createElement("div");
      tag1.className = "prompt-tag innocent";
      tag1.textContent = "Innocent prompt:";
      const text1 = document.createElement("div");
      text1.className = "prompt-text";
      text1.textContent = state.promptPair?.innocent || "—";
      line1.append(tag1, text1);

      const sep = document.createElement("div");
      sep.className = "prompt-sep";

      const line2 = document.createElement("div");
      line2.className = "prompt-line";
      const tag2 = document.createElement("div");
      tag2.className = "prompt-tag impostor";
      tag2.textContent = "Impostor prompt:";
      const text2 = document.createElement("div");
      text2.className = "prompt-text";
      text2.textContent = state.promptPair?.imposter || "—";
      line2.append(tag2, text2);

      wordEl.append(line1, sep, line2);
    } else {
      catEl.textContent = state.category || "—";
      wordEl.classList.remove("results-prompts");
      wordEl.textContent = state.word || "—";
    }

    const imps = (state.players || []).filter(p => p.isImpostor).map(p => p.name);
    impsEl.textContent = imps.length ? imps.join(", ") : "—";

    modalEl.classList.remove("hidden");
    lockBodyScroll(true);
  } catch (err) {
    alert("Reveal results failed: " + (err?.message || err));
    console.error(err);
  }
}

function attachResultsReveal(button, ms = 1200) {
  if (!button) return;

  let timer = null;
  let pressed = false;

  const clear = () => {
    pressed = false;
    button.classList.remove("pressed");
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const openNow = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!state.started) return;
    openResultsModal();
  };

  button.addEventListener("click", openNow);

  button.addEventListener("touchend", openNow, { passive: false });
  button.addEventListener("mouseup", openNow);
  
  const start = (e) => {
    e?.preventDefault?.();
    if (!state.started) return;
    pressed = true;
    button.classList.add("pressed");
    timer = setTimeout(() => {
      if (!pressed) return;
      openResultsModal();
      clear();
    }, ms);
  };

  button.addEventListener("touchstart", start, { passive: false });
  button.addEventListener("mousedown", start);

  button.addEventListener("touchcancel", clear);
  button.addEventListener("mouseleave", clear);
  button.addEventListener("mouseup", clear);
  button.addEventListener("touchend", clear);
}

function closeResultsModal() {
  $("#resultsModal").classList.add("hidden");
  lockBodyScroll(false);
}

function init() {
  buildPlayerInputs();
  setupImpostorModeUI();
  $("#btnBuildPlayers").addEventListener("click", buildPlayerInputs);
  $("#playerCount").addEventListener("change", () => buildPlayerInputs());
  $("#playerCount").addEventListener("input", () => buildPlayerInputs());
  $("#btnRandomWord").addEventListener("click", pickRandomWord);
  $("#btnRandomPrompt").addEventListener("click", () => {
  const typed = $("#promptCategory").value.trim();
  choosePromptForGame(typed || null);
});
  $("#btnStart").addEventListener("click", startGame);
  $$("#setup input[name='impMode']").forEach(r => {
    r.addEventListener("change", setupImpostorModeUI);
  });
  $("#flashcard").addEventListener("click", () => {
    const el = $("#flashcard");
    const flipped = el.classList.toggle("flipped");
    if (flipped) $("#btnGotIt").disabled = false;
  });
  $("#btnGotIt").addEventListener("click", () => {
    markActiveViewed();
    closePlayerModal();
  });
  $("#btnCloseModal").addEventListener("click", closePlayerModal);
  $("#modal").addEventListener("click", (e) => {
    if (e.target === $("#modal")) {
    }
  });

  $("#btnReset").addEventListener("click", () => {
    if (!state.started) {
      buildPlayerInputs({ preserveExistingNames: false });
      $("#category").value = "";
      $("#secretWord").value = "";
      $("#randomMeta").textContent = "";
      setError("");
      return;
    }
    resetViewedOnly();
  });

  $("#btnNewGame").addEventListener("click", () => {
    state.players = [];
    state.category = "";
    state.word = "";
    state.impCount = 1;
    state.started = false;
    state.promptPair = null;
    state.promptCategory = "Balanced";
    $("#promptMeta").textContent = "";
    $("#promptPreview").value = "";
    $("#promptCategory").value = "";
    showSetup();
  });

  const resultsBtn = $("#btnEndSummary");
if (resultsBtn) {
  const reveal = (e) => {
    if (e) e.preventDefault();
    if (!state.started) return;
    openResultsModal();
  };
  resultsBtn.onclick = reveal;
  resultsBtn.addEventListener("touchend", reveal, { passive: false });
}

  $("#btnCloseResults").addEventListener("click", closeResultsModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("#resultsModal").classList.contains("hidden")) closeResultsModal();
    }
  });

  $("#category").addEventListener("input", () => {
  if (state.pendingRandom) {
    state.pendingRandom = null;
    $("#randomMeta").textContent = "";
    $("#secretWord").placeholder = "";
  }
});

  $("#secretWord").addEventListener("input", () => {
  if (state.pendingRandom) {
    state.pendingRandom = null;
    $("#randomMeta").textContent = "";
    $("#secretWord").placeholder = "";
  }
});


function setGameMode(mode) {
  const normalized = (mode === "prompts") ? "prompts" : "word";
  state.gameMode = normalized;

  const isWord = normalized === "word";

  const tabWord = $("#tabWord");
  const tabPrompt = $("#tabPrompt");
  if (tabWord && tabPrompt) {
    tabWord.classList.toggle("active", isWord);
    tabPrompt.classList.toggle("active", !isWord);

    tabWord.setAttribute("aria-selected", String(isWord));
    tabPrompt.setAttribute("aria-selected", String(!isWord));
  }

  const wordPanel = $("#wordSettings");
  const promptPanel = $("#promptSettings");
  if (wordPanel) wordPanel.classList.toggle("hidden", !isWord);
  if (promptPanel) promptPanel.classList.toggle("hidden", isWord);

  const subtitle = $("#modeSubtitle");
  if (subtitle) subtitle.textContent = isWord ? "Secret Word + Category" : "Prompt Game";
  
  setError("");
} 

  $("#tabWord")?.addEventListener("click", () => setGameMode("word"));
  $("#tabPrompt")?.addEventListener("click", () => setGameMode("prompts"));

  setGameMode(state.gameMode);

}
init();
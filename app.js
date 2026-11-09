import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SUPABASE KAPCSOLAT
const SUPABASE_URL = "https://cwmcfizvgqpuhdyueriz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_iEMl71FRGMQZ5dIgQI2z9w_PdQn8iHm";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = id => document.getElementById(id);

let currentUser = null;
let selectedCategory = "Vegyes";

const MAX_ERRORS = 6;

let game = {
  word: "",
  guessed: new Set(),
  errors: 0,
  solved: 0,
  xp: 0,
  ended: false
};

const WORDS = {
  "Vegyes": [
    ["KALAND","közepes"],
    ["REJTÉLY","közepes"],
    ["CSILLAG","könnyű"],
    ["KULCS","könnyű"],
    ["SZABADSÁG","nehéz"],
    ["KÍSÉRLET","nehéz"]
  ],

  "Állatok": [
    ["PILLANGÓ","közepes"],
    ["KROKODIL","közepes"],
    ["ELEFÁNT","könnyű"],
    ["SÜNDISZNÓ","nehéz"],
    ["PINGVIN","könnyű"]
  ],

  "Országok": [
    ["PORTUGÁLIA","nehéz"],
    ["OLASZORSZÁG","nehéz"],
    ["KANADA","könnyű"],
    ["IZLAND","közepes"],
    ["JAPÁN","könnyű"]
  ],

  "Ételek": [
    ["PALACSINTA","nehéz"],
    ["LECSÓ","könnyű"],
    ["CSOKOLÁDÉ","nehéz"],
    ["EPER","könnyű"]
  ],

  "Filmek": [
    ["GLADIÁTOR","nehéz"],
    ["AVATAR","könnyű"],
    ["JURASSIC","közepes"],
    ["TITANIC","közepes"]
  ],

  "Sport": [
    ["KOSÁRLABDA","nehéz"],
    ["ÚSZÁS","könnyű"],
    ["RÖPLABDA","közepes"],
    ["MARATON","közepes"]
  ],

  "Foglalkozások": [
    ["FOTÓS","könnyű"],
    ["VILLANYSZERELŐ","nehéz"],
    ["ÁLLATORVOS","nehéz"],
    ["PILÓTA","könnyű"]
  ],

  "Természet": [
    ["VÍZESÉS","közepes"],
    ["SZIVÁRVÁNY","nehéz"],
    ["HEGYVIDÉK","nehéz"],
    ["TENGER","könnyű"]
  ],

  "Tárgyak": [
    ["NAPTÁR","könnyű"],
    ["TÁVIRÁNYÍTÓ","nehéz"],
    ["BŐRÖND","közepes"],
    ["ZSEBLÁMPA","nehéz"]
  ],

  "Városok": [
    ["BUDAPEST","közepes"],
    ["DEBRECEN","közepes"],
    ["LONDON","könnyű"],
    ["BARCELONA","nehéz"]
  ],

  "Zene": [
    ["GITÁR","könnyű"],
    ["KONCERT","közepes"],
    ["HEGEDŰ","közepes"]
  ],

  "Nehéz szavak": [
    ["KIFÜRKÉSZHETETLEN","nehéz"],
    ["MEGSZELÍDÍTHETETLEN","nehéz"],
    ["ÖSSZEFÜGGÉSTELEN","nehéz"]
  ]
};

const ALPHABET = [..."AÁBCDEÉFGHIÍJKLMNOÓÖŐPQRSTUÚÜŰVWXYZ"];

// SEGÉDFÜGGVÉNYEK

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}

const views = [
  "home",
  "games",
  "game",
  "duel",
  "tournament",
  "ranking",
  "profile"
];

function setView(name) {
  if (!views.includes(name)) name = "home";

  views.forEach(view => {
    $(view + "View").classList.toggle(
      "active",
      view === name
    );
  });

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.view === name
    );
  });

  document.querySelector(".main-nav").classList.remove("open");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// NAVIGÁCIÓ

document.querySelectorAll("[data-view]").forEach(el => {
  el.addEventListener("click", () => {
    setView(el.dataset.view);
  });
});

document.querySelectorAll("[data-mode]").forEach(el => {
  el.addEventListener("click", () => {
    startMode(el.dataset.mode);
  });
});

$("menuToggle").addEventListener("click", () => {
  document.querySelector(".main-nav").classList.toggle("open");
});

$("profileButton").addEventListener("click", () => {
  setView("profile");
});

$("profileButton2").addEventListener("click", () => {
  setView("profile");
});

// JÁTÉKSZABÁLYOK

$("howButton").addEventListener("click", () => {
  $("howDialog").showModal();
});

$("closeHow").addEventListener("click", () => {
  $("howDialog").close();
});

$("gotIt").addEventListener("click", () => {
  $("howDialog").close();
});

// KATEGÓRIÁK

document.querySelectorAll(".category").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedCategory = btn.dataset.category;

    document.querySelectorAll(".category").forEach(b => {
      b.classList.toggle("selected", b === btn);
    });

    toast("Kategória: " + selectedCategory);
  });
});

// JÁTÉKMÓDOK

function startMode(mode) {

  if (mode === "solo") {
    startSolo();
  }

  if (mode === "duel") {
    setView("duel");
  }

  if (mode === "tournament") {
    setView("tournament");
  }

}

// SOLO JÁTÉK

function startSolo() {

  game = {
    word: "",
    guessed: new Set(),
    errors: 0,
    solved: game.solved || 0,
    xp: game.xp || 0,
    ended: false
  };

  const list = WORDS[selectedCategory] || WORDS.Vegyes;

  const entry = list[
    Math.floor(Math.random() * list.length)
  ];

  game.word = entry[0];

  $("gameModeLabel").textContent =
    "SOLO / " + selectedCategory.toUpperCase();

  $("gameTitle").textContent = "TALÁLD KI A SZÓT";

  $("currentCategory").textContent =
    selectedCategory.toUpperCase();

  $("currentDifficulty").textContent =
    entry[1].toUpperCase();

  $("gameHint").textContent =
    "Válassz egy betűt, és derítsd ki a titkos szót!";

  renderGame();

  setView("game");
}

// JÁTÉK KIRAJZOLÁSA

function renderGame() {

  $("wordSlots").replaceChildren();

  [...game.word].forEach(letter => {

    const slot = document.createElement("span");

    slot.className = "letter-slot";

    slot.textContent =
      game.guessed.has(letter) || game.ended
        ? letter
        : "";

    $("wordSlots").append(slot);

  });

  $("keyboard").replaceChildren();

  ALPHABET.forEach(letter => {

    const key = document.createElement("button");

    key.className = "key";
    key.textContent = letter;

    key.disabled =
      game.guessed.has(letter) || game.ended;

    key.classList.toggle(
      "correct",
      game.guessed.has(letter) && game.word.includes(letter)
    );

    key.classList.toggle(
      "wrong",
      game.guessed.has(letter) && !game.word.includes(letter)
    );

    key.addEventListener("click", () => {
      guess(letter);
    });

    $("keyboard").append(key);

  });

  $("lives").textContent =
    Array.from(
      { length: MAX_ERRORS },
      (_, i) => i < MAX_ERRORS - game.errors ? "♥" : "♡"
    ).join(" ");

  $("guessCount").textContent =
    game.errors + " / " + MAX_ERRORS + " HIBA";

  $("solvedCount").textContent = game.solved;

  $("earnedXp").textContent = game.xp;

  drawHangman();

}

// AKASZTÓFA RAJZ

function drawHangman() {

  const parts = $("hangmanSvg").querySelectorAll(".person>*");

  parts.forEach((part, index) => {
    part.style.opacity =
      index < game.errors ? "1" : "0";
  });

}

// BETŰVÁLASZTÁS

function guess(letter) {

  if (game.ended || game.guessed.has(letter)) {
    return;
  }

  game.guessed.add(letter);

  if (!game.word.includes(letter)) {
    game.errors++;
  }

  const won = [...game.word].every(letter =>
    game.guessed.has(letter)
  );

  if (won) {

    game.ended = true;

    game.solved++;

    const reward =
      100 + Math.max(0, (MAX_ERRORS - game.errors) * 15);

    game.xp += reward;

    $("gameHint").textContent =
      "✦ SIKER! Megfejtetted: " +
      game.word +
      " · +" +
      reward +
      " XP";

    updateProfileStats();
    updateDaily();
    saveLocalScore();

    toast("Gratulálok! Megfejtetted a szót!");

  } else if (game.errors >= MAX_ERRORS) {

    game.ended = true;

    $("gameHint").textContent =
      "VÉGE A KÖRNEK! A megfejtés: " + game.word;

    toast("Most nem sikerült – jöhet a visszavágó!");

  } else {

    $("gameHint").textContent =
      game.word.includes(letter)
        ? "Jó találat! Folytasd!"
        : "Ez most nem talált. Próbálkozz tovább!";

  }

  renderGame();

}

$("newWordButton").addEventListener("click", startSolo);

// HELYI STATISZTIKÁK

function getLocalStats() {

  try {

    return JSON.parse(
      localStorage.getItem("hangmanStats") ||
      '{"xp":0,"solved":0,"wins":0,"daily":0,"name":"Vendég játékos"}'
    );

  } catch {

    return {
      xp: 0,
      solved: 0,
      wins: 0,
      daily: 0,
      name: "Vendég játékos"
    };

  }

}

function saveLocalScore() {

  const stats = getLocalStats();

  stats.xp += Math.max(
    0,
    game.xp - (stats.sessionXp || 0)
  );

  stats.solved = game.solved;
  stats.wins = game.solved;
  stats.sessionXp = game.xp;

  stats.name =
    currentUser?.user_metadata?.username ||
    stats.name;

  localStorage.setItem(
    "hangmanStats",
    JSON.stringify(stats)
  );

  renderRanking();
  updateProfileStats();

}

function updateProfileStats() {

  const stats = getLocalStats();

  const name =
    currentUser?.user_metadata?.username ||
    stats.name ||
    "Vendég játékos";

  $("profileName").textContent = name;

  $("profileAvatar").textContent =
    name[0].toUpperCase();

  $("miniName").textContent = name;

  $("profileEmail").textContent =
    currentUser?.email ||
    "Helyi vendégprofil";

  $("profileXp").textContent =
    game.xp || stats.xp;

  $("profileSolved").textContent =
    game.solved || stats.solved;

  $("profileWins").textContent =
    game.solved || stats.wins;

}

function updateDaily() {

  const stats = getLocalStats();

  stats.daily = Math.min(
    3,
    (stats.daily || 0) + 1
  );

  localStorage.setItem(
    "hangmanStats",
    JSON.stringify(stats)
  );

  $("dailyProgress").style.width =
    (stats.daily / 3 * 100) + "%";

  $("dailyCount").textContent =
    stats.daily + " / 3 TELJESÍTVE";

}

function renderRanking() {

  const stats = getLocalStats();

  const list = $("rankingList");

  const fullList = $("rankingListFull");

  list.replaceChildren();
  fullList.replaceChildren();

  if (!stats.xp) {

    list.innerHTML =
      '<div class="empty-state">Még nincsenek eredmények.</div>';

    fullList.innerHTML =
      '<div class="empty-state">Még nincsenek eredmények. Legyél te az első!</div>';

    return;

  }

  const row = document.createElement("div");

  row.className = "mini-rank";

  row.innerHTML =
    "<i>1</i><b></b><span></span>";

  row.querySelector("b").textContent =
    stats.name || "Vendég játékos";

  row.querySelector("span").textContent =
    stats.xp + " XP";

  list.append(row);

  const fullRow = document.createElement("div");

  fullRow.className = "ranking-row";

  fullRow.innerHTML =
    "<strong>01</strong><b></b><span></span>";

  fullRow.querySelector("b").textContent =
    stats.name || "Vendég játékos";

  fullRow.querySelector("span").textContent =
    stats.xp + " XP";

  fullList.append(fullRow);

}

function loadDaily() {

  const stats = getLocalStats();

  const daily = Math.min(3, stats.daily || 0);

  $("dailyProgress").style.width =
    (daily / 3 * 100) + "%";

  $("dailyCount").textContent =
    daily + " / 3 TELJESÍTVE";

}

// SUPABASE REGISZTRÁCIÓ ÉS BEJELENTKEZÉS

async function auth(kind) {

  const username =
    $("authUsername").value.trim();

  const email =
    $("authEmail").value.trim();

  const password =
    $("authPassword").value;

  if (!email || !password) {

    $("authMessage").textContent =
      "Add meg az e-mail-címedet és a jelszavadat.";

    return;

  }

  if (password.length < 6) {

    $("authMessage").textContent =
      "A jelszó legalább 6 karakter legyen.";

    return;

  }

  if (
    kind === "register" &&
    !/^[A-Za-z0-9_]{3,20}$/.test(username)
  ) {

    $("authMessage").textContent =
      "A felhasználónév 3–20 karakteres legyen.";

    return;

  }

  $("registerButton").disabled = true;
  $("loginButton").disabled = true;

  try {

    let result;

    if (kind === "register") {

      result = await supabase.auth.signUp({

        email,
        password,

        options: {
          data: {
            username
          }
        }

      });

    } else {

      result = await supabase.auth.signInWithPassword({
        email,
        password
      });

    }

    if (result.error) {
      throw result.error;
    }

    if (result.data.session) {

      currentUser = result.data.user;

      $("authMessage").textContent =
        kind === "register"
          ? "Sikeres regisztráció!"
          : "Sikeres bejelentkezés!";

      $("authState").textContent =
        "BEJELENTKEZVE";

      $("logoutButton").hidden = false;
      $("registerButton").hidden = true;
      $("loginButton").hidden = true;

      updateProfileStats();

      toast("Üdv az arénában!");

    } else {

      $("authMessage").textContent =
        "Ellenőrizd az e-mailjeidet a regisztráció befejezéséhez.";

    }

  } catch (error) {

    $("authMessage").textContent =
      "Hiba: " + error.message;

  } finally {

    $("registerButton").disabled = false;
    $("loginButton").disabled = false;

  }

}

$("registerButton").addEventListener("click", () => {
  auth("register");
});

$("loginButton").addEventListener("click", () => {
  auth("login");
});

$("logoutButton").addEventListener("click", async () => {

  const { error } = await supabase.auth.signOut();

  if (error) {
    toast(error.message);
    return;
  }

  currentUser = null;

  $("authState").textContent = "VENDÉG";

  $("logoutButton").hidden = true;
  $("registerButton").hidden = false;
  $("loginButton").hidden = false;

  updateProfileStats();

  toast("Kijelentkeztél.");

});

// DUEL FELÜLET

$("challengeMode").addEventListener("click", () => {

  toast(
    "Az egyedi szófeladás szerveroldali fejlesztése még szükséges."
  );

});

$("createRoom").addEventListener("click", () => {

  if (!currentUser) {

    toast("A szobakód létrehozásához jelentkezz be!");

    setView("profile");

    return;

  }

  const code =
    Math.random().toString(36).slice(2,8).toUpperCase();

  $("roomCodeInput").value = code;

  $("roomInfo").hidden = false;

  $("roomInfo").textContent =
    "Szobád elkészült: " +
    code +
    " · Küldd el a kódot a barátodnak!";

  $("duelStatus").textContent =
    "A valódi online párbajszinkron még szerveroldali fejlesztést igényel.";

});

$("joinRoom").addEventListener("click", () => {

  const code =
    $("roomCodeInput").value.trim().toUpperCase();

  if (!code) {

    $("duelStatus").textContent =
      "Írd be a szobakódot!";

    return;

  }

  if (!currentUser) {

    $("duelStatus").textContent =
      "A csatlakozáshoz előbb jelentkezz be.";

    setView("profile");

    return;

  }

  $("duelStatus").textContent =
    "A " + code +
    " kód ellenőrzéséhez a valódi szerveroldali párbajrendszer szükséges.";

});

// INDULÁSKOR SUPABASE ELLENŐRZÉS

async function initialize() {

  try {

    const { data: { session } } =
      await supabase.auth.getSession();

    if (session) {

      currentUser = session.user;

      $("authState").textContent =
        "BEJELENTKEZVE";

      $("logoutButton").hidden = false;
      $("registerButton").hidden = true;
      $("loginButton").hidden = true;

    }

  } catch (error) {

    console.error("Supabase kapcsolat:", error);

  }

  updateProfileStats();
  renderRanking();
  loadDaily();

}

supabase.auth.onAuthStateChange((event, session) => {

  currentUser = session?.user || null;

  if (event === "SIGNED_OUT") {

    $("authState").textContent = "VENDÉG";

    $("logoutButton").hidden = true;
    $("registerButton").hidden = false;
    $("loginButton").hidden = false;

  }

  updateProfileStats();

});

initialize();

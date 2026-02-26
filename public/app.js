const ADMIN_ID = "kimuti";
const ADMIN_PASSWORD = "tomatoma";
const STORAGE_KEY = "kimuchiGameData";

const defaultData = {
  users: {},
  chat: [],
  currentSession: null,
};

const gachaTable = [
  { type: "item", value: "回復ポーション", weight: 30 },
  { type: "item", value: "バリアシールド", weight: 20 },
  { type: "item", value: "スピードブーツ", weight: 15 },
  { type: "stamp", value: "🔥", weight: 15 },
  { type: "stamp", value: "👏", weight: 10 },
  { type: "stamp", value: "😺", weight: 10 },
];

const el = {
  loginScreen: document.getElementById("loginScreen"),
  homeScreen: document.getElementById("homeScreen"),
  gameSelectScreen: document.getElementById("gameSelectScreen"),
  gameScreen: document.getElementById("gameScreen"),
  gachaScreen: document.getElementById("gachaScreen"),
  chatScreen: document.getElementById("chatScreen"),
  adminScreen: document.getElementById("adminScreen"),
  loginMessage: document.getElementById("loginMessage"),
  sessionInfo: document.getElementById("sessionInfo"),
  profileName: document.getElementById("profileName"),
  profileRole: document.getElementById("profileRole"),
  profilePoints: document.getElementById("profilePoints"),
  itemCount: document.getElementById("itemCount"),
  stampCount: document.getElementById("stampCount"),
  gameTitle: document.getElementById("gameTitle"),
  gameArea: document.getElementById("gameArea"),
  gachaResult: document.getElementById("gachaResult"),
  itemList: document.getElementById("itemList"),
  stampList: document.getElementById("stampList"),
  chatLog: document.getElementById("chatLog"),
  stampSelect: document.getElementById("stampSelect"),
  adminUsers: document.getElementById("adminUsers"),
  adminMessage: document.getElementById("adminMessage"),
};

let store = loadStore();

function loadStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);
  try {
    return { ...structuredClone(defaultData), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function getCurrentUser() {
  const session = store.currentSession;
  if (!session || session.role === "admin") return null;
  return store.users[session.username] || null;
}

function setMessage(target, text, isError = false) {
  target.textContent = text;
  target.classList.toggle("error", isError);
}

function switchAuthTab(mode) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.auth === mode);
  });
  document.getElementById("userAuthPanel").classList.toggle("hidden", mode !== "user");
  document.getElementById("adminAuthPanel").classList.toggle("hidden", mode !== "admin");
  setMessage(el.loginMessage, "");
}

function registerUser() {
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;
  if (!username || !password) return setMessage(el.loginMessage, "ユーザー名とパスワードを入力してください。", true);
  if (store.users[username]) return setMessage(el.loginMessage, "そのユーザー名は既に存在します。", true);

  store.users[username] = {
    password,
    points: 100,
    items: [],
    stamps: ["👍"],
    lastLogin: new Date().toISOString(),
    status: "offline",
    lastDaily: "",
  };
  saveStore();
  setMessage(el.loginMessage, "登録が完了しました。ログインしてください。");
}

function loginUser() {
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;
  const user = store.users[username];
  if (!user || user.password !== password) return setMessage(el.loginMessage, "ログインに失敗しました。", true);

  store.currentSession = { username, role: "user" };
  user.lastLogin = new Date().toISOString();
  user.status = "online";
  saveStore();
  renderAll();
}

function loginAdmin() {
  const id = document.getElementById("adminId").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (id !== ADMIN_ID || password !== ADMIN_PASSWORD) return setMessage(el.loginMessage, "管理者認証に失敗しました。", true);

  store.currentSession = { username: ADMIN_ID, role: "admin" };
  saveStore();
  renderAll();
}

function logout() {
  const user = getCurrentUser();
  if (user) user.status = "offline";
  store.currentSession = null;
  saveStore();
  renderAll();
}

function weightedGacha() {
  const total = gachaTable.reduce((sum, row) => sum + row.weight, 0);
  let rnd = Math.random() * total;
  for (const row of gachaTable) {
    rnd -= row.weight;
    if (rnd <= 0) return row;
  }
  return gachaTable[gachaTable.length - 1];
}

function runGacha() {
  const user = getCurrentUser();
  if (!user) return;
  if (user.points < 30) return setMessage(el.gachaResult, "ポイント不足です（30必要）。", true);
  user.points -= 30;
  const prize = weightedGacha();
  if (prize.type === "item") user.items.push(prize.value);
  if (prize.type === "stamp") user.stamps.push(prize.value);
  saveStore();
  setMessage(el.gachaResult, `獲得: ${prize.type === "item" ? "アイテム" : "スタンプ"}「${prize.value}」`);
  renderAll();
}

function claimDailyPoint() {
  const user = getCurrentUser();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastDaily === today) return setMessage(el.gachaResult, "今日は受け取り済みです。", true);
  user.lastDaily = today;
  user.points += 50;
  saveStore();
  setMessage(el.gachaResult, "デイリーポイント +50 を受け取りました。");
  renderAll();
}

function sendChat() {
  const user = getCurrentUser();
  const input = document.getElementById("chatInput");
  if (!user || !input.value.trim()) return;
  store.chat.push({ user: store.currentSession.username, text: input.value.trim(), type: "text", at: Date.now() });
  input.value = "";
  saveStore();
  renderChat();
}

function sendStamp() {
  const user = getCurrentUser();
  const stamp = el.stampSelect.value;
  if (!user || !stamp) return;
  store.chat.push({ user: store.currentSession.username, text: stamp, type: "stamp", at: Date.now() });
  saveStore();
  renderChat();
}

function grantToUser() {
  const target = document.getElementById("grantTarget").value.trim();
  const points = Number(document.getElementById("grantPoints").value || 0);
  const item = document.getElementById("grantItem").value.trim();
  const user = store.users[target];
  if (!user) return setMessage(el.adminMessage, "対象ユーザーが見つかりません。", true);
  user.points += points;
  if (item) user.items.push(item);
  saveStore();
  setMessage(el.adminMessage, `${target} に付与しました。`);
  renderAdmin();
}

function renderGame(game) {
  el.gameScreen.classList.remove("hidden");
  const user = getCurrentUser();
  if (!user) return;

  if (game === "battle") {
    el.gameTitle.textContent = "⚔️ バトルゲーム（攻撃 or 防御）";
    let myHp = 20;
    let cpuHp = 20;
    el.gameArea.innerHTML = `
      <p>あなたHP: <b id="myHp">${myHp}</b> / CPU HP: <b id="cpuHp">${cpuHp}</b></p>
      <div class="row">
        <button id="atkBtn">攻撃</button>
        <button id="defBtn">防御</button>
      </div>
      <p id="battleLog">行動を選んでください。</p>`;
    const log = document.getElementById("battleLog");

    function turn(action) {
      const cpuAction = Math.random() < 0.6 ? "attack" : "defense";
      const myDmg = action === "attack" ? (cpuAction === "defense" ? 2 : 5) : 0;
      const cpuDmg = cpuAction === "attack" ? (action === "defense" ? 2 : 5) : 0;
      cpuHp -= myDmg;
      myHp -= cpuDmg;
      document.getElementById("myHp").textContent = String(Math.max(0, myHp));
      document.getElementById("cpuHp").textContent = String(Math.max(0, cpuHp));
      if (myHp <= 0 || cpuHp <= 0) {
        const won = cpuHp <= 0 && myHp > 0;
        if (won) user.points += 40;
        saveStore();
        renderAll();
        log.textContent = won ? "勝利！ +40ポイント" : "敗北...";
        return;
      }
      log.textContent = `あなた:${action === "attack" ? "攻撃" : "防御"} / CPU:${cpuAction === "attack" ? "攻撃" : "防御"}`;
    }

    document.getElementById("atkBtn").onclick = () => turn("attack");
    document.getElementById("defBtn").onclick = () => turn("defense");
  }

  if (game === "tag") {
    el.gameTitle.textContent = "🏃 鬼ごっこ対戦（3ラウンド）";
    let round = 1;
    let score = 0;
    el.gameArea.innerHTML = `
      <p id="tagInfo">相手より速くボタンを押すと勝ち。現在: 1/3</p>
      <button id="tagBtn">ダッシュ！</button>
      <p id="tagLog"></p>`;
    const log = document.getElementById("tagLog");
    document.getElementById("tagBtn").onclick = () => {
      const player = Math.random();
      const cpu = Math.random();
      if (player > cpu) score += 1;
      log.textContent = `Round${round}: ${player > cpu ? "あなたの勝ち" : "CPUの勝ち"}`;
      round += 1;
      if (round > 3) {
        if (score >= 2) {
          user.points += 30;
          log.textContent += " / 総合勝利！ +30ポイント";
        } else {
          log.textContent += " / 総合敗北";
        }
        saveStore();
        renderAll();
      } else {
        document.getElementById("tagInfo").textContent = `相手より速くボタンを押すと勝ち。現在: ${round}/3`;
      }
    };
  }

  if (game === "shooting") {
    el.gameTitle.textContent = "🔫 シューティング対戦（5ターン）";
    let turns = 5;
    let score = 0;
    el.gameArea.innerHTML = `
      <p id="shootInfo">命中率勝負。残りターン: ${turns}</p>
      <button id="shootBtn">発射！</button>
      <p id="shootLog"></p>`;
    const log = document.getElementById("shootLog");
    document.getElementById("shootBtn").onclick = () => {
      const playerHit = Math.random() > 0.4;
      const cpuHit = Math.random() > 0.5;
      if (playerHit && !cpuHit) score += 1;
      if (!playerHit && cpuHit) score -= 1;
      turns -= 1;
      log.textContent = `あなた:${playerHit ? "命中" : "外れ"} / CPU:${cpuHit ? "命中" : "外れ"}`;
      document.getElementById("shootInfo").textContent = `命中率勝負。残りターン: ${turns}`;
      if (turns === 0) {
        if (score > 0) {
          user.points += 35;
          log.textContent += " / 勝利！ +35ポイント";
        } else {
          log.textContent += " / 引き分け or 敗北";
        }
        saveStore();
        renderAll();
      }
    };
  }

  if (game === "mini") {
    el.gameTitle.textContent = "🧩 ミニゲーム追加枠（数当て）";
    const answer = Math.floor(Math.random() * 5) + 1;
    el.gameArea.innerHTML = `
      <p>1〜5の数字を当てると +20ポイント</p>
      <div class="row">
        <input id="miniInput" type="number" min="1" max="5" placeholder="1〜5" />
        <button id="miniBtn">判定</button>
      </div>
      <p id="miniLog"></p>`;
    document.getElementById("miniBtn").onclick = () => {
      const guess = Number(document.getElementById("miniInput").value);
      const log = document.getElementById("miniLog");
      if (guess === answer) {
        user.points += 20;
        saveStore();
        renderAll();
        log.textContent = "正解！ +20ポイント";
      } else {
        log.textContent = `不正解... 正解は ${answer}`;
      }
    };
  }
}

function renderChat() {
  el.chatLog.innerHTML = "";
  store.chat.slice(-100).forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line.type === "stamp" ? `${line.user}: [STAMP] ${line.text}` : `${line.user}: ${line.text}`;
    el.chatLog.appendChild(p);
  });
  el.chatLog.scrollTop = el.chatLog.scrollHeight;
}

function renderInventory() {
  const user = getCurrentUser();
  el.itemList.innerHTML = "";
  el.stampList.innerHTML = "";
  el.stampSelect.innerHTML = "";
  if (!user) return;

  user.items.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${item}`;
    el.itemList.appendChild(li);
  });

  user.stamps.forEach((stamp, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${stamp}`;
    el.stampList.appendChild(li);
    const opt = document.createElement("option");
    opt.value = stamp;
    opt.textContent = stamp;
    el.stampSelect.appendChild(opt);
  });
}

function renderAdmin() {
  if (store.currentSession?.role !== "admin") return;
  el.adminUsers.innerHTML = "";
  Object.entries(store.users).forEach(([name, user]) => {
    const li = document.createElement("li");
    li.textContent = `${name} | points:${user.points} | items:${user.items.length} | status:${user.status}`;
    el.adminUsers.appendChild(li);
  });
}

function renderAll() {
  const session = store.currentSession;
  const isLoggedIn = Boolean(session);
  const isAdmin = session?.role === "admin";

  el.loginScreen.classList.toggle("hidden", isLoggedIn);
  el.homeScreen.classList.toggle("hidden", !isLoggedIn);
  el.gameSelectScreen.classList.toggle("hidden", !isLoggedIn || isAdmin);
  el.gameScreen.classList.toggle("hidden", !isLoggedIn || isAdmin);
  el.gachaScreen.classList.toggle("hidden", !isLoggedIn || isAdmin);
  el.chatScreen.classList.toggle("hidden", !isLoggedIn || isAdmin);
  el.adminScreen.classList.toggle("hidden", !isAdmin);

  if (!isLoggedIn) {
    el.sessionInfo.textContent = "未ログイン";
    return;
  }

  el.sessionInfo.textContent = `ログイン中: ${session.username} (${session.role})`;
  if (isAdmin) {
    el.profileName.textContent = "kimuti";
    el.profileRole.textContent = "admin";
    el.profilePoints.textContent = "-";
    el.itemCount.textContent = "-";
    el.stampCount.textContent = "-";
    renderAdmin();
    return;
  }

  const user = getCurrentUser();
  el.profileName.textContent = session.username;
  el.profileRole.textContent = "user";
  el.profilePoints.textContent = String(user.points);
  el.itemCount.textContent = String(user.items.length);
  el.stampCount.textContent = String(user.stamps.length);
  renderInventory();
  renderChat();
}

// Events

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchAuthTab(tab.dataset.auth));
});
document.getElementById("registerBtn").addEventListener("click", registerUser);
document.getElementById("userLoginBtn").addEventListener("click", loginUser);
document.getElementById("adminLoginBtn").addEventListener("click", loginAdmin);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("gachaBtn").addEventListener("click", runGacha);
document.getElementById("dailyPointBtn").addEventListener("click", claimDailyPoint);
document.getElementById("sendChatBtn").addEventListener("click", sendChat);
document.getElementById("sendStampBtn").addEventListener("click", sendStamp);
document.getElementById("grantBtn").addEventListener("click", grantToUser);

document.querySelectorAll("[data-game]").forEach((btn) => {
  btn.addEventListener("click", () => renderGame(btn.dataset.game));
});

renderAll();

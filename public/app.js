const socket = io();

const state = {
  username: null,
  role: null,
  user: null,
  onlineUsers: [],
};

const el = {
  tabs: document.querySelectorAll('.tab'),
  userAuth: document.getElementById('userAuth'),
  adminAuth: document.getElementById('adminAuth'),
  authPanel: document.getElementById('authPanel'),
  mainPanel: document.getElementById('mainPanel'),
  adminPanel: document.getElementById('adminPanel'),
  authMessage: document.getElementById('authMessage'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  adminId: document.getElementById('adminId'),
  adminPassword: document.getElementById('adminPassword'),
  profileName: document.getElementById('profileName'),
  profilePoints: document.getElementById('profilePoints'),
  profileLastLogin: document.getElementById('profileLastLogin'),
  profileOnline: document.getElementById('profileOnline'),
  onlineList: document.getElementById('onlineList'),
  chatBox: document.getElementById('chatBox'),
  chatInput: document.getElementById('chatInput'),
  stampSelect: document.getElementById('stampSelect'),
  itemList: document.getElementById('itemList'),
  stampList: document.getElementById('stampList'),
  gachaResult: document.getElementById('gachaResult'),
  gameArea: document.getElementById('gameArea'),
  adminUsers: document.getElementById('adminUsers'),
  notificationList: document.getElementById('notificationList'),
  logList: document.getElementById('logList'),
  grantUser: document.getElementById('grantUser'),
  grantPoints: document.getElementById('grantPoints'),
  grantItem: document.getElementById('grantItem'),
};

function notify(msg, ok = true) {
  el.authMessage.textContent = msg;
  el.authMessage.style.color = ok ? '#7dffb1' : '#ff9797';
}

async function api(path, method = 'GET', body) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API error');
  return data;
}

function renderOnline() {
  el.onlineList.innerHTML = state.onlineUsers
    .map((name) => `<li>${name} 🟢 オンライン</li>`)
    .join('');

  if (state.user) {
    const online = state.onlineUsers.includes(state.user.username);
    el.profileOnline.textContent = online ? '🟢 オンライン' : '⚪ オフライン';
  }
}

function renderUser() {
  if (!state.user) return;
  el.profileName.textContent = state.user.username;
  el.profilePoints.textContent = state.user.points;
  el.profileLastLogin.textContent = state.user.lastLogin || '-';

  el.itemList.innerHTML = state.user.items.map((i) => `<li>${i}</li>`).join('');
  el.stampList.innerHTML = state.user.stamps.map((s) => `<li>${s}</li>`).join('');

  el.stampSelect.innerHTML = state.user.stamps
    .map((stamp) => `<option value="${stamp}">${stamp}</option>`)
    .join('');

  renderOnline();
}

function addChatLine(content) {
  const line = document.createElement('div');
  line.textContent = content;
  el.chatBox.appendChild(line);
  el.chatBox.scrollTop = el.chatBox.scrollHeight;
}

async function refreshUserState() {
  if (!state.username || state.role !== 'user') return;
  const data = await api(`/api/state/${state.username}`);
  state.user = data.user;
  state.onlineUsers = data.onlineUsers;
  renderUser();
}

async function loadAdminDashboard() {
  const data = await api('/api/admin/dashboard');
  el.adminUsers.innerHTML = data.users
    .map((u) => `<li>${u.username} / ${u.points}pt / ${u.online ? '🟢' : '⚪'}</li>`)
    .join('');

  el.notificationList.innerHTML = data.notifications
    .slice(0, 20)
    .map((n) => `<li>[${n.type}] ${n.message}</li>`)
    .join('');

  el.logList.innerHTML = data.logs
    .slice(0, 20)
    .map((l) => `<li>${l.timestamp} - ${l.message}</li>`)
    .join('');
}

function initGame(game) {
  if (game === 'battle') {
    let hpA = 100;
    let hpB = 100;
    el.gameArea.innerHTML = `
      <h4>バトル対戦 (2人/CPU)</h4>
      <p>あなたHP: <span id="hpA">${hpA}</span> / 相手HP: <span id="hpB">${hpB}</span></p>
      <button id="attackBtn">攻撃</button>
    `;
    document.getElementById('attackBtn').onclick = () => {
      hpB -= Math.floor(Math.random() * 20) + 5;
      hpA -= Math.floor(Math.random() * 12);
      document.getElementById('hpA').textContent = Math.max(hpA, 0);
      document.getElementById('hpB').textContent = Math.max(hpB, 0);
      if (hpB <= 0) {
        addChatLine('SYSTEM: バトル勝利！ +30pt');
        socket.emit('game:match-result', { username: state.username, reward: 30, game: 'battle' });
      }
    };
  }

  if (game === 'tag') {
    el.gameArea.innerHTML = `
      <h4>鬼ごっこ対戦 (2人/CPU)</h4>
      <p>鬼から逃げ切る確率ゲーム。</p>
      <button id="runBtn">逃げる</button>
      <p id="tagResult"></p>
    `;
    document.getElementById('runBtn').onclick = () => {
      const escaped = Math.random() > 0.4;
      document.getElementById('tagResult').textContent = escaped ? '逃走成功! +20pt' : '捕まった...';
      if (escaped) socket.emit('game:match-result', { username: state.username, reward: 20, game: 'tag' });
    };
  }

  if (game === 'shooting') {
    let enemyHp = 80;
    el.gameArea.innerHTML = `
      <h4>シューティング対戦</h4>
      <p>敵HP: <span id="enemyHp">${enemyHp}</span></p>
      <button id="shootBtn">弾発射</button>
    `;
    document.getElementById('shootBtn').onclick = () => {
      enemyHp -= Math.floor(Math.random() * 15) + 8;
      document.getElementById('enemyHp').textContent = Math.max(enemyHp, 0);
      if (enemyHp <= 0) {
        addChatLine('SYSTEM: シューティング勝利！ +25pt');
        socket.emit('game:match-result', { username: state.username, reward: 25, game: 'shooting' });
      }
    };
  }

  if (game === 'future') {
    el.gameArea.innerHTML = `
      <h4>自由追加枠</h4>
      <p>ここに新ゲームを後から追加できます。</p>
    `;
  }
}

for (const tab of el.tabs) {
  tab.onclick = () => {
    el.tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'user') {
      el.userAuth.classList.remove('hidden');
      el.adminAuth.classList.add('hidden');
    } else {
      el.adminAuth.classList.remove('hidden');
      el.userAuth.classList.add('hidden');
    }
  };
}

document.getElementById('registerBtn').onclick = async () => {
  try {
    await api('/api/register', 'POST', {
      username: el.username.value.trim(),
      password: el.password.value,
    });
    notify('登録成功。ログインしてください。');
  } catch (error) {
    notify(error.message, false);
  }
};

document.getElementById('loginBtn').onclick = async () => {
  try {
    const data = await api('/api/login', 'POST', {
      username: el.username.value.trim(),
      password: el.password.value,
    });
    state.username = data.username;
    state.role = data.role;
    state.user = data.user;
    el.authPanel.classList.add('hidden');
    el.mainPanel.classList.remove('hidden');
    socket.emit('auth:user-online', { username: state.username, role: state.role });
    renderUser();
    notify('ログイン成功');
  } catch (error) {
    notify(error.message, false);
  }
};

document.getElementById('adminLoginBtn').onclick = async () => {
  try {
    const data = await api('/api/login', 'POST', {
      adminId: el.adminId.value.trim(),
      password: el.adminPassword.value,
    });
    state.username = data.username;
    state.role = 'admin';
    el.authPanel.classList.add('hidden');
    el.mainPanel.classList.remove('hidden');
    el.adminPanel.classList.remove('hidden');
    socket.emit('auth:user-online', { username: state.username, role: 'admin' });
    el.profileName.textContent = 'kimuti(admin)';
    el.profilePoints.textContent = '-';
    el.profileLastLogin.textContent = new Date().toISOString();
    await loadAdminDashboard();
  } catch (error) {
    notify(error.message, false);
  }
};

document.getElementById('refreshStateBtn').onclick = refreshUserState;

document.getElementById('chatSendBtn').onclick = () => {
  if (!state.username) return;
  socket.emit('chat:message', { username: state.username, message: el.chatInput.value });
  el.chatInput.value = '';
};

document.getElementById('stampSendBtn').onclick = () => {
  if (!state.username) return;
  socket.emit('chat:stamp', { username: state.username, stamp: el.stampSelect.value });
};

document.getElementById('gachaBtn').onclick = async () => {
  try {
    const data = await api('/api/gacha', 'POST', { username: state.username });
    state.user = data.user;
    el.gachaResult.textContent = `${data.reward.rarity} ${data.reward.value} を獲得`;
    renderUser();
  } catch (error) {
    addChatLine(`SYSTEM: ${error.message}`);
  }
};

document.querySelectorAll('.game-buttons button').forEach((btn) => {
  btn.onclick = () => initGame(btn.dataset.game);
});

document.getElementById('grantBtn').onclick = async () => {
  try {
    await api('/api/admin/grant', 'POST', {
      username: el.grantUser.value.trim(),
      points: Number(el.grantPoints.value || 0),
      item: el.grantItem.value.trim(),
    });
    await loadAdminDashboard();
  } catch (error) {
    addChatLine(`ADMIN: ${error.message}`);
  }
};

document.getElementById('forceLogoutBtn').onclick = async () => {
  try {
    await api('/api/admin/force-logout', 'POST', { username: el.grantUser.value.trim() });
    await loadAdminDashboard();
  } catch (error) {
    addChatLine(`ADMIN: ${error.message}`);
  }
};

socket.on('chat:message', ({ username, message }) => {
  addChatLine(`${username}: ${message}`);
});

socket.on('chat:stamp', ({ username, stamp }) => {
  addChatLine(`${username}: [STAMP] ${stamp}`);
});

socket.on('online:init', (onlineUsers) => {
  state.onlineUsers = onlineUsers;
  renderOnline();
});

socket.on('online:update', (onlineUsers) => {
  state.onlineUsers = onlineUsers;
  renderOnline();
  if (state.role === 'admin') loadAdminDashboard();
});

socket.on('admin:notification', (event) => {
  if (state.role === 'admin') {
    const li = document.createElement('li');
    li.textContent = `[${event.type}] ${event.message}`;
    el.notificationList.prepend(li);
  }
});

socket.on('force:logout', ({ reason }) => {
  alert(reason);
  window.location.reload();
});

socket.on('user:state', (user) => {
  state.user = user;
  renderUser();
});

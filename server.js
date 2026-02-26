const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const ADMIN_ID = 'kimuti';
const ADMIN_PASSWORD = 'tomatoma';

const dataDir = path.join(__dirname, 'data');
const usersPath = path.join(dataDir, 'users.json');
const logsPath = path.join(dataDir, 'logs.json');
const onlinePath = path.join(dataDir, 'online.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const onlineSocketMap = new Map();

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getUsers() {
  return readJson(usersPath, { users: [] });
}

function saveUsers(data) {
  writeJson(usersPath, data);
}

function getLogs() {
  return readJson(logsPath, { logs: [], notifications: [] });
}

function saveLogs(data) {
  writeJson(logsPath, data);
}

function getOnlineData() {
  return readJson(onlinePath, { onlineUsers: [] });
}

function saveOnlineData(data) {
  writeJson(onlinePath, data);
}

function pushLog(type, message, meta = {}) {
  const logsData = getLogs();
  const item = {
    type,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
  logsData.logs.unshift(item);
  logsData.notifications.unshift(item);
  logsData.logs = logsData.logs.slice(0, 500);
  logsData.notifications = logsData.notifications.slice(0, 500);
  saveLogs(logsData);

  io.to('admin-room').emit('admin:notification', item);
}

function setUserOnline(username, isOnline) {
  const onlineData = getOnlineData();
  const set = new Set(onlineData.onlineUsers);
  if (isOnline) {
    set.add(username);
  } else {
    set.delete(username);
  }
  const next = { onlineUsers: [...set] };
  saveOnlineData(next);
  io.emit('online:update', next.onlineUsers);
}

function userPublicInfo(user, onlineUsers = []) {
  return {
    username: user.username,
    points: user.points,
    items: user.items,
    stamps: user.stamps,
    lastLogin: user.lastLogin,
    online: onlineUsers.includes(user.username),
  };
}

const gachaPool = [
  { kind: 'item', value: 'Nano Blade', rarity: 'SSR', chance: 3 },
  { kind: 'item', value: 'Plasma Armor', rarity: 'SR', chance: 10 },
  { kind: 'item', value: 'Energy Drink', rarity: 'R', chance: 30 },
  { kind: 'stamp', value: '🔥', rarity: 'SR', chance: 12 },
  { kind: 'stamp', value: '🎯', rarity: 'R', chance: 20 },
  { kind: 'stamp', value: '👍', rarity: 'N', chance: 25 },
];

function gachaDraw() {
  const total = gachaPool.reduce((sum, entry) => sum + entry.chance, 0);
  let roll = Math.random() * total;
  for (const entry of gachaPool) {
    roll -= entry.chance;
    if (roll <= 0) {
      return entry;
    }
  }
  return gachaPool[gachaPool.length - 1];
}

app.use((req, _res, next) => {
  pushLog('web_access', `Web access: ${req.method} ${req.path}`, { ip: req.ip });
  next();
});

app.get('/api/config', (_req, res) => {
  res.json({ adminId: ADMIN_ID });
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (username === ADMIN_ID) {
    return res.status(400).json({ error: 'reserved username' });
  }

  const usersData = getUsers();
  if (usersData.users.find((u) => u.username === username)) {
    return res.status(409).json({ error: 'username already exists' });
  }

  const user = {
    username,
    password,
    points: 0,
    items: [],
    stamps: ['🙂'],
    lastLogin: null,
  };
  usersData.users.push(user);
  saveUsers(usersData);

  pushLog('register', `Registered: ${username}`);

  return res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { adminId, username, password } = req.body;

  if (adminId) {
    if (adminId === ADMIN_ID && password === ADMIN_PASSWORD) {
      pushLog('login_success', `Admin login success: ${adminId}`);
      return res.json({ success: true, role: 'admin', username: ADMIN_ID });
    }
    pushLog('login_failure', `Admin login failure: ${adminId}`);
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const usersData = getUsers();
  const user = usersData.users.find((u) => u.username === username && u.password === password);

  if (!user) {
    pushLog('login_failure', `User login failure: ${username || 'unknown'}`);
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  user.lastLogin = new Date().toISOString();
  saveUsers(usersData);
  pushLog('login_success', `User login success: ${username}`);

  return res.json({ success: true, role: 'user', username: user.username, user: userPublicInfo(user, getOnlineData().onlineUsers) });
});

app.get('/api/state/:username', (req, res) => {
  const { username } = req.params;
  const usersData = getUsers();
  const user = usersData.users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: 'not found' });
  const onlineUsers = getOnlineData().onlineUsers;
  res.json({ user: userPublicInfo(user, onlineUsers), onlineUsers });
});

app.post('/api/gacha', (req, res) => {
  const { username } = req.body;
  const usersData = getUsers();
  const user = usersData.users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: 'user not found' });

  const reward = gachaDraw();
  if (reward.kind === 'item') user.items.push(`${reward.value} (${reward.rarity})`);
  if (reward.kind === 'stamp') user.stamps.push(reward.value);

  saveUsers(usersData);
  pushLog('gacha', `Gacha draw by ${username}: ${reward.value} ${reward.rarity}`);
  res.json({ reward, user: userPublicInfo(user, getOnlineData().onlineUsers) });
});

app.post('/api/reward', (req, res) => {
  const { username, points } = req.body;
  const usersData = getUsers();
  const user = usersData.users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: 'user not found' });

  user.points += Number(points) || 0;
  saveUsers(usersData);
  pushLog('reward', `Reward ${points} points to ${username}`);
  res.json({ user: userPublicInfo(user, getOnlineData().onlineUsers) });
});

app.get('/api/admin/dashboard', (_req, res) => {
  const usersData = getUsers();
  const onlineUsers = getOnlineData().onlineUsers;
  const logsData = getLogs();
  res.json({
    users: usersData.users.map((user) => userPublicInfo(user, onlineUsers)),
    logs: logsData.logs,
    notifications: logsData.notifications,
    onlineUsers,
  });
});

app.post('/api/admin/grant', (req, res) => {
  const { username, points, item } = req.body;
  const usersData = getUsers();
  const user = usersData.users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ error: 'user not found' });

  if (Number.isFinite(Number(points)) && Number(points) !== 0) user.points += Number(points);
  if (item) user.items.push(item);

  saveUsers(usersData);
  pushLog('admin_action', `Grant by admin to ${username}`, { points, item });
  io.emit('user:update', { username, user: userPublicInfo(user, getOnlineData().onlineUsers) });
  res.json({ success: true });
});

app.post('/api/admin/force-logout', (req, res) => {
  const { username } = req.body;
  const socketId = onlineSocketMap.get(username);
  if (socketId) {
    io.to(socketId).emit('force:logout', { reason: 'Admin forced logout' });
  }
  pushLog('admin_action', `Force logout: ${username}`);
  res.json({ success: true });
});

io.on('connection', (socket) => {
  socket.on('auth:user-online', ({ username, role }) => {
    if (!username) return;

    socket.data.username = username;
    socket.data.role = role;

    if (role === 'admin') {
      socket.join('admin-room');
    } else {
      setUserOnline(username, true);
      onlineSocketMap.set(username, socket.id);
    }

    socket.emit('online:init', getOnlineData().onlineUsers);
  });

  socket.on('chat:message', ({ username, message }) => {
    if (!username || !message) return;
    io.emit('chat:message', {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('chat:stamp', ({ username, stamp }) => {
    if (!username || !stamp) return;
    io.emit('chat:stamp', {
      username,
      stamp,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('game:match-result', ({ username, reward = 0, game }) => {
    const usersData = getUsers();
    const user = usersData.users.find((u) => u.username === username);
    if (!user) return;
    user.points += reward;
    saveUsers(usersData);
    pushLog('game_result', `${username} won ${reward} points in ${game}`);
    socket.emit('user:state', userPublicInfo(user, getOnlineData().onlineUsers));
  });

  socket.on('disconnect', () => {
    const { username, role } = socket.data;
    if (username && role !== 'admin') {
      onlineSocketMap.delete(username);
      setUserOnline(username, false);
    }
  });
});

server.listen(PORT, () => {
  console.log(`kimuchi-game server running on http://localhost:${PORT}`);
});

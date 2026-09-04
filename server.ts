import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GAME_CATEGORIES, CATEGORY_ORDER, getRandomOptionsForCategory, getRandomizedCategoryOrder } from './src/gameData';
import { 
  GameRoomState, 
  Player, 
  CategoryId, 
  RoundResult, 
  ClientMessage, 
  ServerMessage,
  GameSettings 
} from './src/types';

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json());

// Basic health check API
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Default settings
const DEFAULT_SETTINGS: GameSettings = {
  autoRandomPresenter: false,
  hostCompensation: true,
  timeLimitSeconds: 15,
  hostCompensationPerWrong: 150,
  baseCorrectPoints: 500,
  maxSpeedBonus: 500,
};

// Rooms state store
interface ServerRoom {
  state: GameRoomState;
  sockets: Map<string, WebSocket>;
  botIntervals?: NodeJS.Timeout[];
  revealTimeout?: NodeJS.Timeout;
  botPresenterTimeout?: NodeJS.Timeout;
}

const rooms = new Map<string, ServerRoom>();

function getOrCreateRoom(code: string): ServerRoom {
  const normalizedCode = (code || 'EFL1').toUpperCase().trim();
  let room = rooms.get(normalizedCode);
  if (!room) {
    const randomizedCategories = getRandomizedCategoryOrder();
    const initialCategory = getRandomOptionsForCategory(randomizedCategories[0], 5);
    const state: GameRoomState = {
      code: normalizedCode,
      stage: 'LOBBY',
      roundIndex: 0,
      categories: randomizedCategories,
      currentCategory: initialCategory,
      presenterId: null,
      presenterChoice: null,
      guessPhaseStartTime: null,
      settings: { ...DEFAULT_SETTINGS },
      players: {},
      roundHistory: [],
      lastRoundResult: null,
    };
    room = {
      state,
      sockets: new Map<string, WebSocket>(),
    };
    rooms.set(normalizedCode, room);
  }
  return room;
}

function broadcastToRoom(room: ServerRoom, message: ServerMessage) {
  const payload = JSON.stringify(message);
  for (const socket of room.sockets.values()) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

function updateRanks(players: Record<string, Player>) {
  const playerList = Object.values(players);
  // Sort descending by score
  playerList.sort((a, b) => b.score - a.score);
  
  playerList.forEach((player, index) => {
    const newRank = index + 1;
    // If it's the very first round, previousRank is initialized to currentRank
    if (player.previousRank === 0) {
      player.previousRank = newRank;
    } else {
      player.previousRank = player.currentRank;
    }
    player.currentRank = newRank;
  });
}

function calculateRoundScores(room: ServerRoom) {
  const { state } = room;
  const presenter = state.presenterId ? state.players[state.presenterId] : null;
  const correctOptionId = state.presenterChoice;

  if (!correctOptionId) return;

  const guessesRecord: Record<string, { optionId: string; elapsedMs: number; isCorrect: boolean; points: number }> = {};
  const optionCounts: Record<string, { count: number; playerIds: string[] }> = {};

  // Initialize option counts
  state.currentCategory.options.forEach(opt => {
    optionCounts[opt.id] = { count: 0, playerIds: [] };
  });

  let incorrectGuessesCount = 0;

  // Score all guessers (players other than the presenter)
  Object.values(state.players).forEach(player => {
    if (player.id === state.presenterId) return;

    const guess = player.currentGuess;
    const elapsed = player.guessElapsedMs ?? (state.settings.timeLimitSeconds * 1000);

    if (guess && optionCounts[guess]) {
      optionCounts[guess].count += 1;
      optionCounts[guess].playerIds.push(player.id);
    }

    const isCorrect = guess === correctOptionId;
    let pointsAwarded = 0;
    let speedBonus = 0;

    if (isCorrect) {
      const timeLimitMs = state.settings.timeLimitSeconds * 1000;
      const speedRatio = Math.max(0, Math.min(1, 1 - (elapsed / timeLimitMs)));
      speedBonus = Math.round(state.settings.maxSpeedBonus * speedRatio);
      pointsAwarded = state.settings.baseCorrectPoints + speedBonus;
      player.score += pointsAwarded;
    } else {
      incorrectGuessesCount += 1;
    }

    player.roundScore = pointsAwarded;
    player.lastScoreBreakdown = {
      base: isCorrect ? state.settings.baseCorrectPoints : 0,
      speedBonus: speedBonus,
      isCorrect,
    };

    if (guess) {
      guessesRecord[player.id] = {
        optionId: guess,
        elapsedMs: elapsed,
        isCorrect,
        points: pointsAwarded,
      };
    }
  });

  // Host compensation points
  let hostPointsEarned = 0;
  if (presenter && state.settings.hostCompensation) {
    const wrongBonus = incorrectGuessesCount * state.settings.hostCompensationPerWrong;
    const baseHostBonus = 200; // Base appreciation bonus for presenting
    hostPointsEarned = wrongBonus + baseHostBonus;
    presenter.score += hostPointsEarned;
    presenter.roundScore = hostPointsEarned;
    presenter.lastScoreBreakdown = {
      base: baseHostBonus,
      speedBonus: 0,
      hostBonus: wrongBonus,
      incorrectCount: incorrectGuessesCount,
      isCorrect: true,
    };
  }

  // Update rankings
  updateRanks(state.players);

  const roundResult: RoundResult = {
    roundNumber: state.roundIndex + 1,
    categoryId: state.currentCategory.id,
    presenterId: state.presenterId || '',
    presenterName: presenter ? presenter.name : 'Teacher',
    presenterChoice: correctOptionId,
    guesses: guessesRecord,
    optionCounts,
    hostPointsEarned,
  };

  state.lastRoundResult = roundResult;
  state.roundHistory.push(roundResult);
}

// Bot simulation for classroom demonstration and solo practice
const BOT_NAMES = ['Leo', 'Sophia', 'Kenji', 'Maya', 'Liam', 'Emma', 'Carlos', 'Yuki'];
const BOT_AVATARS = ['🦊', '🐼', '🐰', '🦁', '🐶', '🐱', '🐸', '🐨'];
const BOT_COLORS = ['emerald', 'sky', 'indigo', 'rose', 'amber', 'purple', 'teal', 'orange'];

function spawnBotsForGuessing(room: ServerRoom) {
  clearBotTimeouts(room);
  const { state } = room;
  const bots = Object.values(state.players).filter(p => p.isBot && p.id !== state.presenterId);
  const correctChoice = state.presenterChoice;

  if (!correctChoice || bots.length === 0) return;

  const timeouts: NodeJS.Timeout[] = [];

  bots.forEach(bot => {
    // Random thinking delay between 1.2s and 9s
    const delay = Math.floor(Math.random() * 6500) + 1200;
    const timeout = setTimeout(() => {
      // 60% chance to guess correct, 40% to pick another random option
      let chosenOption = correctChoice;
      if (Math.random() < 0.4) {
        const otherOptions = state.currentCategory.options.filter(o => o.id !== correctChoice);
        if (otherOptions.length > 0) {
          chosenOption = otherOptions[Math.floor(Math.random() * otherOptions.length)].id;
        }
      }

      bot.currentGuess = chosenOption;
      bot.guessElapsedMs = delay;

      broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });

      // Check if all players guessed
      checkAllGuessedAndReveal(room);
    }, delay);

    timeouts.push(timeout);
  });

  room.botIntervals = timeouts;
}

function clearBotTimeouts(room: ServerRoom) {
  if (room.botIntervals) {
    room.botIntervals.forEach(t => clearTimeout(t));
    room.botIntervals = [];
  }
}

function clearRoomTimers(room: ServerRoom) {
  clearBotTimeouts(room);
  if (room.revealTimeout) {
    clearTimeout(room.revealTimeout);
    room.revealTimeout = undefined;
  }
  if (room.botPresenterTimeout) {
    clearTimeout(room.botPresenterTimeout);
    room.botPresenterTimeout = undefined;
  }
}

function startClassGuessingPhase(room: ServerRoom) {
  clearRoomTimers(room);
  room.state.stage = 'CLASS_GUESSING';
  room.state.guessPhaseStartTime = Date.now();

  // Reset guesses for all players
  Object.values(room.state.players).forEach(p => {
    p.currentGuess = null;
    p.guessElapsedMs = null;
  });

  // Spawn bot guesses
  spawnBotsForGuessing(room);

  // Authoritative server-side auto-reveal timeout
  const limitMs = (room.state.settings.timeLimitSeconds + 1.5) * 1000;
  room.revealTimeout = setTimeout(() => {
    if (room.state.stage === 'CLASS_GUESSING') {
      clearBotTimeouts(room);
      room.state.stage = 'REVEAL';
      calculateRoundScores(room);
      broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
    }
  }, limitMs);
}

function checkBotPresenterSelection(room: ServerRoom) {
  if (room.state.stage !== 'PRESENTER_SELECTING') return;
  const presenter = room.state.presenterId ? room.state.players[room.state.presenterId] : null;
  if (!presenter || !presenter.isBot) return;

  if (room.botPresenterTimeout) {
    clearTimeout(room.botPresenterTimeout);
  }

  room.botPresenterTimeout = setTimeout(() => {
    if (room.state.stage === 'PRESENTER_SELECTING' && room.state.presenterId === presenter.id) {
      const options = room.state.currentCategory.options;
      const chosen = options[Math.floor(Math.random() * options.length)];
      room.state.presenterChoice = chosen.id;
      startClassGuessingPhase(room);
      broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
    }
  }, 2500);
}

function checkAllGuessedAndReveal(room: ServerRoom) {
  const { state } = room;
  if (state.stage !== 'CLASS_GUESSING') return;

  const activeGuessers = Object.values(state.players).filter(p => p.id !== state.presenterId);
  if (activeGuessers.length === 0) return;

  const allGuessed = activeGuessers.every(p => p.currentGuess !== null && p.currentGuess !== undefined);
  if (allGuessed) {
    clearRoomTimers(room);
    setTimeout(() => {
      if (state.stage === 'CLASS_GUESSING') {
        state.stage = 'REVEAL';
        calculateRoundScores(room);
        broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
      }
    }, 600);
  }
}

function handleJoin(
  roomCode: string,
  name: string,
  avatar: string,
  favoriteColor: string,
  isTeacher?: boolean,
  existingPlayerId?: string
): { room: ServerRoom; player: Player } {
  const room = getOrCreateRoom(roomCode);
  let playerId = existingPlayerId;

  // If player already exists in this room, re-attach session
  if (playerId && room.state.players[playerId]) {
    const existing = room.state.players[playerId];
    existing.name = name.trim() || existing.name;
    existing.avatar = avatar || existing.avatar;
    existing.favoriteColor = favoriteColor || existing.favoriteColor;
    existing.connected = true;
    if (typeof isTeacher === 'boolean') {
      existing.isTeacher = isTeacher;
    }
    updateRanks(room.state.players);
    return { room, player: existing };
  }

  // Otherwise create new player
  if (!playerId) {
    playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  }

  const isFirstPlayer = Object.keys(room.state.players).length === 0;
  const playerIsTeacher = typeof isTeacher === 'boolean' ? isTeacher : isFirstPlayer;

  const player: Player = {
    id: playerId,
    name: name.trim() || (playerIsTeacher ? 'Teacher' : 'Student'),
    avatar: avatar || '🐶',
    favoriteColor: favoriteColor || 'sky',
    score: 0,
    previousRank: 0,
    currentRank: Object.keys(room.state.players).length + 1,
    isPresenter: playerIsTeacher || room.state.presenterId === null,
    isTeacher: Boolean(playerIsTeacher),
    connected: true,
    currentGuess: null,
    guessElapsedMs: null,
    roundScore: 0,
  };

  if (playerIsTeacher || room.state.presenterId === null) {
    room.state.presenterId = playerId;
  }

  room.state.players[playerId] = player;
  updateRanks(room.state.players);

  return { room, player };
}

function handleClientAction(room: ServerRoom, playerId: string, msg: ClientMessage) {
  const player = room.state.players[playerId];
  if (!player && msg.type !== 'JOIN_ROOM' && msg.type !== 'RECONNECT') {
    return;
  }

  switch (msg.type) {
    case 'START_GAME': {
      clearRoomTimers(room);
      room.state.roundIndex = 0;
      const randomizedCategories = getRandomizedCategoryOrder();
      room.state.categories = randomizedCategories;
      const initialCategory = getRandomOptionsForCategory(randomizedCategories[0], 5);
      room.state.currentCategory = initialCategory;
      room.state.stage = 'PRESENTER_SELECTING';
      room.state.presenterChoice = null;
      room.state.guessPhaseStartTime = null;

      // Clear previous round guesses
      Object.values(room.state.players).forEach(p => {
        p.currentGuess = null;
        p.guessElapsedMs = null;
        p.roundScore = 0;
      });

      // Default the presenter to the teacher/host who started the game
      if (player?.isTeacher || !room.state.presenterId || !room.state.players[room.state.presenterId]) {
        room.state.presenterId = playerId;
      }
      Object.values(room.state.players).forEach(p => {
        p.isPresenter = p.id === room.state.presenterId;
      });

      checkBotPresenterSelection(room);
      break;
    }

    case 'PRESENTER_CHOICE': {
      // Allow presenter OR teacher/host to lock in the secret choice
      const isAuthorized = playerId === room.state.presenterId || player?.isTeacher;
      if (!isAuthorized) return;
      if (room.state.stage !== 'PRESENTER_SELECTING') return;

      // If the teacher/host chooses, update presenter to them if it wasn't already
      if (player?.isTeacher && room.state.presenterId !== playerId) {
        room.state.presenterId = playerId;
        Object.values(room.state.players).forEach(p => {
          p.isPresenter = p.id === playerId;
        });
      }

      if (room.botPresenterTimeout) {
        clearTimeout(room.botPresenterTimeout);
      }

      room.state.presenterChoice = msg.optionId;
      startClassGuessingPhase(room);
      break;
    }

    case 'SUBMIT_GUESS': {
      if (playerId === room.state.presenterId) return;
      if (room.state.stage !== 'CLASS_GUESSING') return;

      if (player && !player.currentGuess) {
        player.currentGuess = msg.optionId;
        player.guessElapsedMs = msg.elapsedMs;
        checkAllGuessedAndReveal(room);
      }
      break;
    }

    case 'TRIGGER_REVEAL': {
      if (room.state.stage === 'CLASS_GUESSING') {
        clearRoomTimers(room);
        room.state.stage = 'REVEAL';
        calculateRoundScores(room);
      }
      break;
    }

    case 'SHOW_SCOREBOARD': {
      if (room.state.stage === 'REVEAL') {
        room.state.stage = 'SCOREBOARD';
      }
      break;
    }

    case 'NEXT_ROUND': {
      clearRoomTimers(room);
      const nextIndex = room.state.roundIndex + 1;

      if (nextIndex >= room.state.categories.length) {
        room.state.stage = 'GAME_OVER';
        break;
      }

      room.state.roundIndex = nextIndex;
      const nextCatId = msg.categoryId || room.state.categories[nextIndex % room.state.categories.length];
      room.state.currentCategory = getRandomOptionsForCategory(nextCatId, 5);
      room.state.presenterChoice = null;
      room.state.guessPhaseStartTime = null;
      room.state.stage = 'PRESENTER_SELECTING';

      // Pick next presenter
      if (room.state.settings.autoRandomPresenter) {
        const playerIds = Object.keys(room.state.players);
        if (playerIds.length > 1) {
          const candidates = playerIds.filter(id => id !== room.state.presenterId);
          const chosenId = candidates[Math.floor(Math.random() * candidates.length)];
          room.state.presenterId = chosenId;
        }
      }

      // Reset round state for all players
      Object.values(room.state.players).forEach(p => {
        p.currentGuess = null;
        p.guessElapsedMs = null;
        p.roundScore = 0;
        p.isPresenter = p.id === room.state.presenterId;
      });

      checkBotPresenterSelection(room);
      break;
    }

    case 'SET_PRESENTER': {
      if (room.state.players[msg.playerId]) {
        room.state.presenterId = msg.playerId;
        Object.values(room.state.players).forEach(p => {
          p.isPresenter = p.id === msg.playerId;
        });
        if (room.state.stage === 'PRESENTER_SELECTING') {
          checkBotPresenterSelection(room);
        }
      }
      break;
    }

    case 'PICK_RANDOM_PRESENTER': {
      const playerIds = Object.keys(room.state.players);
      if (playerIds.length > 0) {
        const candidates = playerIds.filter(id => id !== room.state.presenterId);
        const chosenId = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : playerIds[0];
        
        room.state.presenterId = chosenId;
        Object.values(room.state.players).forEach(p => {
          p.isPresenter = p.id === chosenId;
        });
        if (room.state.stage === 'PRESENTER_SELECTING') {
          checkBotPresenterSelection(room);
        }
      }
      break;
    }

    case 'UPDATE_SETTINGS': {
      room.state.settings = { ...room.state.settings, ...msg.settings };
      break;
    }

    case 'ADD_DEMO_BOTS': {
      const count = Math.min(6, Math.max(1, msg.count || 3));
      const existingNames = new Set(Object.values(room.state.players).map(p => p.name));
      const availableBots = BOT_NAMES.filter(n => !existingNames.has(n));

      for (let i = 0; i < count; i++) {
        const botName = availableBots[i] || `Student_${Math.floor(Math.random() * 90 + 10)}`;
        const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
        room.state.players[botId] = {
          id: botId,
          name: botName,
          avatar: BOT_AVATARS[i % BOT_AVATARS.length],
          favoriteColor: BOT_COLORS[i % BOT_COLORS.length],
          score: Math.floor(Math.random() * 400),
          previousRank: 0,
          currentRank: Object.keys(room.state.players).length + 1,
          isPresenter: false,
          isTeacher: false,
          isBot: true,
          connected: true,
          currentGuess: null,
          guessElapsedMs: null,
          roundScore: 0,
        };
      }
      updateRanks(room.state.players);
      break;
    }

    case 'REMOVE_DEMO_BOTS': {
      Object.keys(room.state.players).forEach(id => {
        if (room.state.players[id].isBot) {
          delete room.state.players[id];
        }
      });
      if (room.state.presenterId && !room.state.players[room.state.presenterId]) {
        const remaining = Object.keys(room.state.players);
        room.state.presenterId = remaining.length > 0 ? remaining[0] : null;
      }
      updateRanks(room.state.players);
      break;
    }

    case 'END_GAME': {
      clearRoomTimers(room);
      room.state.stage = 'GAME_OVER';
      break;
    }

    case 'RESET_GAME': {
      clearRoomTimers(room);
      room.state.roundIndex = 0;
      const randomizedCategories = getRandomizedCategoryOrder();
      room.state.categories = randomizedCategories;
      room.state.currentCategory = getRandomOptionsForCategory(randomizedCategories[0], 5);
      room.state.presenterChoice = null;
      room.state.guessPhaseStartTime = null;
      room.state.stage = 'LOBBY';
      room.state.roundHistory = [];
      room.state.lastRoundResult = null;

      Object.values(room.state.players).forEach(p => {
        p.score = 0;
        p.previousRank = 0;
        p.currentRank = 1;
        p.currentGuess = null;
        p.guessElapsedMs = null;
        p.roundScore = 0;
      });
      break;
    }
  }
}

// REST API Endpoints for resilient fallback (School firewalls / HTTP sync)
app.get('/api/room/:code', (req, res) => {
  const code = (req.params.code || 'EFL1').toUpperCase();
  const room = getOrCreateRoom(code);
  const playerId = typeof req.query.playerId === 'string' ? req.query.playerId : undefined;
  const player = playerId ? room.state.players[playerId] : null;

  res.json({
    status: 'ok',
    state: room.state,
    player: player || null,
  });
});

app.post('/api/room/join', (req, res) => {
  const { roomCode, name, avatar, favoriteColor, isTeacher, playerId } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const { room, player } = handleJoin(
    roomCode || 'EFL1',
    name,
    avatar || '🐶',
    favoriteColor || 'sky',
    Boolean(isTeacher),
    playerId
  );

  broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });

  res.json({
    status: 'ok',
    playerId: player.id,
    state: room.state,
  });
});

app.post('/api/room/action', (req, res) => {
  const { roomCode, playerId, action } = req.body;
  const room = rooms.get((roomCode || 'EFL1').toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (playerId && !room.state.players[playerId]) {
    return res.status(403).json({ error: 'Player not found in room' });
  }

  handleClientAction(room, playerId, action);
  broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });

  res.json({
    status: 'ok',
    state: room.state,
  });
});

// Attach WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on('message', (raw) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());

      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (msg.type === 'JOIN_ROOM') {
        const { room, player } = handleJoin(
          msg.roomCode,
          msg.name,
          msg.avatar,
          msg.favoriteColor,
          msg.isTeacher,
          msg.playerId
        );

        currentRoomCode = room.state.code;
        currentPlayerId = player.id;
        room.sockets.set(player.id, ws);

        // Crucial: send JOIN_SUCCESS directly to this client socket!
        ws.send(JSON.stringify({
          type: 'JOIN_SUCCESS',
          playerId: player.id,
          state: room.state,
        }));

        // Broadcast updated state to all other players in the room
        broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
        return;
      }

      if (msg.type === 'RECONNECT') {
        const room = getOrCreateRoom(msg.roomCode);
        currentRoomCode = room.state.code;
        currentPlayerId = msg.playerId;

        if (room.state.players[msg.playerId]) {
          room.state.players[msg.playerId].connected = true;
          room.sockets.set(msg.playerId, ws);
          ws.send(JSON.stringify({
            type: 'JOIN_SUCCESS',
            playerId: msg.playerId,
            state: room.state,
          }));
          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
        } else {
          ws.send(JSON.stringify({
            type: 'ROOM_STATE',
            state: room.state,
          }));
        }
        return;
      }

      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      handleClientAction(room, currentPlayerId, msg);
      broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
      return;
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.sockets.delete(currentPlayerId);
        if (room.state.players[currentPlayerId]) {
          room.state.players[currentPlayerId].connected = false;
        }
        broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
      }
    }
  });
});

// Periodic keep-alive ping loop to prevent Cloud Run / reverse proxy idle timeout disconnects
setInterval(() => {
  for (const room of rooms.values()) {
    for (const [playerId, socket] of room.sockets.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      } else {
        room.sockets.delete(playerId);
      }
    }
  }
}, 25000);

// Vite middleware in dev mode or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

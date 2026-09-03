import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GAME_CATEGORIES, CATEGORY_ORDER } from './src/gameData';
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
}

const rooms = new Map<string, ServerRoom>();

function getOrCreateRoom(code: string): ServerRoom {
  const normalizedCode = (code || 'EFL1').toUpperCase().trim();
  let room = rooms.get(normalizedCode);
  if (!room) {
    const initialCategory = GAME_CATEGORIES[CATEGORY_ORDER[0]];
    const state: GameRoomState = {
      code: normalizedCode,
      stage: 'LOBBY',
      roundIndex: 0,
      categories: [...CATEGORY_ORDER],
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

function checkAllGuessedAndReveal(room: ServerRoom) {
  const { state } = room;
  if (state.stage !== 'CLASS_GUESSING') return;

  const activeGuessers = Object.values(state.players).filter(p => p.id !== state.presenterId);
  if (activeGuessers.length === 0) return;

  const allGuessed = activeGuessers.every(p => p.currentGuess !== null && p.currentGuess !== undefined);
  if (allGuessed) {
    // Small delay before reveal for visual polish
    setTimeout(() => {
      if (state.stage === 'CLASS_GUESSING') {
        state.stage = 'REVEAL';
        calculateRoundScores(room);
        broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
      }
    }, 600);
  }
}

// Attach WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on('message', (raw) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());

      if (msg.type === 'JOIN_ROOM') {
        const room = getOrCreateRoom(msg.roomCode);
        currentRoomCode = room.state.code;
        
        // Generate or reuse player id
        const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        currentPlayerId = playerId;

        const isFirstPlayer = Object.keys(room.state.players).length === 0;
        const isTeacher = msg.isTeacher ?? isFirstPlayer;

        const player: Player = {
          id: playerId,
          name: msg.name.trim() || (isTeacher ? 'Teacher' : 'Student'),
          avatar: msg.avatar || '🐶',
          favoriteColor: msg.favoriteColor || 'sky',
          score: 0,
          previousRank: 0,
          currentRank: Object.keys(room.state.players).length + 1,
          isPresenter: room.state.presenterId === null,
          isTeacher: Boolean(isTeacher),
          connected: true,
          currentGuess: null,
          guessElapsedMs: null,
          roundScore: 0,
        };

        if (room.state.presenterId === null) {
          room.state.presenterId = playerId;
        }

        room.state.players[playerId] = player;
        room.sockets.set(playerId, ws);

        updateRanks(room.state.players);
        broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
        return;
      }

      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const player = room.state.players[currentPlayerId];
      if (!player) return;

      switch (msg.type) {
        case 'START_GAME': {
          room.state.roundIndex = 0;
          const initialCategory = GAME_CATEGORIES[CATEGORY_ORDER[0]];
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

          // Ensure a presenter exists
          if (!room.state.presenterId || !room.state.players[room.state.presenterId]) {
            room.state.presenterId = currentPlayerId;
            room.state.players[currentPlayerId].isPresenter = true;
          }

          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'PRESENTER_CHOICE': {
          // Only the presenter can lock in their choice
          if (currentPlayerId !== room.state.presenterId) return;
          if (room.state.stage !== 'PRESENTER_SELECTING') return;

          room.state.presenterChoice = msg.optionId;
          room.state.stage = 'CLASS_GUESSING';
          room.state.guessPhaseStartTime = Date.now();

          // Reset guesses for all players
          Object.values(room.state.players).forEach(p => {
            p.currentGuess = null;
            p.guessElapsedMs = null;
          });

          // If bots are in the room, start bot guessing behavior
          spawnBotsForGuessing(room);

          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'SUBMIT_GUESS': {
          // Only guessers (non-presenters) can submit during CLASS_GUESSING
          if (currentPlayerId === room.state.presenterId) return;
          if (room.state.stage !== 'CLASS_GUESSING') return;

          player.currentGuess = msg.optionId;
          player.guessElapsedMs = msg.elapsedMs;

          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          checkAllGuessedAndReveal(room);
          break;
        }

        case 'TRIGGER_REVEAL': {
          // Host/Teacher or Presenter can force reveal
          if (room.state.stage === 'CLASS_GUESSING') {
            clearBotTimeouts(room);
            room.state.stage = 'REVEAL';
            calculateRoundScores(room);
            broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          }
          break;
        }

        case 'SHOW_SCOREBOARD': {
          room.state.stage = 'SCOREBOARD';
          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'NEXT_ROUND': {
          clearBotTimeouts(room);
          const nextIndex = room.state.roundIndex + 1;
          
          if (nextIndex >= CATEGORY_ORDER.length) {
            room.state.stage = 'GAME_OVER';
            broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
            return;
          }

          room.state.roundIndex = nextIndex;
          const nextCatId = msg.categoryId || CATEGORY_ORDER[nextIndex % CATEGORY_ORDER.length];
          room.state.currentCategory = GAME_CATEGORIES[nextCatId] || GAME_CATEGORIES.sport;
          room.state.presenterChoice = null;
          room.state.guessPhaseStartTime = null;
          room.state.stage = 'PRESENTER_SELECTING';

          // Check if auto-random presenter is enabled
          if (room.state.settings.autoRandomPresenter) {
            const playerIds = Object.keys(room.state.players);
            if (playerIds.length > 1) {
              // Pick someone other than the current presenter if possible
              const candidates = playerIds.filter(id => id !== room.state.presenterId);
              const chosenId = candidates[Math.floor(Math.random() * candidates.length)];
              
              Object.values(room.state.players).forEach(p => {
                p.isPresenter = p.id === chosenId;
              });
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

          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'SET_PRESENTER': {
          if (!room.state.players[msg.playerId]) return;
          room.state.presenterId = msg.playerId;
          Object.values(room.state.players).forEach(p => {
            p.isPresenter = p.id === msg.playerId;
          });
          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'PICK_RANDOM_PRESENTER': {
          const playerIds = Object.keys(room.state.players);
          if (playerIds.length > 0) {
            const chosenId = playerIds[Math.floor(Math.random() * playerIds.length)];
            room.state.presenterId = chosenId;
            Object.values(room.state.players).forEach(p => {
              p.isPresenter = p.id === chosenId;
            });
            broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          }
          break;
        }

        case 'UPDATE_SETTINGS': {
          room.state.settings = {
            ...room.state.settings,
            ...msg.settings,
          };
          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'ADD_DEMO_BOTS': {
          const count = Math.min(6, Math.max(1, msg.count || 3));
          for (let i = 0; i < count; i++) {
            const botId = 'bot_' + Math.random().toString(36).substring(2, 7);
            const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + ' ' + (Math.floor(Math.random() * 89) + 10);
            const botAvatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];
            const botColor = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];

            room.state.players[botId] = {
              id: botId,
              name: botName,
              avatar: botAvatar,
              favoriteColor: botColor,
              score: Math.floor(Math.random() * 800),
              previousRank: Object.keys(room.state.players).length + 1,
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
          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'REMOVE_DEMO_BOTS': {
          Object.keys(room.state.players).forEach(id => {
            if (room.state.players[id].isBot) {
              delete room.state.players[id];
            }
          });
          updateRanks(room.state.players);
          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }

        case 'RESET_GAME': {
          clearBotTimeouts(room);
          room.state.roundIndex = 0;
          room.state.currentCategory = GAME_CATEGORIES.sport;
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

          broadcastToRoom(room, { type: 'ROOM_STATE', state: room.state });
          break;
        }
      }
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

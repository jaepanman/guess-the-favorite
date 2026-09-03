import { GameRoomState, Player, CategoryId, GameSettings, RoundResult, ClientMessage } from '../types';
import { CATEGORY_ORDER, GAME_CATEGORIES } from '../gameData';

const DEFAULT_SETTINGS: GameSettings = {
  autoRandomPresenter: false,
  hostCompensation: true,
  timeLimitSeconds: 15,
  hostCompensationPerWrong: 150,
  baseCorrectPoints: 500,
  maxSpeedBonus: 500,
};

const BOT_NAMES = ['Leo', 'Sophia', 'Kenji', 'Maya', 'Liam', 'Emma', 'Carlos', 'Yuki'];
const BOT_AVATARS = ['🦊', '🐼', '🐰', '🦁', '🐶', '🐱', '🐸', '🐨'];
const BOT_COLORS = ['emerald', 'sky', 'indigo', 'rose', 'amber', 'purple', 'teal', 'orange'];

let localState: GameRoomState = createInitialState('EFL1');
const listeners: Set<(state: GameRoomState) => void> = new Set();
let botTimeouts: number[] = [];
let botPresenterTimeout: number | null = null;

// Cross-tab broadcast channel
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('efl_local_classroom_sync')
  : null;

if (channel) {
  channel.onmessage = (event) => {
    if (event.data && event.data.type === 'SYNC_STATE' && event.data.state) {
      localState = event.data.state;
      notifyListeners();
    }
  };
}

function notifyListeners() {
  listeners.forEach(fn => fn(localState));
  if (channel) {
    try {
      channel.postMessage({ type: 'SYNC_STATE', state: localState });
    } catch {
      // Benign channel post error
    }
  }
}

function createInitialState(code: string): GameRoomState {
  const initialCategory = GAME_CATEGORIES[CATEGORY_ORDER[0]];
  return {
    code: (code || 'EFL1').toUpperCase(),
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
}

function updateRanks(players: Record<string, Player>) {
  const playerList = Object.values(players);
  playerList.sort((a, b) => b.score - a.score);
  playerList.forEach((player, index) => {
    const newRank = index + 1;
    if (player.previousRank === 0) {
      player.previousRank = newRank;
    } else {
      player.previousRank = player.currentRank;
    }
    player.currentRank = newRank;
  });
}

function clearLocalBotTimers() {
  botTimeouts.forEach(t => clearTimeout(t));
  botTimeouts = [];
  if (botPresenterTimeout) {
    clearTimeout(botPresenterTimeout);
    botPresenterTimeout = null;
  }
}

function calculateRoundScores() {
  const presenter = localState.presenterId ? localState.players[localState.presenterId] : null;
  const correctOptionId = localState.presenterChoice;
  if (!correctOptionId) return;

  const guessesRecord: Record<string, { optionId: string; elapsedMs: number; isCorrect: boolean; points: number }> = {};
  const optionCounts: Record<string, { count: number; playerIds: string[] }> = {};

  localState.currentCategory.options.forEach(opt => {
    optionCounts[opt.id] = { count: 0, playerIds: [] };
  });

  let incorrectGuessesCount = 0;

  Object.values(localState.players).forEach(player => {
    if (player.id === localState.presenterId) return;

    const guess = player.currentGuess;
    const elapsed = player.guessElapsedMs ?? (localState.settings.timeLimitSeconds * 1000);

    if (guess && optionCounts[guess]) {
      optionCounts[guess].count += 1;
      optionCounts[guess].playerIds.push(player.id);
    }

    const isCorrect = guess === correctOptionId;
    let pointsAwarded = 0;
    let speedBonus = 0;

    if (isCorrect) {
      const timeLimitMs = localState.settings.timeLimitSeconds * 1000;
      const speedRatio = Math.max(0, Math.min(1, 1 - (elapsed / timeLimitMs)));
      speedBonus = Math.round(localState.settings.maxSpeedBonus * speedRatio);
      pointsAwarded = localState.settings.baseCorrectPoints + speedBonus;
      player.score += pointsAwarded;
    } else {
      incorrectGuessesCount += 1;
    }

    player.roundScore = pointsAwarded;
    player.lastScoreBreakdown = {
      base: isCorrect ? localState.settings.baseCorrectPoints : 0,
      speedBonus,
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
  if (presenter && localState.settings.hostCompensation) {
    const wrongBonus = incorrectGuessesCount * localState.settings.hostCompensationPerWrong;
    const baseHostBonus = 200;
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

  updateRanks(localState.players);

  const roundResult: RoundResult = {
    roundNumber: localState.roundIndex + 1,
    categoryId: localState.currentCategory.id,
    presenterId: localState.presenterId || '',
    presenterName: presenter ? presenter.name : 'Teacher',
    presenterChoice: correctOptionId,
    guesses: guessesRecord,
    optionCounts,
    hostPointsEarned,
  };

  localState.lastRoundResult = roundResult;
  localState.roundHistory.push(roundResult);
}

function checkAllGuessedAndReveal() {
  const activeGuessers = Object.values(localState.players).filter(p => p.id !== localState.presenterId);
  if (activeGuessers.length === 0) return;

  const allGuessed = activeGuessers.every(p => p.currentGuess !== null && p.currentGuess !== undefined);
  if (allGuessed) {
    clearLocalBotTimers();
    setTimeout(() => {
      if (localState.stage === 'CLASS_GUESSING') {
        localState.stage = 'REVEAL';
        calculateRoundScores();
        notifyListeners();
      }
    }, 600);
  }
}

function spawnBotsForGuessing() {
  clearLocalBotTimers();
  const bots = Object.values(localState.players).filter(p => p.isBot && p.id !== localState.presenterId);
  const correctChoice = localState.presenterChoice;
  if (!correctChoice || bots.length === 0) return;

  bots.forEach(bot => {
    const delay = Math.floor(Math.random() * 5500) + 1200;
    const timeout = window.setTimeout(() => {
      if (localState.stage !== 'CLASS_GUESSING') return;
      let chosenOption = correctChoice;
      if (Math.random() < 0.35) {
        const otherOptions = localState.currentCategory.options.filter(o => o.id !== correctChoice);
        if (otherOptions.length > 0) {
          chosenOption = otherOptions[Math.floor(Math.random() * otherOptions.length)].id;
        }
      }

      bot.currentGuess = chosenOption;
      bot.guessElapsedMs = delay;
      notifyListeners();
      checkAllGuessedAndReveal();
    }, delay);

    botTimeouts.push(timeout);
  });
}

function startClassGuessingPhase() {
  clearLocalBotTimers();
  localState.stage = 'CLASS_GUESSING';
  localState.guessPhaseStartTime = Date.now();

  Object.values(localState.players).forEach(p => {
    p.currentGuess = null;
    p.guessElapsedMs = null;
    p.roundScore = 0;
  });

  spawnBotsForGuessing();
  notifyListeners();
}

export function getLocalRoomState(): GameRoomState {
  return localState;
}

export function subscribeLocalEngine(listener: (state: GameRoomState) => void): () => void {
  listeners.add(listener);
  listener(localState);
  return () => {
    listeners.delete(listener);
  };
}

export function localJoin(
  roomCode: string,
  name: string,
  avatar: string,
  favoriteColor: string,
  isTeacher: boolean = false,
  existingPlayerId?: string
): { player: Player; state: GameRoomState } {
  let playerId = existingPlayerId;

  if (playerId && localState.players[playerId]) {
    const existing = localState.players[playerId];
    existing.name = name.trim() || existing.name;
    existing.avatar = avatar || existing.avatar;
    existing.favoriteColor = favoriteColor || existing.favoriteColor;
    existing.connected = true;
    if (typeof isTeacher === 'boolean') {
      existing.isTeacher = isTeacher;
    }
    if (isTeacher) {
      localState.presenterId = playerId;
      existing.isPresenter = true;
    }
    updateRanks(localState.players);
    notifyListeners();
    return { player: existing, state: localState };
  }

  if (!playerId) {
    playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  }

  const isFirstPlayer = Object.keys(localState.players).length === 0;
  const playerIsTeacher = typeof isTeacher === 'boolean' ? isTeacher : isFirstPlayer;

  const player: Player = {
    id: playerId,
    name: name.trim() || (playerIsTeacher ? 'Teacher' : 'Student'),
    avatar: avatar || '🐶',
    favoriteColor: favoriteColor || 'sky',
    score: 0,
    previousRank: 0,
    currentRank: Object.keys(localState.players).length + 1,
    isPresenter: playerIsTeacher || localState.presenterId === null,
    isTeacher: Boolean(playerIsTeacher),
    connected: true,
    currentGuess: null,
    guessElapsedMs: null,
    roundScore: 0,
  };

  if (playerIsTeacher || localState.presenterId === null) {
    localState.presenterId = playerId;
  }

  localState.players[playerId] = player;
  updateRanks(localState.players);
  notifyListeners();

  return { player, state: localState };
}

export function dispatchLocalAction(playerId: string, msg: ClientMessage): GameRoomState {
  const player = localState.players[playerId];

  switch (msg.type) {
    case 'START_GAME': {
      clearLocalBotTimers();
      localState.roundIndex = 0;
      localState.currentCategory = GAME_CATEGORIES[CATEGORY_ORDER[0]];
      localState.stage = 'PRESENTER_SELECTING';
      localState.presenterChoice = null;
      localState.guessPhaseStartTime = null;

      Object.values(localState.players).forEach(p => {
        p.currentGuess = null;
        p.guessElapsedMs = null;
        p.roundScore = 0;
      });

      // Default the presenter to the teacher/host who started the game
      if (player?.isTeacher || !localState.presenterId || !localState.players[localState.presenterId]) {
        localState.presenterId = playerId;
      }

      Object.values(localState.players).forEach(p => {
        p.isPresenter = p.id === localState.presenterId;
      });

      notifyListeners();
      break;
    }

    case 'PRESENTER_CHOICE': {
      // Allow presenter OR teacher/host to choose!
      const isAuthorized = playerId === localState.presenterId || player?.isTeacher;
      if (!isAuthorized) break;
      if (localState.stage !== 'PRESENTER_SELECTING') break;

      if (player?.isTeacher && localState.presenterId !== playerId) {
        localState.presenterId = playerId;
        Object.values(localState.players).forEach(p => {
          p.isPresenter = p.id === playerId;
        });
      }

      clearLocalBotTimers();
      localState.presenterChoice = msg.optionId;
      startClassGuessingPhase();
      break;
    }

    case 'SUBMIT_GUESS': {
      if (playerId === localState.presenterId) break;
      if (localState.stage !== 'CLASS_GUESSING') break;

      if (player && !player.currentGuess) {
        player.currentGuess = msg.optionId;
        player.guessElapsedMs = msg.elapsedMs;
        notifyListeners();
        checkAllGuessedAndReveal();
      }
      break;
    }

    case 'TRIGGER_REVEAL': {
      if (localState.stage === 'CLASS_GUESSING') {
        clearLocalBotTimers();
        localState.stage = 'REVEAL';
        calculateRoundScores();
        notifyListeners();
      }
      break;
    }

    case 'SHOW_SCOREBOARD': {
      if (localState.stage === 'REVEAL') {
        localState.stage = 'SCOREBOARD';
        notifyListeners();
      }
      break;
    }

    case 'NEXT_ROUND': {
      clearLocalBotTimers();
      const nextIndex = localState.roundIndex + 1;
      if (nextIndex >= localState.categories.length) {
        localState.stage = 'GAME_OVER';
        notifyListeners();
        break;
      }

      localState.roundIndex = nextIndex;
      const nextCatId = msg.categoryId || localState.categories[nextIndex];
      localState.currentCategory = GAME_CATEGORIES[nextCatId] || GAME_CATEGORIES.sport;
      localState.stage = 'PRESENTER_SELECTING';
      localState.presenterChoice = null;
      localState.guessPhaseStartTime = null;

      Object.values(localState.players).forEach(p => {
        p.currentGuess = null;
        p.guessElapsedMs = null;
        p.roundScore = 0;
      });

      if (localState.settings.autoRandomPresenter) {
        const playerIds = Object.keys(localState.players);
        if (playerIds.length > 1) {
          const candidates = playerIds.filter(id => id !== localState.presenterId);
          localState.presenterId = candidates[Math.floor(Math.random() * candidates.length)];
        }
      } else if (!localState.presenterId || !localState.players[localState.presenterId]) {
        const teacher = Object.values(localState.players).find(p => p.isTeacher);
        localState.presenterId = teacher ? teacher.id : playerId;
      }

      Object.values(localState.players).forEach(p => {
        p.isPresenter = p.id === localState.presenterId;
      });

      notifyListeners();
      break;
    }

    case 'SET_PRESENTER': {
      if (!localState.players[msg.playerId]) break;
      localState.presenterId = msg.playerId;
      Object.values(localState.players).forEach(p => {
        p.isPresenter = p.id === msg.playerId;
      });
      notifyListeners();
      break;
    }

    case 'PICK_RANDOM_PRESENTER': {
      const playerIds = Object.keys(localState.players);
      if (playerIds.length > 0) {
        const chosenId = playerIds[Math.floor(Math.random() * playerIds.length)];
        localState.presenterId = chosenId;
        Object.values(localState.players).forEach(p => {
          p.isPresenter = p.id === chosenId;
        });
        notifyListeners();
      }
      break;
    }

    case 'UPDATE_SETTINGS': {
      localState.settings = {
        ...localState.settings,
        ...msg.settings,
      };
      notifyListeners();
      break;
    }

    case 'ADD_DEMO_BOTS': {
      const count = Math.min(6, Math.max(1, msg.count || 3));
      const existingNames = new Set(Object.values(localState.players).map(p => p.name));
      const availableBots = BOT_NAMES.filter(n => !existingNames.has(n));

      for (let i = 0; i < count; i++) {
        const botName = availableBots[i] || `Student_${Math.floor(Math.random() * 90 + 10)}`;
        const botId = 'bot_' + Math.random().toString(36).substring(2, 9);
        localState.players[botId] = {
          id: botId,
          name: botName,
          avatar: BOT_AVATARS[i % BOT_AVATARS.length],
          favoriteColor: BOT_COLORS[i % BOT_COLORS.length],
          score: Math.floor(Math.random() * 600) + 200,
          previousRank: Object.keys(localState.players).length + 1,
          currentRank: Object.keys(localState.players).length + 1,
          isPresenter: false,
          isTeacher: false,
          isBot: true,
          connected: true,
          currentGuess: null,
          guessElapsedMs: null,
          roundScore: 0,
        };
      }
      updateRanks(localState.players);
      notifyListeners();
      break;
    }

    case 'REMOVE_DEMO_BOTS': {
      Object.keys(localState.players).forEach(id => {
        if (localState.players[id].isBot) {
          delete localState.players[id];
        }
      });
      updateRanks(localState.players);
      notifyListeners();
      break;
    }

    case 'RESET_GAME': {
      clearLocalBotTimers();
      localState.roundIndex = 0;
      localState.currentCategory = GAME_CATEGORIES.sport;
      localState.presenterChoice = null;
      localState.guessPhaseStartTime = null;
      localState.stage = 'LOBBY';
      localState.roundHistory = [];
      localState.lastRoundResult = null;

      Object.values(localState.players).forEach(p => {
        p.score = 0;
        p.previousRank = 0;
        p.currentRank = 1;
        p.currentGuess = null;
        p.guessElapsedMs = null;
        p.roundScore = 0;
      });

      notifyListeners();
      break;
    }
  }

  return localState;
}

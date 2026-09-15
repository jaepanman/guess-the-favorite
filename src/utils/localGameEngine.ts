import { GameRoomState, Player, CategoryId, GameSettings, RoundResult, ClientMessage } from '../types';
import { CATEGORY_ORDER, GAME_CATEGORIES, getRandomOptionsForCategory, getRandomizedCategoryOrder } from '../gameData';

const DEFAULT_SETTINGS: GameSettings = {
  autoRandomPresenter: false,
  hostCompensation: true,
  timeLimitSeconds: 15,
  hostCompensationPerWrong: 150,
  baseCorrectPoints: 500,
  maxSpeedBonus: 500,
  teacherEarnsPoints: false,
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
  const randomizedCategories = getRandomizedCategoryOrder();
  const initialCategory = getRandomOptionsForCategory(randomizedCategories[0], 5);
  return {
    code: (code || 'EFL1').toUpperCase(),
    stage: 'LOBBY',
    roundIndex: 0,
    categories: randomizedCategories,
    currentCategory: initialCategory,
    hostId: null,
    presenterId: null,
    presenterChoice: null,
    guessPhaseStartTime: null,
    settings: { ...DEFAULT_SETTINGS },
    players: {},
    roundHistory: [],
    lastRoundResult: null,
  };
}

function updateRanks(players: Record<string, Player>, hostId?: string | null, teacherEarnsPoints: boolean = false) {
  const playerList = Object.values(players);

  if (teacherEarnsPoints === false) {
    const students = playerList.filter(p => !p.isTeacher && p.role !== 'teacher' && (!hostId || p.id !== hostId));
    students.sort((a, b) => b.score - a.score);
    students.forEach((player, index) => {
      const newRank = index + 1;
      if (player.previousRank === 0) {
        player.previousRank = newRank;
      } else {
        player.previousRank = player.currentRank;
      }
      player.currentRank = newRank;
    });

    const teachers = playerList.filter(p => p.isTeacher || p.role === 'teacher' || (hostId && p.id === hostId));
    teachers.forEach(t => {
      t.score = 0;
      t.roundScore = 0;
      t.currentRank = 0;
      t.previousRank = 0;
    });
  } else {
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
  const timedOutPlayerIds: string[] = [];

  localState.currentCategory.options.forEach(opt => {
    optionCounts[opt.id] = { count: 0, playerIds: [] };
  });

  let incorrectGuessesCount = 0;
  const timeLimitMs = (localState.settings.timeLimitSeconds || 15) * 1000;

  Object.values(localState.players).forEach(player => {
    if (player.id === localState.presenterId) return;

    const isTeacher = Boolean(player.isTeacher || player.role === 'teacher' || (localState.hostId && player.id === localState.hostId));
    if (isTeacher && localState.settings.teacherEarnsPoints === false) {
      player.score = 0;
      player.roundScore = 0;
      player.lastScoreBreakdown = undefined;
      return;
    }

    const guess = player.currentGuess;
    const elapsed = player.guessElapsedMs;
    const hasAnsweredInTime = Boolean(guess && elapsed !== null && elapsed !== undefined && elapsed <= timeLimitMs);

    if (hasAnsweredInTime && guess && optionCounts[guess]) {
      optionCounts[guess].count += 1;
      optionCounts[guess].playerIds.push(player.id);
    }

    if (!hasAnsweredInTime) {
      // Ineligible for points: student did not choose an answer within 15 seconds
      timedOutPlayerIds.push(player.id);
      incorrectGuessesCount += 1;
      player.roundScore = 0;
      player.lastScoreBreakdown = {
        base: 0,
        speedBonus: 0,
        isCorrect: false,
        timedOut: true,
      };
      return;
    }

    const isCorrect = guess === correctOptionId;
    let pointsAwarded = 0;
    let speedBonus = 0;

    if (isCorrect) {
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
      timedOut: false,
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
  const isTeacherPresenter = Boolean(
    presenter && (presenter.isTeacher || presenter.role === 'teacher' || (localState.hostId && presenter.id === localState.hostId))
  );

  if (presenter && localState.settings.hostCompensation && (!isTeacherPresenter || localState.settings.teacherEarnsPoints !== false)) {
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
  } else if (isTeacherPresenter && localState.settings.teacherEarnsPoints === false) {
    hostPointsEarned = 0;
    if (presenter) {
      presenter.score = 0;
      presenter.roundScore = 0;
      presenter.lastScoreBreakdown = undefined;
    }
  }

  updateRanks(localState.players, localState.hostId, localState.settings.teacherEarnsPoints);

  const roundResult: RoundResult = {
    roundNumber: localState.roundIndex + 1,
    categoryId: localState.currentCategory.id,
    presenterId: localState.presenterId || '',
    presenterName: presenter ? presenter.name : 'Teacher',
    presenterChoice: correctOptionId,
    guesses: guessesRecord,
    optionCounts,
    timedOutPlayerIds,
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

  // Check if a teacher / host is already present in this room
  const activeHostPlayer = localState.hostId ? localState.players[localState.hostId] : undefined;
  const existingTeacher = Object.values(localState.players).find(
    p => p.id !== playerId && (p.isTeacher || p.role === 'teacher' || (localState.hostId && p.id === localState.hostId))
  );
  const hasActiveHost = Boolean(existingTeacher || activeHostPlayer);

  if (playerId && localState.players[playerId]) {
    const existing = localState.players[playerId];
    existing.name = name.trim() || existing.name;
    existing.avatar = avatar || existing.avatar;
    existing.favoriteColor = favoriteColor || existing.favoriteColor;
    existing.connected = true;

    // Retain host if player was already host
    const isAlreadyHost = existing.id === localState.hostId || existing.isTeacher;
    if (isAlreadyHost) {
      existing.isTeacher = true;
      existing.role = 'teacher';
      localState.hostId = existing.id;
      if (!localState.presenterId) {
        localState.presenterId = existing.id;
      }
    } else if (typeof isTeacher === 'boolean') {
      if (isTeacher && !hasActiveHost) {
        existing.isTeacher = true;
        existing.role = 'teacher';
        localState.hostId = existing.id;
      } else {
        existing.isTeacher = false;
        existing.role = existing.id === localState.presenterId ? 'presenter' : 'student';
      }
    }
    if (existing.isTeacher) {
      localState.presenterId = playerId;
      existing.isPresenter = true;
    }
    updateRanks(localState.players, localState.hostId, localState.settings.teacherEarnsPoints);
    notifyListeners();
    return { player: existing, state: localState };
  }

  if (!playerId) {
    playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  }

  // Determine if this player should be teacher/host
  let effectiveIsTeacher = false;
  if (isTeacher) {
    if (!hasActiveHost) {
      effectiveIsTeacher = true;
    } else {
      effectiveIsTeacher = false;
    }
  } else {
    // User explicitly chose Student: NEVER make them teacher
    effectiveIsTeacher = false;
  }

  if (effectiveIsTeacher) {
    localState.hostId = playerId;
  }

  const isTeacherRole = effectiveIsTeacher;
  const isPresenterRole = isTeacherRole || (localState.presenterId === null && isTeacherRole);

  const player: Player = {
    id: playerId,
    name: name.trim() || (isTeacherRole ? 'Teacher' : 'Student'),
    avatar: avatar || (isTeacherRole ? '👩‍🏫' : '🐶'),
    favoriteColor: favoriteColor || 'sky',
    score: 0,
    previousRank: 0,
    currentRank: Object.keys(localState.players).length + 1,
    isPresenter: isPresenterRole,
    isTeacher: isTeacherRole,
    role: isTeacherRole ? 'teacher' : (isPresenterRole ? 'presenter' : 'student'),
    connected: true,
    currentGuess: null,
    guessElapsedMs: null,
    roundScore: 0,
  };

  if (localState.presenterId === null || isTeacherRole) {
    localState.presenterId = playerId;
  }

  localState.players[playerId] = player;

  // Refresh roles for all players (ensuring only 1 teacher/host exists)
  const actualHostId = localState.hostId;
  Object.values(localState.players).forEach(p => {
    p.isPresenter = p.id === localState.presenterId;
    if (actualHostId && p.id === actualHostId) {
      p.role = 'teacher';
      p.isTeacher = true;
    } else {
      p.isTeacher = false;
      if (p.id === localState.presenterId) {
        p.role = 'presenter';
      } else {
        p.role = 'student';
      }
    }
  });

  updateRanks(localState.players, localState.hostId, localState.settings.teacherEarnsPoints);
  notifyListeners();
  return { player, state: localState };
}

export function dispatchLocalAction(playerId: string, msg: ClientMessage): GameRoomState {
  const player = localState.players[playerId];
  const isHost = Boolean(
    player?.isTeacher ||
    (localState.hostId && playerId === localState.hostId)
  );
  const isPresenter = Boolean(playerId === localState.presenterId);
  const isHostOrPresenter = Boolean(
    isHost ||
    isPresenter ||
    !localState.presenterId
  );

  switch (msg.type) {
    case 'START_GAME': {
      if (!isHostOrPresenter) break;
      clearLocalBotTimers();
      localState.roundIndex = 0;
      const randomizedCategories = getRandomizedCategoryOrder();
      localState.categories = randomizedCategories;
      localState.currentCategory = getRandomOptionsForCategory(randomizedCategories[0], 5);
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

      const timeLimitMs = (localState.settings.timeLimitSeconds || 15) * 1000;
      const currentElapsed = localState.guessPhaseStartTime 
        ? (Date.now() - localState.guessPhaseStartTime) 
        : msg.elapsedMs;

      // Strictly ineligible if submitted after the time limit (with small 250ms network jitter allowance)
      if (currentElapsed > timeLimitMs + 250 || msg.elapsedMs > timeLimitMs + 250) {
        break;
      }

      if (player && !player.currentGuess) {
        player.currentGuess = msg.optionId;
        player.guessElapsedMs = Math.min(timeLimitMs, msg.elapsedMs);
        notifyListeners();
        checkAllGuessedAndReveal();
      }
      break;
    }

    case 'TRIGGER_REVEAL': {
      if (!isHostOrPresenter) break;
      if (localState.stage === 'CLASS_GUESSING') {
        clearLocalBotTimers();
        localState.stage = 'REVEAL';
        calculateRoundScores();
        notifyListeners();
      }
      break;
    }

    case 'SHOW_SCOREBOARD': {
      if (!isHostOrPresenter) break;
      if (localState.stage === 'REVEAL') {
        localState.stage = 'SCOREBOARD';
        notifyListeners();
      }
      break;
    }

    case 'NEXT_ROUND': {
      if (!isHostOrPresenter) break;
      clearLocalBotTimers();
      const nextIndex = localState.roundIndex + 1;
      if (nextIndex >= localState.categories.length) {
        localState.stage = 'GAME_OVER';
        notifyListeners();
        break;
      }

      localState.roundIndex = nextIndex;
      const nextCatId = msg.categoryId || localState.categories[nextIndex];
      localState.currentCategory = getRandomOptionsForCategory(nextCatId, 5);
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
      if (!isHostOrPresenter) break;
      if (!localState.players[msg.playerId]) break;
      if (botPresenterTimeout) {
        clearTimeout(botPresenterTimeout);
        botPresenterTimeout = null;
      }
      localState.presenterId = msg.playerId;
      Object.values(localState.players).forEach(p => {
        p.isPresenter = p.id === msg.playerId;
        if (p.id === localState.hostId) {
          p.role = 'teacher';
          p.isTeacher = true;
        } else {
          p.isTeacher = false;
          if (p.isPresenter) {
            p.role = 'presenter';
          } else {
            p.role = 'student';
          }
        }
      });
      notifyListeners();
      break;
    }

    case 'TAKE_BACK_PRESENTER': {
      if (!isHost) break;
      if (botPresenterTimeout) {
        clearTimeout(botPresenterTimeout);
        botPresenterTimeout = null;
      }
      const targetId = playerId || localState.hostId;
      if (targetId && localState.players[targetId]) {
        localState.presenterId = targetId;
        Object.values(localState.players).forEach(p => {
          p.isPresenter = p.id === targetId;
          if (p.id === localState.hostId) {
            p.role = 'teacher';
            p.isTeacher = true;
          } else {
            p.isTeacher = false;
            if (p.isPresenter) {
              p.role = 'presenter';
            } else {
              p.role = 'student';
            }
          }
        });
        notifyListeners();
      }
      break;
    }

    case 'PICK_RANDOM_PRESENTER': {
      if (!isHostOrPresenter) break;
      if (botPresenterTimeout) {
        clearTimeout(botPresenterTimeout);
        botPresenterTimeout = null;
      }
      const playerIds = Object.keys(localState.players);
      if (playerIds.length > 0) {
        const studentCandidates = playerIds.filter(id => id !== localState.presenterId && !localState.players[id]?.isTeacher);
        const otherCandidates = playerIds.filter(id => id !== localState.presenterId);
        const pool = studentCandidates.length > 0 ? studentCandidates : (otherCandidates.length > 0 ? otherCandidates : playerIds);
        const chosenId = pool[Math.floor(Math.random() * pool.length)];

        localState.presenterId = chosenId;
        Object.values(localState.players).forEach(p => {
          p.isPresenter = p.id === chosenId;
          if (p.id === localState.hostId || p.isTeacher) {
            p.role = 'teacher';
          } else if (p.isPresenter) {
            p.role = 'presenter';
          } else {
            p.role = 'student';
          }
        });
        notifyListeners();
      }
      break;
    }

    case 'UPDATE_SETTINGS': {
      if (!isHostOrPresenter) break;
      localState.settings = {
        ...localState.settings,
        ...msg.settings,
      };
      if (localState.settings.teacherEarnsPoints === false) {
        Object.values(localState.players).forEach(p => {
          if (p.isTeacher || p.role === 'teacher' || (localState.hostId && p.id === localState.hostId)) {
            p.score = 0;
            p.roundScore = 0;
            p.currentRank = 0;
            p.previousRank = 0;
          }
        });
      }
      updateRanks(localState.players, localState.hostId, localState.settings.teacherEarnsPoints);
      notifyListeners();
      break;
    }

    case 'ADD_DEMO_BOTS': {
      if (!isHostOrPresenter) break;
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
      updateRanks(localState.players, localState.hostId, localState.settings.teacherEarnsPoints);
      notifyListeners();
      break;
    }

    case 'REMOVE_DEMO_BOTS': {
      if (!isHostOrPresenter) break;
      Object.keys(localState.players).forEach(id => {
        if (localState.players[id].isBot) {
          delete localState.players[id];
        }
      });
      updateRanks(localState.players, localState.hostId, localState.settings.teacherEarnsPoints);
      notifyListeners();
      break;
    }

    case 'END_GAME': {
      if (!isHostOrPresenter) break;
      clearLocalBotTimers();
      localState.stage = 'GAME_OVER';
      notifyListeners();
      break;
    }

    case 'RESET_GAME': {
      if (!isHostOrPresenter) break;
      clearLocalBotTimers();
      localState.roundIndex = 0;
      const randomizedCategories = getRandomizedCategoryOrder();
      localState.categories = randomizedCategories;
      localState.currentCategory = getRandomOptionsForCategory(randomizedCategories[0], 5);
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
        p.lastScoreBreakdown = undefined;
      });

      notifyListeners();
      break;
    }

    case 'CLOSE_ROOM': {
      if (!isHost) break;
      clearLocalBotTimers();
      localState.hostId = null;
      localState.presenterId = null;
      localState.presenterChoice = null;
      localState.guessPhaseStartTime = null;
      localState.stage = 'LOBBY';
      localState.players = {};
      localState.roundIndex = 0;
      localState.roundHistory = [];
      localState.lastRoundResult = null;
      notifyListeners();
      break;
    }

    case 'LEAVE_ROOM': {
      if (isHost) {
        clearLocalBotTimers();
        localState.hostId = null;
        localState.presenterId = null;
        localState.presenterChoice = null;
        localState.guessPhaseStartTime = null;
        localState.stage = 'LOBBY';
        localState.players = {};
        localState.roundIndex = 0;
        localState.roundHistory = [];
        localState.lastRoundResult = null;
      } else {
        delete localState.players[playerId];
        if (localState.presenterId === playerId) {
          localState.presenterId = localState.hostId || null;
        }
        updateRanks(localState.players, localState.hostId, localState.settings.teacherEarnsPoints);
      }
      notifyListeners();
      break;
    }
  }

  return localState;
}

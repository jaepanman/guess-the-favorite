export type CategoryId = 'sport' | 'color' | 'fruit' | 'food' | 'drink' | 'dessert' | 'animal';

export interface CategoryOption {
  id: string;
  keyNumber: number; // 1 to 6
  name: string;
  icon: string;
  colorClass?: string;
  phonetic?: string;
}

export interface GameCategory {
  id: CategoryId;
  label: string;
  questionPhrase: string; // "What sport do you like?"
  answerPhraseTemplate: string; // "I like {option}!"
  icon: string;
  options: CategoryOption[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  favoriteColor: string;
  score: number;
  previousRank: number;
  currentRank: number;
  isPresenter: boolean;
  isTeacher: boolean;
  isBot?: boolean;
  connected: boolean;
  currentGuess?: string | null;
  guessElapsedMs?: number | null;
  roundScore?: number;
  lastScoreBreakdown?: {
    base: number;
    speedBonus: number;
    hostBonus?: number;
    incorrectCount?: number;
    isCorrect?: boolean;
  };
}

export type GameStage = 
  | 'LOBBY'
  | 'PRESENTER_SELECTING'
  | 'CLASS_GUESSING'
  | 'REVEAL'
  | 'SCOREBOARD'
  | 'GAME_OVER';

export interface RoundResult {
  roundNumber: number;
  categoryId: CategoryId;
  presenterId: string;
  presenterName: string;
  presenterChoice: string;
  guesses: Record<string, { optionId: string; elapsedMs: number; isCorrect: boolean; points: number }>;
  optionCounts: Record<string, { count: number; playerIds: string[] }>;
  hostPointsEarned: number;
}

export interface GameSettings {
  autoRandomPresenter: boolean;
  hostCompensation: boolean;
  timeLimitSeconds: number;
  hostCompensationPerWrong: number;
  baseCorrectPoints: number;
  maxSpeedBonus: number;
}

export interface GameRoomState {
  code: string;
  stage: GameStage;
  roundIndex: number;
  categories: CategoryId[];
  currentCategory: GameCategory;
  presenterId: string | null;
  presenterChoice: string | null;
  guessPhaseStartTime: number | null;
  settings: GameSettings;
  players: Record<string, Player>;
  roundHistory: RoundResult[];
  lastRoundResult: RoundResult | null;
}

export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; name: string; avatar: string; favoriteColor: string; isTeacher?: boolean }
  | { type: 'START_GAME'; roomCode: string }
  | { type: 'PRESENTER_CHOICE'; roomCode: string; optionId: string }
  | { type: 'SUBMIT_GUESS'; roomCode: string; optionId: string; elapsedMs: number }
  | { type: 'TRIGGER_REVEAL'; roomCode: string }
  | { type: 'SHOW_SCOREBOARD'; roomCode: string }
  | { type: 'NEXT_ROUND'; roomCode: string; categoryId?: CategoryId }
  | { type: 'SET_PRESENTER'; roomCode: string; playerId: string }
  | { type: 'PICK_RANDOM_PRESENTER'; roomCode: string }
  | { type: 'UPDATE_SETTINGS'; roomCode: string; settings: Partial<GameSettings> }
  | { type: 'ADD_DEMO_BOTS'; roomCode: string; count: number }
  | { type: 'REMOVE_DEMO_BOTS'; roomCode: string }
  | { type: 'RESET_GAME'; roomCode: string };

export type ServerMessage =
  | { type: 'ROOM_STATE'; state: GameRoomState }
  | { type: 'ERROR'; message: string }
  | { type: 'NEW_ROUND_NOTIFICATION'; presenterName: string; categoryLabel: string }
  | { type: 'TIMER_TICK'; remainingMs: number };

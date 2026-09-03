import React, { useState, useEffect } from 'react';
import { Timer, Zap, CheckCircle2, Lock, Volume2, Users, AlertCircle } from 'lucide-react';
import { GameRoomState, Player, CategoryOption } from '../types';
import { playSelectSound, playLockInSound, playTickSound, speakEnglishPhrase } from '../utils/soundEffects';

interface ClassGuessingViewProps {
  roomState: GameRoomState;
  myPlayer: Player | undefined;
  onSubmitGuess: (optionId: string, elapsedMs: number) => void;
  onTriggerReveal: () => void;
}

export const ClassGuessingView: React.FC<ClassGuessingViewProps> = ({
  roomState,
  myPlayer,
  onSubmitGuess,
  onTriggerReveal,
}) => {
  const category = roomState.currentCategory;
  const presenter = roomState.presenterId ? roomState.players[roomState.presenterId] : null;
  const isPresenter = Boolean(myPlayer && myPlayer.id === roomState.presenterId);

  // Time calculation
  const startTime = roomState.guessPhaseStartTime || Date.now();
  const timeLimitMs = (roomState.settings?.timeLimitSeconds || 15) * 1000;

  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(myPlayer?.currentGuess || null);
  const [lockedTime, setLockedTime] = useState<number | null>(myPlayer?.guessElapsedMs || null);
  const myGuessOption = category.options.find(o => o.id === selectedGuess);

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(timeLimitMs, now - startTime);
      setElapsedMs(elapsed);

      // Sound tick in the last 4 seconds
      const remainingSeconds = Math.ceil((timeLimitMs - elapsed) / 1000);
      if (remainingSeconds <= 4 && remainingSeconds > 0) {
        playTickSound();
      }

      // Auto trigger reveal when time expires
      if (elapsed >= timeLimitMs) {
        clearInterval(interval);
        if (isPresenter || myPlayer?.isTeacher) {
          onTriggerReveal();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, timeLimitMs, isPresenter, myPlayer?.isTeacher, onTriggerReveal]);

  // Handle student guess lock-in
  const handleLockIn = (optId: string) => {
    if (selectedGuess || isPresenter) return;
    const currentElapsed = Math.max(200, Date.now() - startTime);
    setSelectedGuess(optId);
    setLockedTime(currentElapsed);
    playLockInSound();
    onSubmitGuess(optId, currentElapsed);
  };

  // Keyboard number shortcuts (1-5) for students
  useEffect(() => {
    if (isPresenter || selectedGuess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= category.options.length) {
        const option = category.options.find(o => o.keyNumber === num);
        if (option) {
          handleLockIn(option.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenter, selectedGuess, category.options]);

  const remainingMs = Math.max(0, timeLimitMs - elapsedMs);
  const remainingSeconds = (remainingMs / 1000).toFixed(1);
  const progressPercent = Math.min(100, Math.max(0, (remainingMs / timeLimitMs) * 100));

  // Current speed bonus potential
  const currentSpeedBonus = Math.max(0, Math.round(500 * (remainingMs / timeLimitMs)));

  // Guesser submission stats
  const allPlayers: Player[] = Object.values(roomState.players) as Player[];
  const guessers: Player[] = allPlayers.filter(p => p.id !== roomState.presenterId);
  const submittedCount = guessers.filter(p => p.currentGuess !== null && p.currentGuess !== undefined).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Timer & Speed Bonus Header Bar */}
      <div className="bg-slate-900/60 rounded-3xl border border-white/10 backdrop-blur-md p-6 sm:p-8 relative overflow-hidden">
        {/* Animated Progress Bar */}
        <div
          className={`absolute top-0 left-0 h-1.5 transition-all duration-150 ${
            progressPercent > 35 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-rose-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-black uppercase tracking-wider">
                GUESSING PHASE
              </span>
              <span className="text-xs font-bold text-slate-400">
                {submittedCount} of {guessers.length} students answered
              </span>
            </div>

            <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-1">
              Classroom EFL Question
            </p>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>What does <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 border-b-2 sm:border-b-4 border-indigo-500/30">{presenter?.name}</span> like?</span>
              <button
                onClick={() => speakEnglishPhrase(`What does ${presenter?.name || 'the presenter'} like?`)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white transition cursor-pointer"
                title="Speak English prompt"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Category: <strong className="text-indigo-300">{category.label}</strong> • Guess fast for a high speed bonus!
            </p>
          </div>

          {/* Time & Live Bonus Counter */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/10 text-white flex items-center gap-2.5 shadow-xs">
              <Timer className="w-5 h-5 text-indigo-400 animate-pulse" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Time Left
                </div>
                <div className="text-xl font-mono font-black text-white">
                  {remainingSeconds}s
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center gap-2.5 shadow-xs">
              <Zap className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-[10px] font-bold text-orange-300 uppercase tracking-wider">
                  Speed Bonus
                </div>
                <div className="text-xl font-mono font-black text-orange-400">
                  +{currentSpeedBonus}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Presenter View vs Student Guessing View */}
      {isPresenter ? (
        /* Presenter View */
        <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-amber-500/20">
              👑
            </div>
            <h2 className="text-2xl font-black text-white">
              Your Choice is Locked!
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Classmates are trying to guess your favorite {category.label.toLowerCase()}.
            </p>
          </div>

          {/* Live Progress indicator */}
          <div className="max-w-lg mx-auto bg-slate-800/60 rounded-2xl p-5 border border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Classmate Submissions
              </span>
              <span className="text-indigo-400 font-mono text-base font-black">
                {submittedCount} / {guessers.length}
              </span>
            </div>

            {/* Submitting avatar indicators */}
            <div className="flex flex-wrap gap-2 pt-2">
              {guessers.map(guesser => {
                const hasAnswered = guesser.currentGuess !== null && guesser.currentGuess !== undefined;
                return (
                  <div
                    key={guesser.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      hasAnswered
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800/40 text-slate-500 border-white/5'
                    }`}
                  >
                    <span>{guesser.avatar}</span>
                    <span>{guesser.name}</span>
                    {hasAnswered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host Reveal Button */}
          <div className="text-center pt-2">
            <button
              onClick={onTriggerReveal}
              id="reveal-now-btn"
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              Reveal Answer Now 📣
            </button>
          </div>
        </div>
      ) : (
        /* Student Guessing View */
        <div className="space-y-6">
          {selectedGuess ? (
            /* Student Has Already Submitted Their Guess */
            <div className="bg-slate-900/60 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-lg backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">
                Guess Locked In!
              </h2>
              {myGuessOption && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-800/90 border border-white/10 text-white font-bold my-1 shadow-sm">
                  <span className="text-2xl">{myGuessOption.icon}</span>
                  <span className="font-black text-indigo-300 text-base">{myGuessOption.name}</span>
                  {myGuessOption.japanese && (
                    <span className="text-xs text-slate-400 font-medium">({myGuessOption.japanese})</span>
                  )}
                </div>
              )}
              <p className="text-slate-300 text-base">
                You guessed in <strong className="font-mono text-emerald-400">{((lockedTime || 0) / 1000).toFixed(2)}s</strong>.
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-sm font-bold text-emerald-300">
                Potential Score: 500 Base + up to {Math.max(0, Math.round(500 * Math.max(0, 1 - ((lockedTime || 0) / timeLimitMs))))} Speed Bonus!
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Waiting for the grand reveal once all students finish...
              </p>
            </div>
          ) : (
            /* Active Guessing Options Buttons */
            <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Click an option or press [1 - {category.options.length}] on your keyboard:
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-md">
                  HOTKEYS [1-{category.options.length}]
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {category.options.map((opt) => (
                  <button
                    key={opt.id}
                    id={`guess-option-${opt.id}`}
                    onClick={() => handleLockIn(opt.id)}
                    className="group relative flex flex-col p-4 sm:p-5 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border-2 border-white/10 hover:border-indigo-500 shadow-lg hover:shadow-indigo-500/10 transition-all text-left cursor-pointer overflow-hidden backdrop-blur-xs transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 group-hover:bg-indigo-500 group-hover:text-white font-mono font-black text-xs sm:text-sm flex items-center justify-center text-slate-400 transition">
                        {opt.keyNumber}
                      </span>
                      <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">
                        {opt.icon}
                      </span>
                    </div>

                    <div className="font-black text-white text-base sm:text-lg group-hover:text-indigo-200">
                      {opt.name}
                    </div>

                    {opt.japanese && (
                      <div className="text-xs text-slate-400 font-medium mt-0.5 tracking-normal">
                        {opt.japanese}
                      </div>
                    )}

                    {opt.phonetic && (
                      <div className="text-[10px] text-indigo-300/60 font-mono mt-0.5">
                        {opt.phonetic}
                      </div>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-indigo-300">
                      <span>[{opt.keyNumber}]</span>
                      <Zap className="w-3.5 h-3.5 text-orange-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>

                    {/* Bottom geometric accent bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900">
                      <div className="h-full bg-indigo-500 w-0 group-hover:w-full transition-all duration-300"></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

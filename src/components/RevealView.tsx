import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Award, Zap, Crown, Users, ArrowRight, ShieldCheck, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { GameRoomState, Player } from '../types';
import { playCelebrationSound, speakEnglishPhrase } from '../utils/soundEffects';

interface RevealViewProps {
  roomState: GameRoomState;
  myPlayer: Player | undefined;
  onShowScoreboard: () => void;
}

export const RevealView: React.FC<RevealViewProps> = ({
  roomState,
  myPlayer,
  onShowScoreboard,
}) => {
  const lastResult = roomState.lastRoundResult;
  const category = roomState.currentCategory;
  const presenter = roomState.presenterId ? roomState.players[roomState.presenterId] : null;
  const correctOptionId = roomState.presenterChoice;
  const correctOption = category.options.find(o => o.id === correctOptionId);

  // Trigger celebration on mount (No auto-reading; user/teacher clicks speaker icon to play)
  useEffect(() => {
    playCelebrationSound();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  }, []);

  const allPlayers: Player[] = Object.values(roomState.players) as Player[];
  const guessers: Player[] = allPlayers.filter(p => p.id !== roomState.presenterId);
  const totalGuessers = guessers.length;

  // Timed out players who didn't submit an answer within 15 seconds
  const timedOutPlayerIds = lastResult?.timedOutPlayerIds || guessers.filter(p => !p.currentGuess).map(p => p.id);
  const timedOutGuessers = timedOutPlayerIds.map(id => roomState.players[id]).filter(Boolean);

  // Presenter host compensation details
  const hostIncorrectCount = presenter?.lastScoreBreakdown?.incorrectCount ?? 0;
  const hostBonusEarned = presenter?.roundScore ?? 0;

  // My player outcome
  const isPresenter = Boolean(myPlayer && myPlayer.id === roomState.presenterId);
  const myGuess = myPlayer?.currentGuess;
  const myGuessOption = category.options.find(o => o.id === myGuess);
  const myTimedOut = Boolean(myPlayer?.lastScoreBreakdown?.timedOut || (!isPresenter && !myGuess));
  const myIsCorrect = Boolean(myPlayer?.lastScoreBreakdown?.isCorrect);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Grand Reveal Card */}
      <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md p-6 sm:p-10 text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-[0.2em]">
          🎉 REVEAL TIME
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white border-2 border-white/20 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
            {presenter?.avatar || '👑'}
          </div>
          <div className="text-left sm:text-center md:text-left">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {presenter?.name}&apos;s Favorite {category.label}
            </div>
            <div className="text-3xl sm:text-5xl font-black text-white flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {correctOption?.icon} {correctOption?.name}
              </span>
              {correctOption?.japanese && (
                <span className="text-sm sm:text-lg text-slate-400 font-medium tracking-normal">
                  ({correctOption.japanese})
                </span>
              )}
              <button
                type="button"
                onClick={() => speakEnglishPhrase(`${presenter?.name || 'The presenter'} likes ${correctOption?.name}! I like ${correctOption?.name}!`)}
                title="Play answer audio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition cursor-pointer text-xs font-bold"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Play Audio</span>
              </button>
            </div>
          </div>
        </div>

        {/* EFL Speaking Answer Practice */}
        <div className="max-w-lg mx-auto p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3">
          <div>
            English Speaking Model: <strong className="text-white">&ldquo;I like {correctOption?.name}!&rdquo;</strong>
          </div>
          <button
            type="button"
            onClick={() => speakEnglishPhrase(`I like ${correctOption?.name}!`)}
            title={`Listen: "I like ${correctOption?.name}!"`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 transition cursor-pointer shrink-0 text-xs font-bold"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hear Model</span>
          </button>
        </div>
      </div>

      {/* Personal Round Result Banner */}
      {myPlayer && (
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-lg backdrop-blur-md transition ${
          isPresenter
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : myTimedOut
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : myIsCorrect
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-slate-900/60 border-white/10 text-slate-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md ${
                isPresenter
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : myTimedOut
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : myIsCorrect
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border border-white/10'
              }`}>
                {isPresenter ? '👑' : myTimedOut ? <Clock className="w-6 h-6 text-rose-400" /> : myIsCorrect ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-slate-400" />}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Your Round Outcome
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {isPresenter ? (
                    <span>Presenter Reward: +{hostBonusEarned} pts</span>
                  ) : myTimedOut ? (
                    <span className="text-rose-400">Time Expired: Ineligible for Points (0 pts)</span>
                  ) : myIsCorrect ? (
                    <span className="text-emerald-400">Correct Guess! +{myPlayer.roundScore || 0} pts</span>
                  ) : (
                    <span>Incorrect Guess (0 pts)</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm mt-0.5 opacity-90">
                  {isPresenter ? (
                    `You presented ${category.label} and fooled ${hostIncorrectCount} classmates!`
                  ) : myTimedOut ? (
                    `You did not choose an answer within 15 seconds. Not answering makes you ineligible to score points this round. Lock in an answer next round to earn points!`
                  ) : myIsCorrect ? (
                    `You locked in ${myGuessOption?.name} in ${((myPlayer.guessElapsedMs || 0) / 1000).toFixed(2)}s (+${myPlayer.lastScoreBreakdown?.base} base, +${myPlayer.lastScoreBreakdown?.speedBonus} speed bonus).`
                  ) : (
                    `You guessed ${myGuessOption?.name || 'an option'}, but ${presenter?.name || 'the presenter'} likes ${correctOption?.name}.`
                  )}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Score
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {myPlayer.score} <span className="text-xs text-slate-400 font-normal">pts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Choice Distribution Breakdown */}
      <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Class Choice Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              See how many students chose what option
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {totalGuessers} total guesses
          </span>
        </div>

        <div className="space-y-3">
          {category.options.map((opt) => {
            const isCorrect = opt.id === correctOptionId;
            const stat = lastResult?.optionCounts[opt.id] || { count: 0, playerIds: [] };
            const count = stat.count;
            const percent = totalGuessers > 0 ? Math.round((count / totalGuessers) * 100) : 0;

            // Find player avatars
            const pickingPlayers = stat.playerIds.map(id => roomState.players[id]).filter(Boolean);

            return (
              <div
                key={opt.id}
                className={`p-4 rounded-2xl border transition ${
                  isCorrect
                    ? 'border-emerald-500/50 bg-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'border-white/5 bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-black text-white text-base">
                      {opt.name}
                    </span>
                    {opt.japanese && (
                      <span className="text-xs text-slate-400 font-normal">
                        ({opt.japanese})
                      </span>
                    )}
                    {isCorrect && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                        <Crown className="w-3 h-3 text-emerald-400" />
                        CORRECT ANSWER
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => speakEnglishPhrase(`I like ${opt.name}!`)}
                      title={`Listen: "I like ${opt.name}!"`}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-white text-sm">
                      {count} {count === 1 ? 'student' : 'students'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold ml-1.5">
                      ({percent}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCorrect ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Avatars of students who picked this option */}
                {pickingPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pickingPlayers.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200"
                      >
                        <span>{p.avatar}</span>
                        <span>{p.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unanswered / Timed Out Students Row */}
          {timedOutGuessers.length > 0 && (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Did Not Answer in Time (Ineligible for points)</span>
                </div>
                <span className="font-mono text-xs font-black text-rose-400 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30">
                  {timedOutGuessers.length} {timedOutGuessers.length === 1 ? 'student' : 'students'} (0 pts)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {timedOutGuessers.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-rose-500/20 text-xs font-semibold text-slate-200"
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                    <span className="text-[10px] text-rose-400 font-bold font-mono">Timed Out</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gamification & Points Compensation Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Presenter Compensation Card */}
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs">
              👑
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Presenter Compensation
              </div>
              <div className="text-lg font-black text-white">
                {presenter?.name} earned +{hostBonusEarned} pts!
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300">
            For leading the round and choosing an engaging favorite:
          </p>

          <div className="space-y-1.5 text-xs font-bold text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
            <div className="flex justify-between">
              <span>Host Appreciation Bonus:</span>
              <span className="font-mono text-amber-400">+200 pts</span>
            </div>
            <div className="flex justify-between">
              <span>Tricked / Timed-out Classmates ({hostIncorrectCount} &times; 150 pts):</span>
              <span className="font-mono text-amber-400">+{hostIncorrectCount * 150} pts</span>
            </div>
          </div>
        </div>

        {/* Speed Winners Card */}
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl border border-indigo-500/30">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Fastest Correct Guesses
              </div>
              <div className="text-lg font-black text-white">
                Speed Bonus Breakdown
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {guessers
              .filter(p => p.currentGuess === correctOptionId)
              .sort((a, b) => (a.guessElapsedMs || 0) - (b.guessElapsedMs || 0))
              .map((p) => {
                const breakdown = p.lastScoreBreakdown;
                const elapsedSec = ((p.guessElapsedMs || 0) / 1000).toFixed(2);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-white/5 text-xs font-bold text-slate-300"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({elapsedSec}s)</span>
                    </span>
                    <span className="font-mono text-emerald-400">
                      +{p.roundScore} pts (+{breakdown?.speedBonus} speed)
                    </span>
                  </div>
                );
              })}

            {guessers.filter(p => p.currentGuess === correctOptionId).length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">
                Nobody guessed {presenter?.name}&apos;s favorite! {presenter?.name} fooled the entire class!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Button to Leaderboard */}
      <div className="text-center pt-2">
        <button
          onClick={onShowScoreboard}
          id="view-scoreboard-btn"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25 transition cursor-pointer"
        >
          <span>View Scoreboard & Rankings</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

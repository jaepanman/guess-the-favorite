import React from 'react';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, ArrowRight, Shuffle, UserCheck, Play } from 'lucide-react';
import { GameRoomState, Player, CategoryId } from '../types';
import { CATEGORY_ORDER, GAME_CATEGORIES, AVAILABLE_COLORS } from '../gameData';
import { playSelectSound } from '../utils/soundEffects';

interface ScoreboardViewProps {
  roomState: GameRoomState;
  myPlayer: Player | undefined;
  onNextRound: (categoryId?: CategoryId) => void;
  onPickRandomPresenter: () => void;
  onSetPresenter: (playerId: string) => void;
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({
  roomState,
  myPlayer,
  onNextRound,
  onPickRandomPresenter,
  onSetPresenter,
}) => {
  const allPlayers: Player[] = (Object.values(roomState.players) as Player[]).sort((a, b) => b.score - a.score);
  const nextRoundIndex = roomState.roundIndex + 1;
  const isFinalRound = nextRoundIndex >= roomState.categories.length;
  const nextCatId = !isFinalRound ? roomState.categories[nextRoundIndex % roomState.categories.length] : null;
  const nextCategory = nextCatId ? GAME_CATEGORIES[nextCatId] : null;

  const currentPresenter = roomState.presenterId ? roomState.players[roomState.presenterId] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 rounded-3xl border border-white/10 backdrop-blur-md p-6 sm:p-8 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-indigo-400" />
          <span>Round {roomState.roundIndex + 1} Leaderboard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Classroom Rankings
        </h1>
        <p className="text-slate-400 text-sm">
          Watch players rise and fall! Correct and fast answers push you up the leaderboard.
        </p>
      </div>

      {/* Top 3 Podium (if >= 2 players) */}
      {allPlayers.length >= 2 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
          {/* 2nd Place */}
          {allPlayers[1] && (
            <div className="flex flex-col items-center">
              <div className="text-2xl sm:text-3xl mb-1">{allPlayers[1].avatar}</div>
              <div className="font-bold text-slate-200 text-xs sm:text-sm truncate max-w-full">
                {allPlayers[1].name}
              </div>
              <div className="text-xs font-mono font-black text-slate-400 mb-2">
                {allPlayers[1].score} pts
              </div>
              <div className="w-full bg-slate-800/80 rounded-t-2xl h-20 sm:h-24 flex flex-col items-center justify-center border-t-4 border-slate-400 border-x border-white/5">
                <span className="text-xl sm:text-2xl font-black text-slate-200">2</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Silver</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {allPlayers[0] && (
            <div className="flex flex-col items-center">
              <div className="text-amber-400 mb-0.5 animate-pulse">
                <Crown className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-3xl sm:text-4xl mb-1">{allPlayers[0].avatar}</div>
              <div className="font-black text-white text-sm sm:text-base truncate max-w-full">
                {allPlayers[0].name}
              </div>
              <div className="text-xs sm:text-sm font-mono font-black text-amber-400 mb-2">
                {allPlayers[0].score} pts
              </div>
              <div className="w-full bg-amber-500/15 rounded-t-2xl h-28 sm:h-32 flex flex-col items-center justify-center border-t-4 border-amber-400 border-x border-amber-500/20 shadow-lg shadow-amber-500/10">
                <span className="text-2xl sm:text-3xl font-black text-amber-300">1</span>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Gold</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {allPlayers[2] && (
            <div className="flex flex-col items-center">
              <div className="text-2xl sm:text-3xl mb-1">{allPlayers[2].avatar}</div>
              <div className="font-bold text-slate-200 text-xs sm:text-sm truncate max-w-full">
                {allPlayers[2].name}
              </div>
              <div className="text-xs font-mono font-black text-orange-400/80 mb-2">
                {allPlayers[2].score} pts
              </div>
              <div className="w-full bg-orange-950/30 rounded-t-2xl h-16 sm:h-20 flex flex-col items-center justify-center border-t-4 border-amber-700 border-x border-white/5">
                <span className="text-lg sm:text-xl font-black text-orange-300">3</span>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Bronze</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Leaderboard List with Rank Shift Animation */}
      <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-4 sm:p-6 space-y-2">
        <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-4 py-1.5 flex items-center justify-between border-b border-white/5">
          <span>Player & Ranking</span>
          <span>Score & Changes</span>
        </div>

        <div className="space-y-2 pt-1">
          {allPlayers.map((player, index) => {
            const currentRank = index + 1;
            const prevRank = player.previousRank || currentRank;
            const rankDiff = prevRank - currentRank; // Positive means jumped up, negative means fell down
            const isMe = player.id === myPlayer?.id;
            const colorConfig = AVAILABLE_COLORS.find(c => c.id === player.favoriteColor) || AVAILABLE_COLORS[0];

            return (
              <motion.div
                key={player.id}
                layout
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  isMe
                    ? 'border-indigo-500/60 bg-indigo-500/15 ring-1 ring-indigo-500/30'
                    : 'border-white/5 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                {/* Left: Rank, Shift Badge, Avatar, Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Numerical Rank */}
                  <span className="w-7 text-center font-mono font-black text-slate-300 text-base">
                    #{currentRank}
                  </span>

                  {/* Jump Up / Fall Down Rank Indicator */}
                  <div className="w-16 shrink-0">
                    {rankDiff > 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs animate-bounce border border-emerald-500/30">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        +{rankDiff}
                      </span>
                    ) : rankDiff < 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                        {rankDiff}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 font-mono font-bold text-xs border border-white/5">
                        <Minus className="w-3 h-3" />
                        0
                      </span>
                    )}
                  </div>

                  {/* Avatar with favorite color ring */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                    style={{ backgroundColor: `${colorConfig.hex}22`, borderColor: colorConfig.hex }}
                  >
                    {player.avatar}
                  </div>

                  {/* Player Name */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm sm:text-base truncate">
                        {player.name}
                      </span>
                      {player.isPresenter && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          Host
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Round points gained & Total score */}
                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-white text-base sm:text-lg">
                    {player.score} <span className="text-xs text-slate-400 font-normal">pts</span>
                  </div>
                  {player.roundScore !== undefined && player.roundScore > 0 && (
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      +{player.roundScore} this round
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Presenter Selection & Next Round Controls */}
      <div className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Presenter for Next Round
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current: <strong className="text-slate-200">{currentPresenter?.avatar} {currentPresenter?.name}</strong> • Pick a random student or appoint someone new!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSelectSound();
                onPickRandomPresenter();
              }}
              id="pick-random-for-next-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              Pick Random Student
            </button>
          </div>
        </div>

        {/* Next Question Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onNextRound(nextCatId || undefined)}
            id="start-next-round-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            {isFinalRound ? (
              <span>Finish Game & Final Podium 🏆</span>
            ) : (
              <>
                <span>Next Question: {nextCategory?.label} ({nextCategory?.icon})</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

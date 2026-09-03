import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Award, Star, Zap, Crown } from 'lucide-react';
import { GameRoomState, Player } from '../types';
import { playCelebrationSound, speakEnglishPhrase } from '../utils/soundEffects';

interface GameOverViewProps {
  roomState: GameRoomState;
  myPlayer: Player | undefined;
  onResetGame: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  roomState,
  myPlayer,
  onResetGame,
}) => {
  const allPlayers: Player[] = (Object.values(roomState.players) as Player[]).sort((a, b) => b.score - a.score);
  const champion = allPlayers[0];

  useEffect(() => {
    playCelebrationSound();
    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
      });
    } catch {
      // Ignore
    }

    if (champion) {
      speakEnglishPhrase(`Congratulations ${champion.name}! You are the classroom champion!`);
    }
  }, [champion]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-center space-y-8">
      {/* Trophy & Champion Card */}
      <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md p-8 sm:p-12 relative overflow-hidden">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-5xl mb-4 shadow-xl shadow-amber-500/20">
          🏆
        </div>

        <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-2">
          Game Completed!
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Classroom Champion
        </h1>

        {champion && (
          <div className="mt-6 p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 max-w-md mx-auto space-y-2">
            <div className="text-5xl">{champion.avatar}</div>
            <h2 className="text-2xl font-black text-white">
              {champion.name}
            </h2>
            <div className="text-3xl font-mono font-black text-amber-400">
              {champion.score} <span className="text-sm text-slate-300 font-sans">total points</span>
            </div>
            <p className="text-xs text-amber-200/80 font-bold">
              Fantastic English speaking and guessing practice!
            </p>
          </div>
        )}

        {/* Final Standings List */}
        <div className="mt-8 text-left max-w-lg mx-auto space-y-2">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-3">
            Final Standings
          </div>
          {allPlayers.slice(0, 5).map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/5 text-sm font-bold"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 w-5">#{idx + 1}</span>
                <span className="text-xl">{player.avatar}</span>
                <span className="text-white">{player.name}</span>
              </div>
              <span className="font-mono text-indigo-400 font-black">
                {player.score} pts
              </span>
            </div>
          ))}
        </div>

        {/* Reset / Play Again Button */}
        <div className="mt-8">
          <button
            onClick={onResetGame}
            id="play-again-btn"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play New Game / Reset Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};

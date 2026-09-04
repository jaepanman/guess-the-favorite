import React, { useState } from 'react';
import { Volume2, VolumeX, Users, Award, Crown, Copy, Check, Settings, Sparkles, RotateCcw } from 'lucide-react';
import { GameRoomState, Player } from '../types';
import { speakEnglishPhrase } from '../utils/soundEffects';

interface NavbarProps {
  roomState: GameRoomState | null;
  myPlayer: Player | undefined;
  onOpenSettings?: () => void;
  onResetGame?: () => void;
  isLiveConnected?: boolean;
  isLocalMode?: boolean;
  onOpenServerModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomState,
  myPlayer,
  onOpenSettings,
  onResetGame,
  isLiveConnected,
  isLocalMode,
  onOpenServerModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const presenter = roomState?.presenterId && roomState.players[roomState.presenterId]
    ? roomState.players[roomState.presenterId]
    : null;

  const handleCopyCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled) {
      speakEnglishPhrase('Voice enabled! What do you like?');
    }
  };

  return (
    <header className="h-20 bg-[#1E293B]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
        {/* Brand & Category Info */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
              Class Session
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">
              EFL CHALLENGE
            </span>
          </div>

          {roomState && (
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10 text-xs text-slate-400">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                ROUND {roomState.roundIndex + 1}/{roomState.categories.length}
              </span>
              <span className="text-slate-300 font-bold">
                {roomState.currentCategory.label}
              </span>
            </div>
          )}
        </div>

        {/* Middle: Join Code pill & Server Status */}
        <div className="flex items-center gap-2">
          {roomState && (
            <button
              onClick={handleCopyCode}
              id="copy-room-code-btn"
              title="Click to copy Room Code"
              className="flex items-center gap-2.5 bg-slate-900/60 hover:bg-slate-900 px-3.5 py-1.5 sm:py-2 rounded-lg border border-white/10 transition cursor-pointer"
            >
              <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase">CODE:</span>
              <span className="text-base sm:text-lg font-mono font-black text-indigo-300 tracking-wider">
                {roomState.code}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
              )}
            </button>
          )}

          {onOpenServerModal && (
            <button
              onClick={onOpenServerModal}
              id="server-status-pill-btn"
              title="Click to configure multiplayer server connection"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                isLiveConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : isLocalMode
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                isLiveConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : isLocalMode
                  ? 'bg-indigo-400'
                  : 'bg-amber-400 animate-ping'
              }`} />
              <span>{isLiveConnected ? 'Live Server' : isLocalMode ? 'In-Browser Host' : 'Connecting...'}</span>
            </button>
          )}
        </div>

        {/* Right Controls: Presenter / User Profile & Settings */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Host indicator */}
          {presenter && (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Current Host
                </p>
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px]">
                  {presenter.name}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white/20 shadow-lg shadow-indigo-500/20 text-lg">
                {presenter.avatar}
              </div>
            </div>
          )}

          {/* Audio Speech Toggle */}
          <button
            onClick={toggleSpeech}
            id="toggle-speech-btn"
            title={speechEnabled ? 'Mute EFL Speech Voice' : 'Enable EFL Speech Voice'}
            className={`p-2 sm:p-2.5 rounded-xl border text-sm transition cursor-pointer ${
              speechEnabled
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* My Player badge */}
          {myPlayer && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border border-white/20 bg-slate-800"
              >
                {myPlayer.avatar}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                  <span>{myPlayer.name}</span>
                  {myPlayer.isPresenter && <Crown className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="text-[11px] font-mono font-bold text-indigo-300">
                  {myPlayer.score} pts
                </div>
              </div>
            </div>
          )}

          {/* Quick Reset Game Button (active during game) */}
          {roomState && roomState.stage !== 'LOBBY' && onResetGame && (
            <button
              onClick={() => {
                if (window.confirm('End the current game immediately (without showing results) and return everyone to the main setup screen?')) {
                  onResetGame();
                }
              }}
              id="navbar-reset-game-btn"
              title="End current game without showing results and return everyone to the main setup screen"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reset Game</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}

          {/* Settings / Teacher drawer trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              id="open-settings-btn"
              title="Classroom & Game Controls"
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

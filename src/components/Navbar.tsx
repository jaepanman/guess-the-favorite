import React, { useState } from 'react';
import { Volume2, VolumeX, Users, Award, Crown, Copy, Check, Settings, Sparkles, RotateCcw, Shuffle, UserCheck, LogOut, QrCode } from 'lucide-react';
import { GameRoomState, Player } from '../types';
import { speakEnglishPhrase } from '../utils/soundEffects';

interface NavbarProps {
  roomState: GameRoomState | null;
  myPlayer: Player | undefined;
  routeMode?: 'teacher' | 'student';
  onOpenShareModal?: () => void;
  onOpenSettings?: () => void;
  onResetGame?: () => void;
  onLeaveRoom?: () => void;
  onTakeBackPresenter?: () => void;
  onPickRandomPresenter?: () => void;
  isLiveConnected?: boolean;
  isLocalMode?: boolean;
  onOpenServerModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomState,
  myPlayer,
  routeMode,
  onOpenShareModal,
  onOpenSettings,
  onResetGame,
  onLeaveRoom,
  onTakeBackPresenter,
  onPickRandomPresenter,
  isLiveConnected,
  isLocalMode,
  onOpenServerModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const presenter = roomState?.presenterId && roomState.players[roomState.presenterId]
    ? roomState.players[roomState.presenterId]
    : null;

  const isPresenter = Boolean(myPlayer && myPlayer.id === roomState?.presenterId);
  const isHost = Boolean(myPlayer?.isTeacher || (roomState?.hostId && myPlayer?.id === roomState.hostId));
  const canManageGame = isPresenter || isHost;
  const isStudentPresenter = Boolean(presenter && !presenter.isTeacher && presenter.id !== roomState?.hostId);

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
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">
              えいごのじゅぎょう • Class
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">
              EFL CHALLENGE <span className="text-xs font-bold text-slate-300 ml-1">すきなものあて</span>
            </span>
          </div>

          {roomState && (
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10 text-xs text-slate-400">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                第 {roomState.roundIndex + 1} 問 / 全 {roomState.categories.length} 問
              </span>
              <span className="text-slate-200 font-bold">
                {roomState.currentCategory.japaneseLabel ? `${roomState.currentCategory.label}（${roomState.currentCategory.japaneseLabel}）` : roomState.currentCategory.label}
              </span>
            </div>
          )}
        </div>

        {/* Middle: Join Code pill, QR share & Server Status */}
        <div className="flex items-center gap-2">
          {roomState && (
            <button
              onClick={handleCopyCode}
              id="copy-room-code-btn"
              title="クリックして部屋のコードをコピー"
              className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900 px-3 py-1.5 sm:py-2 rounded-lg border border-white/10 transition cursor-pointer"
            >
              <span className="text-[11px] font-black text-slate-400 tracking-wider">へや番号:</span>
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

          {/* Quick QR & Student URL Modal button (available to host or teacher view) */}
          {onOpenShareModal && (isHost || routeMode === 'teacher') && (
            <button
              onClick={onOpenShareModal}
              id="navbar-open-share-modal-btn"
              title="生徒用URL & QRコードを表示"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">生徒用URL・QR</span>
            </button>
          )}

          {onOpenServerModal && (
            <button
              onClick={onOpenServerModal}
              id="server-status-pill-btn"
              title="つうしん設定（マルチプレイヤー）"
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
              <span>{isLiveConnected ? '通信中' : isLocalMode ? '教室ホスト' : 'せつぞく中...'}</span>
            </button>
          )}
        </div>

        {/* Right Controls: Presenter / User Profile & Settings */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Host indicator */}
          {presenter && (
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/50 border border-white/10">
              <div className="text-right">
                <p className="text-[10px] text-amber-400 font-black tracking-wider flex items-center justify-end gap-1">
                  <span>今の発表者</span>
                  {isStudentPresenter && <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded">生徒</span>}
                </p>
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px]">
                  {presenter.name}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center border border-white/20 shadow-sm text-base">
                {presenter.avatar}
              </div>
            </div>
          )}

          {/* Teacher Take-back & Quick Random controls (Visible to Teacher/Host when another student is presenting) */}
          {isHost && roomState && roomState.presenterId !== myPlayer?.id && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 p-1 rounded-2xl">
              {onTakeBackPresenter && (
                <button
                  onClick={onTakeBackPresenter}
                  id="navbar-take-back-presenter-btn"
                  title="自分が発表者にもどる (Take back presenter)"
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1"
                >
                  <Crown className="w-3 h-3 text-slate-950" />
                  <span className="hidden sm:inline">発表者に復帰</span>
                  <span className="sm:hidden">復帰</span>
                </button>
              )}
              {onPickRandomPresenter && (
                <button
                  onClick={onPickRandomPresenter}
                  id="navbar-pick-random-presenter-btn"
                  title="別の生徒をランダムで指名 (Pick another random student)"
                  className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-white/10"
                >
                  <Shuffle className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">交代</span>
                </button>
              )}
            </div>
          )}

          {/* Audio Speech Toggle */}
          <button
            onClick={toggleSpeech}
            id="toggle-speech-btn"
            title={speechEnabled ? '音声よみあげ: ON' : '音声よみあげ: OFF'}
            className={`p-2 sm:p-2.5 rounded-xl border text-sm transition cursor-pointer ${
              speechEnabled
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* My Player badge with explicit role pill */}
          {myPlayer && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div 
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${
                  isHost 
                    ? 'border-amber-400 bg-amber-500/20 shadow-xs shadow-amber-500/20' 
                    : 'border-white/20 bg-slate-800'
                }`}
              >
                {myPlayer.avatar}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                  <span className="truncate max-w-[90px]">{myPlayer.name}</span>
                  {isHost ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/25 border border-amber-500/40 text-amber-300 font-black">
                      👑 先生・ホスト
                    </span>
                  ) : isPresenter ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 font-bold">
                      🌟 発表者
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 border border-white/10 text-slate-400 font-medium">
                      🎓 生徒
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono font-bold text-indigo-300">
                  {myPlayer.score} 点
                </div>
              </div>
            </div>
          )}

          {/* Quick Reset Game Button (active during game - presenter & host only) */}
          {roomState && roomState.stage !== 'LOBBY' && onResetGame && canManageGame && (
            <button
              onClick={() => {
                if (window.confirm('今のゲームをやめて、さいしょの画面（ロビー）にもどりますか？（結果は保存されません）')) {
                  onResetGame();
                }
              }}
              id="navbar-reset-game-btn"
              title="ゲームをリセットして最初にもどる"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">リセット</span>
            </button>
          )}

          {/* Settings / Teacher drawer trigger (presenter & host only) */}
          {onOpenSettings && canManageGame && (
            <button
              onClick={onOpenSettings}
              id="open-settings-btn"
              title="ゲーム・教室の設定 (Settings)"
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer ${
                isHost 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25' 
                  : 'bg-slate-800/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Return to Main Menu / Close Room Button */}
          {myPlayer && onLeaveRoom && (
            <button
              onClick={() => {
                if (isHost) {
                  if (window.confirm('メイン画面に戻りますか？\n先生がメイン画面に戻ると、この部屋（ロビー）は終了・解散され、生徒もメイン画面に戻ります。')) {
                    onLeaveRoom();
                  }
                } else {
                  if (window.confirm('メイン画面に戻りますか？（部屋から退出します）')) {
                    onLeaveRoom();
                  }
                }
              }}
              id="navbar-leave-room-btn"
              title={isHost ? 'メイン画面へ戻る（部屋を閉じる）' : 'メイン画面へ戻る（退出）'}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isHost
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300 hover:text-rose-100'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">{isHost ? '部屋を閉じる' : '退出'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

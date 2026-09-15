import React, { useState, useEffect } from 'react';
import {
  Crown,
  Shuffle,
  Play,
  Plus,
  Trash2,
  Users,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  LogOut,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Clock,
  Settings,
} from 'lucide-react';
import { GameRoomState, Player } from '../types';
import { AVAILABLE_AVATARS, AVAILABLE_COLORS } from '../gameData';
import { playSelectSound } from '../utils/soundEffects';
import { getStudentUrl, RouteMode } from '../utils/routeUtils';

interface LobbyViewProps {
  roomState: GameRoomState | null;
  myPlayer: Player | undefined;
  routeMode: RouteMode;
  onSwitchRouteMode: (mode: RouteMode) => void;
  onOpenShareModal: () => void;
  onJoin: (roomCode: string, name: string, avatar: string, favoriteColor: string, isTeacher: boolean) => void;
  onLeaveRoom?: () => void;
  onStartGame: () => void;
  onSetPresenter: (playerId: string) => void;
  onTakeBackPresenter?: () => void;
  onPickRandomPresenter: () => void;
  onUpdateSettings: (settings: any) => void;
  onAddBots: (count: number) => void;
  onRemoveBots: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  myPlayer,
  routeMode,
  onSwitchRouteMode,
  onOpenShareModal,
  onJoin,
  onLeaveRoom,
  onStartGame,
  onSetPresenter,
  onTakeBackPresenter,
  onPickRandomPresenter,
  onUpdateSettings,
  onAddBots,
  onRemoveBots,
}) => {
  // Join form state
  const isTeacherView = routeMode === 'teacher';

  const [name, setName] = useState(() => {
    const savedName = localStorage.getItem(isTeacherView ? 'efl_teacher_name' : 'efl_name');
    if (savedName) return savedName;
    return isTeacherView ? '先生 (Teacher)' : '';
  });

  const [roomCodeInput, setRoomCodeInput] = useState(roomState?.code || 'EFL1');
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    const saved = localStorage.getItem(isTeacherView ? 'efl_teacher_avatar' : 'efl_avatar');
    if (saved) return saved;
    return isTeacherView ? '👩‍🏫' : AVAILABLE_AVATARS[0].emoji;
  });

  const [selectedColor, setSelectedColor] = useState(() => {
    const saved = localStorage.getItem(isTeacherView ? 'efl_teacher_color' : 'efl_color');
    if (saved) return saved;
    return isTeacherView ? 'gold' : AVAILABLE_COLORS[1].id;
  });

  // Teacher PIN Protection state (to prevent accidental/curious students visiting /#/teacher)
  const [teacherPin, setTeacherPin] = useState(() => localStorage.getItem('efl_teacher_pin') || '');
  const [pinInput, setPinInput] = useState('');
  const [isPinUnlocked, setIsPinUnlocked] = useState(() => {
    // If no PIN is configured, unlocked by default. If PIN exists, check session.
    const savedPin = localStorage.getItem('efl_teacher_pin');
    if (!savedPin) return true;
    return sessionStorage.getItem('efl_teacher_unlocked') === 'true';
  });
  const [pinError, setPinError] = useState(false);
  const [copiedStudentUrl, setCopiedStudentUrl] = useState(false);

  // Quick pre-game settings for teacher setup
  const [preGameSettings, setPreGameSettings] = useState({
    guessTimeLimit: roomState?.settings?.guessTimeLimit ?? 20,
    teacherEarnsPoints: roomState?.settings?.teacherEarnsPoints ?? false,
    autoRotatePresenter: roomState?.settings?.autoRotatePresenter ?? true,
    bonusPointsForPresenter: roomState?.settings?.bonusPointsForPresenter ?? true,
  });

  const studentUrl = getStudentUrl();
  const playersList: Player[] = roomState ? (Object.values(roomState.players) as Player[]) : [];
  const activeHost = roomState?.hostId && roomState.players[roomState.hostId] ? roomState.players[roomState.hostId] : undefined;
  const existingTeacher = playersList.find(p => p.isTeacher || p.role === 'teacher' || (roomState?.hostId && p.id === roomState.hostId)) || activeHost;
  const hasActiveRoom = Boolean(existingTeacher);

  // When switching routeMode, sync defaults
  useEffect(() => {
    if (isTeacherView) {
      if (!name || name === '') {
        setName('先生 (Teacher)');
      }
      setSelectedAvatar('👩‍🏫');
      setSelectedColor('gold');
    } else {
      const savedStudent = localStorage.getItem('efl_name') || '';
      setName(savedStudent);
      const savedAv = localStorage.getItem('efl_avatar') || AVAILABLE_AVATARS[0].emoji;
      setSelectedAvatar(savedAv);
      const savedCol = localStorage.getItem('efl_color') || AVAILABLE_COLORS[1].id;
      setSelectedColor(savedCol);
    }
  }, [isTeacherView]);

  const handleCopyStudentUrl = async () => {
    try {
      await navigator.clipboard.writeText(studentUrl);
      setCopiedStudentUrl(true);
      setTimeout(() => setCopiedStudentUrl(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = studentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedStudentUrl(true);
      setTimeout(() => setCopiedStudentUrl(false), 2500);
    }
  };

  const handlePinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === teacherPin) {
      setIsPinUnlocked(true);
      sessionStorage.setItem('efl_teacher_unlocked', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!isTeacherView) {
      // Student join validation: require active room
      if (!hasActiveRoom) {
        alert('先生がまだ部屋を開いていません。\n先生が部屋を開くまでお待ちください。');
        return;
      }
    }

    playSelectSound();

    if (isTeacherView) {
      localStorage.setItem('efl_teacher_name', name.trim());
      localStorage.setItem('efl_teacher_avatar', selectedAvatar);
      localStorage.setItem('efl_teacher_color', selectedColor);

      // Apply initial classroom settings chosen by the teacher
      onUpdateSettings(preGameSettings);

      // Teacher is guaranteed host role
      onJoin(roomCodeInput.trim() || 'EFL1', name.trim(), selectedAvatar, selectedColor, true);
    } else {
      localStorage.setItem('efl_name', name.trim());
      localStorage.setItem('efl_avatar', selectedAvatar);
      localStorage.setItem('efl_color', selectedColor);

      // Student is guaranteed non-host student role
      onJoin(roomCodeInput.trim() || 'EFL1', name.trim(), selectedAvatar, selectedColor, false);
    }
  };

  const currentPresenter = roomState?.presenterId && roomState.players[roomState.presenterId]
    ? roomState.players[roomState.presenterId]
    : null;
  const isPresenter = Boolean(myPlayer && myPlayer.id === roomState?.presenterId);
  const isHost = Boolean(myPlayer?.isTeacher || (roomState?.hostId && myPlayer?.id === roomState.hostId));
  const canManageLobby = isPresenter || isHost;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* If current client is not yet in the room, show Join / Setup card */}
      {!myPlayer ? (
        <div className="space-y-6">
          {/* TEACHER PIN LOCK CHECK (if enabled) */}
          {isTeacherView && teacherPin && !isPinUnlocked ? (
            <div className="bg-slate-900/80 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md p-6 sm:p-10 max-w-md mx-auto text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  先生専用パスコード
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  先生用設定画面を開くための4桁のパスコードを入力してください。
                </p>
              </div>

              <form onSubmit={handlePinUnlock} className="space-y-4">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="パスコード"
                  className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 bg-slate-800 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-amber-500"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 font-bold">
                    パスコードが違います。もう一度お試しください。
                  </p>
                )}
                <button
                  type="submit"
                  id="unlock-teacher-pin-btn"
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm transition cursor-pointer"
                >
                  ロックを解除して入る 🔓
                </button>
              </form>

              <button
                type="button"
                onClick={() => onSwitchRouteMode('student')}
                className="text-xs text-slate-400 hover:text-slate-300 underline cursor-pointer"
              >
                生徒用画面（/#/student）にもどる
              </button>
            </div>
          ) : isTeacherView ? (
            /* ============================================================ */
            /* TEACHER SETUP PORTAL                                         */
            /* ============================================================ */
            <div className="bg-slate-900/80 rounded-3xl border border-amber-500/30 shadow-2xl backdrop-blur-md p-6 sm:p-10 space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-300 shrink-0">
                    👩‍🏫
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Teacher Console
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Room: {roomCodeInput}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                      先生専用セットアップ画面
                    </h1>
                  </div>
                </div>

                <button
                  type="button"
                  id="switch-to-student-preview-btn"
                  onClick={() => onSwitchRouteMode('student')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
                >
                  <span>生徒画面に切り替え</span>
                </button>
              </div>

              {/* CARD 1: Student URL & QR Code Distribution */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                      <QrCode className="w-4 h-4" />
                    </span>
                    <h2 className="text-sm font-black text-white">
                      生徒用URL &amp; QRコードの配布
                    </h2>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    生徒の先生乗っ取り防止済み
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  生徒にはこのURLまたはQRコードを配ってください。生徒用画面には先生ボタンが一切表示されず、先生が部屋を開くまで安全に待機します。
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={studentUrl}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs font-mono text-slate-300 select-all focus:outline-none"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id="teacher-copy-student-url-btn"
                      onClick={handleCopyStudentUrl}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        copiedStudentUrl
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                      }`}
                    >
                      {copiedStudentUrl ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>コピー完了!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>URLをコピー</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="teacher-open-qr-modal-btn"
                      onClick={onOpenShareModal}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black border border-white/15 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-indigo-400" />
                      <span>QRコード表示</span>
                    </button>

                    <a
                      href={studentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/15 flex items-center justify-center transition"
                      title="別タブで生徒画面をテスト"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-400" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleJoinSubmit} className="space-y-6">
                {/* Room Code & Teacher Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="room-code-input"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      へやの番号（ルームコード）
                    </label>
                    <input
                      id="room-code-input"
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="EFL1"
                      maxLength={8}
                      className="w-full px-4 py-2.5 text-center text-lg font-mono font-black tracking-widest bg-slate-800/80 border border-white/10 text-white rounded-2xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="teacher-name-input"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      先生のお名前
                    </label>
                    <input
                      id="teacher-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="先生 (Teacher)"
                      required
                      maxLength={20}
                      className="w-full px-4 py-2.5 text-base font-bold text-white bg-slate-800/80 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    先生のアイコン
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                    {AVAILABLE_AVATARS.map((av) => {
                      const isSelected = selectedAvatar === av.emoji;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          id={`teacher-avatar-${av.id}`}
                          onClick={() => {
                            playSelectSound();
                            setSelectedAvatar(av.emoji);
                          }}
                          className={`p-2 rounded-xl text-xl flex items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-2 border-amber-500 scale-105 shadow-md text-white'
                              : 'bg-slate-800/60 hover:bg-slate-800 border border-white/10'
                          }`}
                        >
                          {av.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Rules & Settings Panel */}
                <div className="p-4.5 rounded-2xl bg-slate-800/50 border border-white/10 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Settings className="w-4 h-4" />
                    <span>授業ルール・ゲーム初期設定</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Time limit */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-300 font-bold">⏱️ 回答制限時間:</span>
                      <select
                        value={preGameSettings.guessTimeLimit}
                        onChange={(e) =>
                          setPreGameSettings({
                            ...preGameSettings,
                            guessTimeLimit: Number(e.target.value),
                          })
                        }
                        className="bg-slate-800 text-white font-bold px-2 py-1 rounded-lg border border-white/10 focus:outline-none"
                      >
                        <option value={15}>15秒（短め）</option>
                        <option value={20}>20秒（標準）</option>
                        <option value={25}>25秒（ゆっくり）</option>
                        <option value={30}>30秒（長め）</option>
                      </select>
                    </div>

                    {/* Teacher points toggle */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-300 font-bold">🏆 先生の得点・順位:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreGameSettings({
                            ...preGameSettings,
                            teacherEarnsPoints: !preGameSettings.teacherEarnsPoints,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                          preGameSettings.teacherEarnsPoints
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {preGameSettings.teacherEarnsPoints ? 'ON（先生も得点）' : 'OFF（生徒のみ順位）'}
                      </button>
                    </div>

                    {/* Auto rotate */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-300 font-bold">🔄 発表者の自動交代:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreGameSettings({
                            ...preGameSettings,
                            autoRotatePresenter: !preGameSettings.autoRotatePresenter,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                          preGameSettings.autoRotatePresenter
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-700 text-slate-400 border border-white/10'
                        }`}
                      >
                        {preGameSettings.autoRotatePresenter ? 'ON（自動で交代）' : 'OFF（先生が指名）'}
                      </button>
                    </div>

                    {/* Bonus points */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                      <span className="text-slate-300 font-bold">🌟 発表者ボーナス:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPreGameSettings({
                            ...preGameSettings,
                            bonusPointsForPresenter: !preGameSettings.bonusPointsForPresenter,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                          preGameSettings.bonusPointsForPresenter
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-700 text-slate-400 border border-white/10'
                        }`}
                      >
                        {preGameSettings.bonusPointsForPresenter ? 'ON (+50点)' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Teacher PIN protection setup */}
                <div className="p-4 rounded-2xl bg-slate-800/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold">先生画面のパスコード保護: </span>
                      <span className="text-slate-400">
                        {teacherPin ? `設定中（${teacherPin}）` : '未設定（パスコード不要）'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newPin = window.prompt(
                          '先生専用画面の4桁パスコードを設定してください（空欄にすると解除されます）:',
                          teacherPin || '1234'
                        );
                        if (newPin !== null) {
                          const clean = newPin.trim();
                          setTeacherPin(clean);
                          localStorage.setItem('efl_teacher_pin', clean);
                          if (!clean) {
                            sessionStorage.removeItem('efl_teacher_unlocked');
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold transition cursor-pointer"
                    >
                      {teacherPin ? 'パスコード変更 / 解除' : 'パスコードを設定'}
                    </button>
                  </div>
                </div>

                {/* Open Room Button */}
                <button
                  type="submit"
                  id="open-teacher-room-btn"
                  disabled={!name.trim()}
                  className="w-full py-4 px-6 rounded-2xl font-black text-base tracking-wide shadow-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>先生として部屋を開く（生徒の参加受付を開始）🚀</span>
                </button>
              </form>
            </div>
          ) : (
            /* ============================================================ */
            /* STUDENT JOIN SCREEN (No teacher options!)                   */
            /* ============================================================ */
            <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md p-6 sm:p-10">
              <div className="text-center max-w-lg mx-auto mb-8">
                <span className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-3xl mb-3 shadow-sm">
                  🎒
                </span>
                <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.15em] mb-1">
                  えいごのゲーム • Student Screen
                </p>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  すきなものあてクイズへようこそ！
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mt-2">
                  英語でたのしく話そう！ 友だちのすきなスポーツや くだもの、どうぶつを 当てるゲームだよ。
                </p>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-6 max-w-md mx-auto">
                {/* Room Code */}
                <div>
                  <label
                    htmlFor="student-room-code-input"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    へやの番号（ルームコード）
                  </label>
                  <input
                    id="student-room-code-input"
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="EFL1"
                    maxLength={8}
                    className="w-full px-4 py-3 text-center text-xl font-mono font-black tracking-widest bg-slate-800/80 border border-white/10 text-white rounded-2xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="student-name-input"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    あなたの名前（ニックネーム）
                  </label>
                  <input
                    id="student-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: けんじ, さくら, Leo..."
                    required
                    maxLength={20}
                    className="w-full px-4 py-3 text-base font-semibold text-white bg-slate-800/80 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>

                {/* Avatar Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    アイコンを えらんでね
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_AVATARS.map((av) => {
                      const isSelected = selectedAvatar === av.emoji;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          id={`avatar-choice-${av.id}`}
                          onClick={() => {
                            playSelectSound();
                            setSelectedAvatar(av.emoji);
                          }}
                          className={`p-2.5 rounded-xl text-2xl flex items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-500/20 border-2 border-indigo-500 scale-105 shadow-md shadow-indigo-500/20 text-white'
                              : 'bg-slate-800/60 hover:bg-slate-800 border border-white/10'
                          }`}
                          title={`${av.japaneseLabel} (${av.label})`}
                        >
                          {av.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Favorite Color Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    すきな色を えらんでね
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_COLORS.map((col) => {
                      const isSelected = selectedColor === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          id={`color-choice-${col.id}`}
                          onClick={() => {
                            playSelectSound();
                            setSelectedColor(col.id);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500 text-white'
                              : 'border-white/10 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="truncate">
                            {col.japaneseName ? col.japaneseName.split(' ')[0] : col.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Student Role Locked Pill */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <div className="text-xs font-black text-indigo-300">
                      役割: 生徒（あてる人）
                    </div>
                    <div className="text-[11px] text-slate-400">
                      英語を聞いて、友だちのすきなものを当てよう！
                    </div>
                  </div>
                </div>

                {/* Status Indicator & Submit Join */}
                {!hasActiveRoom ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-center space-y-1">
                      <div className="font-black text-sm flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>先生が部屋を開くのをお待ちください</span>
                      </div>
                      <p className="text-xs text-amber-300/80">
                        先生がまだ部屋を開いていません。ニックネームとアイコンを選んで、そのままお待ちください。先生が部屋を開くとすぐに入れるようになります！
                      </p>
                    </div>

                    <button
                      type="button"
                      id="student-waiting-btn"
                      disabled
                      className="w-full py-4 px-6 rounded-2xl bg-slate-800 border border-white/10 text-slate-400 font-bold text-sm text-center cursor-not-allowed opacity-75"
                    >
                      ⏳ 先生が部屋を開くのをお待ちください…
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <span className="text-lg">🟢</span>
                      <div>
                        <span className="font-black">先生が部屋を開いています！</span>
                        <span className="text-slate-300 ml-1">
                          （{existingTeacher?.avatar} {existingTeacher?.name} 先生）
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="student-join-room-btn"
                      disabled={!name.trim()}
                      className="w-full py-4 px-6 rounded-2xl font-black text-base tracking-wide shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
                    >
                      ゲームの部屋に入る！ 🚀
                    </button>
                  </div>
                )}
              </form>

              {/* Discreet Teacher Link at Bottom */}
              <div className="mt-8 pt-4 border-t border-white/10 text-center">
                <button
                  type="button"
                  id="go-to-teacher-portal-link"
                  onClick={() => onSwitchRouteMode('teacher')}
                  className="text-xs text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                >
                  👩‍🏫 先生の方はこちら（先生専用セットアップ画面 /#/teacher）
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* INSIDE ROOM LOBBY                                            */
        /* ============================================================ */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900/60 rounded-3xl border border-white/10 backdrop-blur-md p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black uppercase tracking-wider">
                    待機中（たいきちゅう） &bull; ロビー
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    へや番号: <strong className="text-indigo-400 text-sm font-black">{roomState?.code}</strong>
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  英語で話すじゅんびをしよう！
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  発表する人をきめて、みんなが集まったらスタートボタンを押してね！
                </p>
              </div>

              {/* Start Game Button (Teacher or Presenter) & Leave/Close */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {onLeaveRoom && (
                  <button
                    onClick={() => {
                      if (isHost) {
                        if (window.confirm('メイン画面に戻りますか？\n先生がメイン画面に戻ると、この部屋（ロビー）は終了・解散され、生徒もメイン画面に戻ります。')) {
                          onLeaveRoom();
                        }
                      } else {
                        if (window.confirm('部屋から退出してメイン画面に戻りますか？')) {
                          onLeaveRoom();
                        }
                      }
                    }}
                    id="leave-room-btn"
                    title={isHost ? 'メイン画面へ戻る（部屋を閉じる）' : 'メイン画面へ戻る（退出）'}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                      isHost
                        ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-100 border-rose-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isHost ? 'メイン画面へ (部屋を閉じる)' : 'メイン画面へ (退出)'}</span>
                  </button>
                )}
                {canManageLobby ? (
                  <button
                    onClick={onStartGame}
                    id="start-game-btn"
                    disabled={playersList.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base tracking-wide shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    ラウンド1をはじめる ({roomState?.currentCategory.japaneseLabel || roomState?.currentCategory.label})
                  </button>
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-800/80 border border-white/10 text-slate-300 text-xs sm:text-sm font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                    <span>{currentPresenter?.name || '発表する人'}がゲームをはじめるのを まってね… ⏳</span>
                  </div>
                )}
              </div>
            </div>

            {/* Teacher Master Status Banner */}
            {isHost && (
              <div className="mt-6 p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-600/10 border-2 border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                    👑
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>先生・ホスト権限が有効です</span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded font-bold">Room Host</span>
                    </div>
                    <div className="text-xs text-slate-200 mt-0.5">
                      生徒を発表者に指名しても、先生の権限は保持されます。いつでも「発表者に復帰」や「別の生徒を指名」が可能です。
                    </div>
                    {/* Quick Toggle for Teacher Points */}
                    <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-amber-200">
                        🏆 先生の得点・順位表:
                      </span>
                      <button
                        type="button"
                        id="lobby-toggle-teacher-points-btn"
                        onClick={() => onUpdateSettings({ teacherEarnsPoints: !roomState?.settings.teacherEarnsPoints })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer border ${
                          roomState?.settings.teacherEarnsPoints
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/35'
                            : 'bg-amber-500/25 border-amber-500/50 text-amber-200 hover:bg-amber-500/35'
                        }`}
                      >
                        {roomState?.settings.teacherEarnsPoints ? 'ON（得点あり）' : 'OFF（先生は得点なし・生徒のみ順位）'}
                      </button>
                      <span className="text-[11px] text-slate-300">
                        {roomState?.settings.teacherEarnsPoints
                          ? '※ 先生も得点し順位表に載ります'
                          : '※ 先生が全問発表しても0点のまま順位表から除外されます'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onOpenShareModal}
                    id="lobby-open-share-modal-btn"
                    title="生徒用URL & QRコードを表示"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition cursor-pointer shrink-0 shadow-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>📱 生徒用URL &amp; QRコード</span>
                  </button>

                  {roomState?.presenterId !== myPlayer?.id && (
                    <button
                      onClick={() => (onTakeBackPresenter ? onTakeBackPresenter() : onSetPresenter(myPlayer.id))}
                      id="lobby-take-back-presenter-btn"
                      title="先生自身を発表者にもどします"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition cursor-pointer shrink-0 shadow-sm"
                    >
                      <Crown className="w-4 h-4 text-slate-950" />
                      <span>👑 先生が発表者になる</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Current Presenter Spotlight */}
            <div className="mt-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
                  <Crown className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <span>今回の発表者（メインの友だち）</span>
                    {currentPresenter && !currentPresenter.isTeacher && currentPresenter.id !== roomState?.hostId && (
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 rounded font-bold">生徒発表</span>
                    )}
                  </div>
                  <div className="text-lg font-black text-white flex items-center gap-2">
                    <span>{currentPresenter?.avatar} {currentPresenter?.name || 'まだ決まっていません'}</span>
                    {currentPresenter?.id === myPlayer.id && (
                      <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        あなたです！👑
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    発表者はヒントとなるすきなものを決める人です。
                  </p>
                </div>
              </div>

              {canManageLobby && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playSelectSound();
                      onPickRandomPresenter();
                    }}
                    id="lobby-pick-random-presenter-btn"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4 text-slate-950" />
                    ランダムに発表者を決める 🎲
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Players List Grid */}
          <div className="bg-slate-900/60 rounded-3xl border border-white/10 backdrop-blur-md p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white">
                  参加している生徒 ({playersList.length} 人)
                </h3>
              </div>

              {/* Bot management for testing / classroom demo */}
              {canManageLobby && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold hidden sm:inline">テスト用生徒:</span>
                  <button
                    onClick={() => onAddBots(1)}
                    id="add-one-bot-btn"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-white/10 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> +1人
                  </button>
                  <button
                    onClick={() => onAddBots(3)}
                    id="add-three-bots-btn"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-white/10 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> +3人
                  </button>
                  {playersList.some(p => p.isBot) && (
                    <button
                      onClick={onRemoveBots}
                      id="remove-bots-btn"
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs text-rose-300 border border-rose-500/30 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ボット削除
                    </button>
                  )}
                </div>
              )}
            </div>

            {playersList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                まだ誰も参加していません。生徒用URLまたはQRコードを配ってください！
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {playersList.map((player) => {
                  const isCurrentPresenter = player.id === roomState?.presenterId;
                  const isPlayerHost = Boolean(player.isTeacher || player.role === 'teacher' || (roomState?.hostId && player.id === roomState.hostId));
                  const isMe = player.id === myPlayer.id;

                  return (
                    <div
                      key={player.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                        isCurrentPresenter
                          ? 'border-amber-500/50 bg-amber-500/10 shadow-sm'
                          : isPlayerHost
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-white/10 bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xl shrink-0">
                          {player.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {isMe && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-normal">
                                あなた
                              </span>
                            )}
                            {isPlayerHost && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black">
                                👑 先生
                              </span>
                            )}
                            {player.isBot && (
                              <span className="text-[9px] bg-slate-700 text-slate-300 px-1 py-0.5 rounded">
                                BOT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {player.connected ? '🟢 接続中' : '⚪ 切断'}
                          </div>
                        </div>
                      </div>

                      {/* Presenter Action or Badge */}
                      <div className="shrink-0 pl-2">
                        {isCurrentPresenter ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                            <Crown className="w-3 h-3 text-amber-400" />
                            発表者
                          </span>
                        ) : canManageLobby ? (
                          <button
                            onClick={() => onSetPresenter(player.id)}
                            id={`make-presenter-${player.id}`}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                              player.id === myPlayer.id && isHost
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                : 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800'
                            }`}
                          >
                            {player.id === myPlayer.id && isHost ? '自分が発表者になる' : '発表者に指名'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Crown, Shuffle, Play, Plus, Trash2, Users, Sparkles, CheckCircle2, ShieldAlert, LogOut } from 'lucide-react';
import { GameRoomState, Player } from '../types';
import { AVAILABLE_AVATARS, AVAILABLE_COLORS } from '../gameData';
import { playSelectSound } from '../utils/soundEffects';

interface LobbyViewProps {
  roomState: GameRoomState | null;
  myPlayer: Player | undefined;
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
  const [name, setName] = useState(() => localStorage.getItem('efl_name') || '');
  const [roomCodeInput, setRoomCodeInput] = useState(roomState?.code || 'EFL1');
  const [selectedAvatar, setSelectedAvatar] = useState(
    () => localStorage.getItem('efl_avatar') || AVAILABLE_AVATARS[0].emoji
  );
  const [selectedColor, setSelectedColor] = useState(
    () => localStorage.getItem('efl_color') || AVAILABLE_COLORS[1].id
  );
  const [isTeacherRole, setIsTeacherRole] = useState(false);

  const playersList: Player[] = roomState ? (Object.values(roomState.players) as Player[]) : [];
  const existingTeacher = playersList.find(p => p.isTeacher || (roomState?.hostId && p.id === roomState.hostId));

  // If a teacher already exists in the room, automatically switch any selection to student
  React.useEffect(() => {
    if (existingTeacher && isTeacherRole) {
      setIsTeacherRole(false);
    }
  }, [existingTeacher, isTeacherRole]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    playSelectSound();
    localStorage.setItem('efl_name', name.trim());
    localStorage.setItem('efl_avatar', selectedAvatar);
    localStorage.setItem('efl_color', selectedColor);

    // Once one teacher joins, any other user automatically joins as student
    const finalIsTeacher = existingTeacher ? false : isTeacherRole;
    onJoin(roomCodeInput.trim() || 'EFL1', name.trim(), selectedAvatar, selectedColor, finalIsTeacher);
  };

  const currentPresenter = roomState?.presenterId && roomState.players[roomState.presenterId]
    ? roomState.players[roomState.presenterId]
    : null;
  const isPresenter = Boolean(myPlayer && myPlayer.id === roomState?.presenterId);
  const isHost = Boolean(myPlayer?.isTeacher || (roomState?.hostId && myPlayer?.id === roomState.hostId));
  const canManageLobby = isPresenter || isHost;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* If current client is not yet in the room, show Join card */}
      {!myPlayer ? (
        <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md p-6 sm:p-10">
          <div className="text-center max-w-lg mx-auto mb-8">
            <span className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-3xl mb-3 shadow-sm">
              🎉
            </span>
            <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.15em] mb-1">
              えいごのゲーム • Classroom Multiplayer
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
              <label htmlFor="room-code-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                へやの番号（ルームコード）
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="EFL1"
                maxLength={8}
                className="w-full px-4 py-3 text-center text-xl font-mono font-black tracking-widest bg-slate-800/80 border border-white/10 text-white rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              <p className="text-[11px] text-slate-400 text-center mt-1">
                黒板や 先生の画面に出ているコードを入れてね（半角英数字）
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="student-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                className="w-full px-4 py-3 text-base font-semibold text-white bg-slate-800/80 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-500"
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
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: col.hex }} />
                      <span className="truncate">{col.japaneseName ? col.japaneseName.split(' ')[0] : col.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Selection */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              {existingTeacher ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-start sm:items-center gap-2.5">
                  <span className="text-xl">👩‍🏫</span>
                  <div className="space-y-0.5">
                    <div className="font-bold">
                      先生はすでに参加しています（{existingTeacher.avatar} {existingTeacher.name} 先生）
                    </div>
                    <div className="text-[11px] text-amber-300/80">
                      先生（ホスト）がすでにいるため、あなたの役割は「🎓 生徒」になります。
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-bold">
                    ゲームでの役割（やくわり）:
                  </span>
                  <button
                    type="button"
                    id="toggle-teacher-role-btn"
                    onClick={() => setIsTeacherRole(!isTeacherRole)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    {isTeacherRole ? '生徒にする' : '発表者・先生にする'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  id="role-student-btn"
                  onClick={() => setIsTeacherRole(false)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    !isTeacherRole || Boolean(existingTeacher)
                      ? 'border-indigo-500 bg-indigo-500/20 ring-1 ring-indigo-500 text-white'
                      : 'border-white/10 bg-slate-800/40 hover:bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="text-sm font-black flex items-center gap-1.5 text-slate-100">
                    <span className="text-lg">🎓</span>
                    <span>生徒（あてる人）</span>
                    {existingTeacher && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                        自動選択
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                    英語を聞いて、友だちのすきなものを当てよう！
                  </div>
                </button>

                <button
                  type="button"
                  id="role-teacher-btn"
                  onClick={() => {
                    if (existingTeacher) {
                      setIsTeacherRole(false);
                    } else {
                      setIsTeacherRole(true);
                    }
                  }}
                  disabled={Boolean(existingTeacher)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    existingTeacher
                      ? 'border-white/5 bg-slate-800/20 text-slate-500 opacity-60 cursor-not-allowed'
                      : isTeacherRole
                      ? 'border-amber-500 bg-amber-500/20 ring-1 ring-amber-500 text-white cursor-pointer'
                      : 'border-white/10 bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 cursor-pointer'
                  }`}
                >
                  <div className="text-sm font-black flex items-center gap-1.5 text-amber-300">
                    <span className="text-lg">👑</span>
                    <span>発表者・先生</span>
                    {existingTeacher && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-normal">
                        参加中
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                    {existingTeacher
                      ? `${existingTeacher.name}先生が参加しているため選べません。`
                      : 'すきなものをえらんだり、ゲームをスタートする人だよ。'}
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Join */}
            <button
              type="submit"
              id="join-game-submit-btn"
              disabled={!name.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base tracking-wide shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              ゲームの部屋に入る！ 🚀
            </button>
          </form>
        </div>
      ) : (
        /* Inside Room Lobby */
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

              {/* Start Game Button (Teacher or Presenter) & Leave/Change Profile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {onLeaveRoom && (
                  <button
                    onClick={onLeaveRoom}
                    id="leave-room-btn"
                    title="名前やアイコンを変える"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>名前・アイコン変更</span>
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
              <div className="mt-6 p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-600/10 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
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
                  </div>
                </div>
                {roomState?.presenterId !== myPlayer?.id && (
                  <button
                    onClick={() => onTakeBackPresenter ? onTakeBackPresenter() : onSetPresenter(myPlayer.id)}
                    id="lobby-take-back-presenter-btn"
                    title="先生自身を発表者にもどします"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition cursor-pointer shrink-0 shadow-sm"
                  >
                    <Crown className="w-4 h-4 text-slate-950" />
                    👑 先生が発表者になる（復帰）
                  </button>
                )}
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
                    この人がすきな {roomState?.currentCategory.japaneseLabel || roomState?.currentCategory.label} を1つえらびます。みんなで当てよう！
                  </p>
                </div>
              </div>

              {/* Teacher switch / random presenter controls (Presenter / Teacher only) */}
              {canManageLobby && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isHost && roomState?.presenterId !== myPlayer?.id && (
                    <button
                      onClick={() => onTakeBackPresenter ? onTakeBackPresenter() : onSetPresenter(myPlayer.id)}
                      id="spotlight-take-back-btn"
                      title="先生が発表者に復帰"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      自分が発表者になる
                    </button>
                  )}
                  <button
                    onClick={onPickRandomPresenter}
                    id="random-presenter-btn"
                    title="ランダムで生徒を発表者にえらぶ"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    ランダムで決める 🎲
                  </button>
                </div>
              )}
            </div>

            {/* Teacher Host Settings Toggles (Presenter / Teacher only) */}
            {canManageLobby && (
              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Auto-rotate presenter toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/10">
                  <div>
                    <div className="text-xs font-bold text-white">
                      発表者を自動で交代する (Auto-Rotate)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      毎ラウンド 新しい生徒がランダムで発表者になります
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="auto-rotate-presenter-toggle"
                    checked={roomState?.settings.autoRandomPresenter ?? false}
                    onChange={(e) => onUpdateSettings({ autoRandomPresenter: e.target.checked })}
                    className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>

                {/* Host compensation toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/10">
                  <div>
                    <div className="text-xs font-bold text-white">
                      発表者ボーナス点 (Presenter Bonus)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      発表してくれた人にボーナス点（+100〜+300点）をあげます
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="host-compensation-toggle"
                    checked={roomState?.settings.hostCompensationEnabled ?? true}
                    onChange={(e) => onUpdateSettings({ hostCompensationEnabled: e.target.checked })}
                    className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Connected Students List */}
          <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white">
                  参加している友だち ({playersList.length}人)
                </h3>
              </div>

              {/* Demo bot testing controls (Presenter / Host only) */}
              {canManageLobby && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddBots(3)}
                    id="add-demo-students-btn"
                    title="クラスを再現するために練習用ボットを3人追加"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    +3人 練習用ボット
                  </button>
                  {playersList.some(p => p.isBot) && (
                    <button
                      onClick={onRemoveBots}
                      id="remove-demo-students-btn"
                      title="練習用ボットを削除"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {playersList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                まだだれも参加していません。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {playersList.map((player) => {
                  const isCurrentPresenter = player.id === roomState?.presenterId;
                  const isMe = player.id === myPlayer.id;
                  const colorConfig = AVAILABLE_COLORS.find(c => c.id === player.favoriteColor) || AVAILABLE_COLORS[0];

                  return (
                    <div
                      key={player.id}
                      className={`relative flex items-center justify-between p-3.5 rounded-2xl border transition ${
                        isCurrentPresenter
                          ? 'border-amber-500/40 bg-amber-500/10 shadow-xs'
                          : 'border-white/5 bg-slate-800/40 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                          style={{ backgroundColor: `${colorConfig.hex}22`, borderColor: colorConfig.hex }}
                        >
                          {player.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-sm truncate">
                              {player.name}
                            </span>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 font-bold rounded border border-indigo-500/30">
                                あなた
                              </span>
                            )}
                            {(player.isTeacher || player.id === roomState?.hostId) ? (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/25 text-amber-300 font-black rounded border border-amber-500/40">
                                👑 先生
                              </span>
                            ) : isCurrentPresenter ? (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold rounded border border-amber-500/30">
                                🌟 発表者
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 font-medium rounded border border-white/5">
                                🎓 生徒
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorConfig.hex }} />
                            <span>{colorConfig.japaneseName ? colorConfig.japaneseName.split(' ')[0] : colorConfig.name.split(' ')[0]}</span>
                            {player.isBot && <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded border border-white/5">練習用</span>}
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

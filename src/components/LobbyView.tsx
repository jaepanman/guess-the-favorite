import React, { useState } from 'react';
import { Crown, Shuffle, Play, Plus, Trash2, Users, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GameRoomState, Player } from '../types';
import { AVAILABLE_AVATARS, AVAILABLE_COLORS } from '../gameData';
import { playSelectSound } from '../utils/soundEffects';

interface LobbyViewProps {
  roomState: GameRoomState | null;
  myPlayer: Player | undefined;
  onJoin: (roomCode: string, name: string, avatar: string, favoriteColor: string, isTeacher: boolean) => void;
  onStartGame: () => void;
  onSetPresenter: (playerId: string) => void;
  onPickRandomPresenter: () => void;
  onUpdateSettings: (settings: any) => void;
  onAddBots: (count: number) => void;
  onRemoveBots: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  myPlayer,
  onJoin,
  onStartGame,
  onSetPresenter,
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

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    playSelectSound();
    localStorage.setItem('efl_name', name.trim());
    localStorage.setItem('efl_avatar', selectedAvatar);
    localStorage.setItem('efl_color', selectedColor);

    onJoin(roomCodeInput.trim() || 'EFL1', name.trim(), selectedAvatar, selectedColor, isTeacherRole);
  };

  const playersList: Player[] = roomState ? (Object.values(roomState.players) as Player[]) : [];
  const currentPresenter = roomState?.presenterId && roomState.players[roomState.presenterId]
    ? roomState.players[roomState.presenterId]
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* If current client is not yet in the room, show Join card */}
      {!myPlayer ? (
        <div className="bg-slate-900/70 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md p-6 sm:p-10">
          <div className="text-center max-w-lg mx-auto mb-8">
            <span className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-3xl mb-3 shadow-sm">
              🎉
            </span>
            <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-1">
              Classroom Multiplayer
            </p>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Join the Favorites Game
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Practice speaking English! Choose your favorite sport, food, animal and guess what your classmates like.
            </p>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-6 max-w-md mx-auto">
            {/* Room Code */}
            <div>
              <label htmlFor="room-code-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Game Room Code
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
                Enter the code displayed on your teacher&apos;s screen
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="student-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Your English Name / Nickname
              </label>
              <input
                id="student-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kenji, Sarah, Leo..."
                required
                maxLength={20}
                className="w-full px-4 py-3 text-base font-semibold text-white bg-slate-800/80 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-500"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Choose Your Avatar
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
                      title={av.label}
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
                Choose Your Favorite Color (For stats & badges)
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
                      <span className="truncate">{col.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Teacher toggle */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Joining as the Classroom Teacher / Host?
              </span>
              <button
                type="button"
                id="toggle-teacher-role-btn"
                onClick={() => setIsTeacherRole(!isTeacherRole)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isTeacherRole
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isTeacherRole ? '✓ Teacher Mode' : 'Student Mode'}
              </button>
            </div>

            {/* Submit Join */}
            <button
              type="submit"
              id="join-game-submit-btn"
              disabled={!name.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base tracking-wide shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Enter Game Lobby 🚀
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black uppercase tracking-wider">
                    GAME LOBBY OPEN
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    CODE: <strong className="text-indigo-400 text-sm font-black">{roomState?.code}</strong>
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  Ready to Practice Speaking!
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Students will ask &quot;What ___ do you like?&quot; and guess the presenter&apos;s answer for quick-speed points!
                </p>
              </div>

              {/* Start Game Button (Teacher or Presenter) */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onStartGame}
                  id="start-game-btn"
                  disabled={playersList.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base tracking-wide shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Round 1 ({roomState?.currentCategory.label})
                </button>
              </div>
            </div>

            {/* Current Presenter Spotlight */}
            <div className="mt-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
                  <Crown className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Current Presenter (Main Player)
                  </div>
                  <div className="text-lg font-black text-white flex items-center gap-2">
                    <span>{currentPresenter?.avatar} {currentPresenter?.name || 'None selected yet'}</span>
                    {currentPresenter?.id === myPlayer.id && (
                      <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        You!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This player will choose their favorite {roomState?.currentCategory.label} first, then everyone else guesses!
                  </p>
                </div>
              </div>

              {/* Teacher switch / random presenter controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onPickRandomPresenter}
                  id="random-presenter-btn"
                  title="Pick a random student to be presenter"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  Pick Random Student
                </button>
              </div>
            </div>

            {/* Teacher Host Settings Toggles */}
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Auto-rotate presenter toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/10">
                <div>
                  <div className="text-xs font-bold text-white">
                    Auto-Rotate Presenter
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Pick a new random student presenter each round
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
                    Presenter Points Compensation
                  </div>
                  <div className="text-[11px] text-slate-400">
                    +150 pts to presenter for every wrong guess
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="host-compensation-toggle"
                  checked={roomState?.settings.hostCompensation ?? true}
                  onChange={(e) => onUpdateSettings({ hostCompensation: e.target.checked })}
                  className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Connected Students List */}
          <div className="bg-slate-900/50 rounded-3xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white">
                  Joined Students ({playersList.length})
                </h3>
              </div>

              {/* Demo bot testing controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddBots(3)}
                  id="add-demo-students-btn"
                  title="Add 3 practice bots to simulate a full classroom"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  +3 Demo Students
                </button>
                {playersList.some(p => p.isBot) && (
                  <button
                    onClick={onRemoveBots}
                    id="remove-demo-students-btn"
                    title="Remove practice bots"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {playersList.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No players connected yet.
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm truncate">
                              {player.name}
                            </span>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 font-bold rounded border border-indigo-500/30">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorConfig.hex }} />
                            <span>{colorConfig.name.split(' ')[0]}</span>
                            {player.isBot && <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded border border-white/5">BOT</span>}
                          </div>
                        </div>
                      </div>

                      {/* Presenter Action or Badge */}
                      <div className="shrink-0 pl-2">
                        {isCurrentPresenter ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                            <Crown className="w-3 h-3 text-amber-400" />
                            Presenter
                          </span>
                        ) : (
                          <button
                            onClick={() => onSetPresenter(player.id)}
                            id={`make-presenter-${player.id}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer"
                          >
                            Make Presenter
                          </button>
                        )}
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

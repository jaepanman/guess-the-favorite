import React from 'react';
import { X, Shuffle, Plus, Trash2, Crown, RotateCcw, Clock, Shield, Sparkles, Server, Flag } from 'lucide-react';
import { GameRoomState, CategoryId, Player } from '../types';
import { CATEGORY_ORDER, GAME_CATEGORIES } from '../gameData';
import { playSelectSound } from '../utils/soundEffects';

interface TeacherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomState: GameRoomState;
  onUpdateSettings: (settings: any) => void;
  onPickRandomPresenter: () => void;
  onSetPresenter: (playerId: string) => void;
  onAddBots: (count: number) => void;
  onRemoveBots: () => void;
  onEndGame?: () => void;
  onResetGame: () => void;
  onJumpToCategory: (catId: CategoryId) => void;
  onOpenServerModal?: () => void;
}

export const TeacherSettingsModal: React.FC<TeacherSettingsModalProps> = ({
  isOpen,
  onClose,
  roomState,
  onUpdateSettings,
  onPickRandomPresenter,
  onSetPresenter,
  onAddBots,
  onRemoveBots,
  onEndGame,
  onResetGame,
  onJumpToCategory,
  onOpenServerModal,
}) => {
  if (!isOpen) return null;

  const players: Player[] = Object.values(roomState.players) as Player[];
  const currentPresenter = roomState.presenterId ? roomState.players[roomState.presenterId] : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-white/15 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">
              Teacher & Classroom Settings
            </h2>
            <p className="text-xs text-slate-400">
              Manage presenter rotation, scoring rules, and rounds
            </p>
          </div>
          <button
            onClick={onClose}
            id="close-settings-modal-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presenter Rotation Controls */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Current Presenter
                </div>
                <div className="text-sm font-black text-white">
                  {currentPresenter ? `${currentPresenter.avatar} ${currentPresenter.name}` : 'None'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playSelectSound();
                onPickRandomPresenter();
              }}
              id="settings-random-presenter-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Pick Random Student
            </button>
          </div>

          {/* Quick Presenter Select Dropdown */}
          <div>
            <label className="block text-xs font-bold text-amber-200 mb-1">
              Appoint Specific Student as Presenter:
            </label>
            <select
              value={roomState.presenterId || ''}
              onChange={(e) => onSetPresenter(e.target.value)}
              className="w-full text-xs font-bold p-2.5 bg-slate-800 text-white rounded-xl border border-amber-500/30 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              {players.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.avatar} {p.name} {p.isTeacher ? '(Teacher)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gamification Settings */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Rules & Gamification
          </h3>

          {/* Auto rotate toggle */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/10 cursor-pointer hover:bg-slate-800/90 transition">
            <div>
              <div className="text-sm font-bold text-white">
                Auto-Rotate Presenter
              </div>
              <div className="text-xs text-slate-400">
                Automatically picks a new random student presenter every round
              </div>
            </div>
            <input
              type="checkbox"
              checked={roomState.settings.autoRandomPresenter}
              onChange={(e) => onUpdateSettings({ autoRandomPresenter: e.target.checked })}
              className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
            />
          </label>

          {/* Host compensation toggle */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/10 cursor-pointer hover:bg-slate-800/90 transition">
            <div>
              <div className="text-sm font-bold text-white">
                Host Wrong-Answer Compensation
              </div>
              <div className="text-xs text-slate-400">
                Presenter earns +150 pts for each classmate who guesses incorrectly
              </div>
            </div>
            <input
              type="checkbox"
              checked={roomState.settings.hostCompensation}
              onChange={(e) => onUpdateSettings({ hostCompensation: e.target.checked })}
              className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
            />
          </label>

          {/* Guessing Time Limit */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div className="text-sm font-bold text-white">
                Guessing Timer
              </div>
            </div>
            <div className="flex gap-1.5">
              {[10, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateSettings({ timeLimitSeconds: sec })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    roomState.settings.timeLimitSeconds === sec
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jump to Category */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Jump to Category
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {(roomState.categories && roomState.categories.length > 0 ? roomState.categories : CATEGORY_ORDER).map((catId, idx) => {
              const cat = GAME_CATEGORIES[catId];
              const isCurrent = roomState.currentCategory.id === catId;
              return (
                <button
                  key={`${catId}-${idx}`}
                  onClick={() => {
                    playSelectSound();
                    onJumpToCategory(catId);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer relative ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500'
                      : 'border-white/10 bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="absolute top-1 left-1.5 text-[9px] font-mono font-black text-slate-500">
                    R{idx + 1}
                  </span>
                  <span className="text-xl mt-1">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multiplayer Backend Server Section */}
        {onOpenServerModal && (
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Multiplayer Server Setup</div>
                <div className="text-[11px] text-slate-400">Configure Render/Railway backend for cross-device play on Vercel</div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenServerModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Configure
            </button>
          </div>
        )}

        {/* Practice Bots & Reset Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onAddBots(3)}
              className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              +3 Demo Bots
            </button>
            <button
              onClick={onRemoveBots}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Bots
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onEndGame && roomState.stage !== 'LOBBY' && roomState.stage !== 'GAME_OVER' && (
              <button
                onClick={() => {
                  if (confirm('End the game now and jump straight to the results and podium?')) {
                    onEndGame();
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                End Game (Show Results)
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Reset the game back to the lobby? All current scores will be cleared.')) {
                  onResetGame();
                  onClose();
                }
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

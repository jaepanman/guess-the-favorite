import React, { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { Navbar } from './components/Navbar';
import { LobbyView } from './components/LobbyView';
import { PresenterSelectingView } from './components/PresenterSelectingView';
import { ClassGuessingView } from './components/ClassGuessingView';
import { RevealView } from './components/RevealView';
import { ScoreboardView } from './components/ScoreboardView';
import { GameOverView } from './components/GameOverView';
import { TeacherSettingsModal } from './components/TeacherSettingsModal';
import { ServerConnectionModal } from './components/ServerConnectionModal';
import { WifiOff, AlertCircle, Server } from 'lucide-react';
import { CategoryId } from './types';

export default function App() {
  const {
    isConnected,
    isLiveConnected,
    isLocalMode,
    serverUrl,
    setServerUrl,
    testServerConnection,
    roomState,
    myPlayer,
    error,
    joinRoom,
    startGame,
    makePresenterChoice,
    submitGuess,
    triggerReveal,
    showScoreboard,
    nextRound,
    setPresenter,
    pickRandomPresenter,
    updateSettings,
    addDemoBots,
    removeDemoBots,
    resetGame,
  } = useGameSocket();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Active room code helper
  const roomCode = roomState?.code || 'EFL1';
  const playersList = roomState ? Object.values(roomState.players) : [];

  // Auto scroll back to the top whenever changing stages, rounds, or views
  const currentStage = roomState?.stage;
  const currentRoundIndex = roomState?.roundIndex;
  const isJoined = Boolean(myPlayer);

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };

    scrollToTop();
    // Re-verify after frame renders in case of asynchronous layout reflow
    const frameId = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(frameId);
  }, [currentStage, currentRoundIndex, isJoined]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        roomState={roomState}
        myPlayer={myPlayer}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLiveConnected={isLiveConnected}
        isLocalMode={isLocalMode}
        onOpenServerModal={() => setIsServerModalOpen(true)}
      />

      {/* Connection State Alert */}
      {!isConnected && (
        <div className="bg-amber-500/90 text-amber-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 border-b border-amber-400/30">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Connecting to classroom server... (reconnecting automatically)</span>
        </div>
      )}

      {isLocalMode && (
        <div className="bg-indigo-950/80 text-indigo-300 px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 border-b border-indigo-500/20">
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>In-Browser Classroom Host Mode is active. Single-screen and projector ready.</span>
          <button
            onClick={() => setIsServerModalOpen(true)}
            className="underline font-bold text-white hover:text-indigo-200 cursor-pointer ml-1"
          >
            Connect external server for multi-device play &rarr;
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/90 text-white px-4 py-2 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 border-b border-rose-400/30">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-14">
        {(!roomState || roomState.stage === 'LOBBY' || !myPlayer) && (
          <LobbyView
            roomState={roomState}
            myPlayer={myPlayer}
            onJoin={(code, name, avatar, color, isTeacher) => joinRoom(code, name, avatar, color, isTeacher)}
            onStartGame={() => startGame(roomCode)}
            onSetPresenter={(pId) => setPresenter(roomCode, pId)}
            onPickRandomPresenter={() => pickRandomPresenter(roomCode)}
            onUpdateSettings={(settings) => updateSettings(roomCode, settings)}
            onAddBots={(count) => addDemoBots(roomCode, count)}
            onRemoveBots={() => removeDemoBots(roomCode)}
          />
        )}

        {roomState && myPlayer && roomState.stage === 'PRESENTER_SELECTING' && (
          <PresenterSelectingView
            roomState={roomState}
            myPlayer={myPlayer}
            onChooseOption={(optId) => makePresenterChoice(roomCode, optId)}
            onPickRandomPresenter={() => pickRandomPresenter(roomCode)}
            onSetPresenter={(pId) => setPresenter(roomCode, pId)}
          />
        )}

        {roomState && myPlayer && roomState.stage === 'CLASS_GUESSING' && (
          <ClassGuessingView
            roomState={roomState}
            myPlayer={myPlayer}
            onSubmitGuess={(optId, elapsedMs) => submitGuess(roomCode, optId, elapsedMs)}
            onTriggerReveal={() => triggerReveal(roomCode)}
          />
        )}

        {roomState && myPlayer && roomState.stage === 'REVEAL' && (
          <RevealView
            roomState={roomState}
            myPlayer={myPlayer}
            onShowScoreboard={() => showScoreboard(roomCode)}
          />
        )}

        {roomState && myPlayer && roomState.stage === 'SCOREBOARD' && (
          <ScoreboardView
            roomState={roomState}
            myPlayer={myPlayer}
            onNextRound={(catId) => nextRound(roomCode, catId)}
            onPickRandomPresenter={() => pickRandomPresenter(roomCode)}
            onSetPresenter={(pId) => setPresenter(roomCode, pId)}
          />
        )}

        {roomState && myPlayer && roomState.stage === 'GAME_OVER' && (
          <GameOverView
            roomState={roomState}
            myPlayer={myPlayer}
            onResetGame={() => resetGame(roomCode)}
          />
        )}
      </main>

      {/* Bottom Geometric Balance Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 border-t border-white/10 z-20">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {playersList.length} {playersList.length === 1 ? 'Student' : 'Students'} Live
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <span>AUTO-ROTATE HOST:</span>
            <span className={roomState?.settings.autoRandomPresenter ? 'text-indigo-400 font-black' : 'text-slate-500'}>
              {roomState?.settings.autoRandomPresenter ? 'ENABLED' : 'OFF'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden md:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Answer Speed Bonus:
          </span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 bg-indigo-500 rounded-xs"></div>
            <div className="w-1 h-3 bg-indigo-500 rounded-xs"></div>
            <div className="w-1 h-3 bg-indigo-500 rounded-xs"></div>
            <div className="w-1 h-3 bg-indigo-500 rounded-xs"></div>
            <div className="w-1 h-3 bg-slate-700 rounded-xs"></div>
          </div>
          <span className="text-[10px] font-black text-white px-2 py-0.5 bg-orange-600/90 rounded tracking-wider uppercase">
            MAX +500 PTS
          </span>
        </div>
      </footer>

      {/* Teacher / Classroom Settings Modal */}
      {roomState && (
        <TeacherSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          roomState={roomState}
          onUpdateSettings={(settings) => updateSettings(roomCode, settings)}
          onPickRandomPresenter={() => pickRandomPresenter(roomCode)}
          onSetPresenter={(pId) => setPresenter(roomCode, pId)}
          onAddBots={(count) => addDemoBots(roomCode, count)}
          onRemoveBots={() => removeDemoBots(roomCode)}
          onResetGame={() => resetGame(roomCode)}
          onJumpToCategory={(catId: CategoryId) => nextRound(roomCode, catId)}
          onOpenServerModal={() => setIsServerModalOpen(true)}
        />
      )}

      {/* Multiplayer Server Connection Modal */}
      <ServerConnectionModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        serverUrl={serverUrl}
        onSaveServerUrl={setServerUrl}
        isConnected={isLiveConnected}
        isLocalMode={isLocalMode}
        onTestConnection={testServerConnection}
      />
    </div>
  );
}

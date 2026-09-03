import { useEffect, useRef, useState, useCallback } from 'react';
import { GameRoomState, ClientMessage, ServerMessage, Player, CategoryId, GameSettings } from '../types';

export function useGameSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<GameRoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('efl_player_id') || null;
  });
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        if (msg.type === 'ROOM_STATE') {
          setRoomState(msg.state);
        } else if (msg.type === 'ERROR') {
          setError(msg.message);
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Cannot send, socket not open', msg);
    }
  }, []);

  const joinRoom = useCallback((roomCode: string, name: string, avatar: string, favoriteColor: string, isTeacher: boolean = false) => {
    send({
      type: 'JOIN_ROOM',
      roomCode: roomCode.toUpperCase(),
      name,
      avatar,
      favoriteColor,
      isTeacher,
    });
  }, [send]);

  const startGame = useCallback((roomCode: string) => {
    send({ type: 'START_GAME', roomCode });
  }, [send]);

  const makePresenterChoice = useCallback((roomCode: string, optionId: string) => {
    send({ type: 'PRESENTER_CHOICE', roomCode, optionId });
  }, [send]);

  const submitGuess = useCallback((roomCode: string, optionId: string, elapsedMs: number) => {
    send({ type: 'SUBMIT_GUESS', roomCode, optionId, elapsedMs });
  }, [send]);

  const triggerReveal = useCallback((roomCode: string) => {
    send({ type: 'TRIGGER_REVEAL', roomCode });
  }, [send]);

  const showScoreboard = useCallback((roomCode: string) => {
    send({ type: 'SHOW_SCOREBOARD', roomCode });
  }, [send]);

  const nextRound = useCallback((roomCode: string, categoryId?: CategoryId) => {
    send({ type: 'NEXT_ROUND', roomCode, categoryId });
  }, [send]);

  const setPresenter = useCallback((roomCode: string, playerId: string) => {
    send({ type: 'SET_PRESENTER', roomCode, playerId });
  }, [send]);

  const pickRandomPresenter = useCallback((roomCode: string) => {
    send({ type: 'PICK_RANDOM_PRESENTER', roomCode });
  }, [send]);

  const updateSettings = useCallback((roomCode: string, settings: Partial<GameSettings>) => {
    send({ type: 'UPDATE_SETTINGS', roomCode, settings });
  }, [send]);

  const addDemoBots = useCallback((roomCode: string, count: number = 3) => {
    send({ type: 'ADD_DEMO_BOTS', roomCode, count });
  }, [send]);

  const removeDemoBots = useCallback((roomCode: string) => {
    send({ type: 'REMOVE_DEMO_BOTS', roomCode });
  }, [send]);

  const resetGame = useCallback((roomCode: string) => {
    send({ type: 'RESET_GAME', roomCode });
  }, [send]);

  // Identify current player
  const myPlayer: Player | undefined = roomState && myPlayerId ? roomState.players[myPlayerId] : undefined;

  return {
    isConnected,
    roomState,
    myPlayerId,
    setMyPlayerId,
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
  };
}

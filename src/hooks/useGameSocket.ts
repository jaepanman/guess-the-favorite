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

  // Fetch state via REST fallback
  const fetchRoomState = useCallback(async (code: string = 'EFL1') => {
    try {
      const storedPlayerId = localStorage.getItem('efl_player_id');
      const url = `/api/room/${encodeURIComponent(code)}${storedPlayerId ? `?playerId=${storedPlayerId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setRoomState(data.state);
        }
      }
    } catch {
      // Benign network fallback failure
    }
  }, []);

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

      // Attempt reconnection if previous session exists
      const savedPlayerId = localStorage.getItem('efl_player_id');
      const savedRoomCode = localStorage.getItem('efl_room_code') || 'EFL1';
      if (savedPlayerId) {
        ws.send(JSON.stringify({
          type: 'RECONNECT',
          roomCode: savedRoomCode,
          playerId: savedPlayerId,
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        if (msg.type === 'ROOM_STATE') {
          setRoomState(msg.state);
        } else if (msg.type === 'JOIN_SUCCESS') {
          setMyPlayerId(msg.playerId);
          localStorage.setItem('efl_player_id', msg.playerId);
          localStorage.setItem('efl_room_code', msg.state.code);
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

  // Initialize connection and periodic ping/fetch
  useEffect(() => {
    fetchRoomState();
    connect();

    // Client-to-server heartbeat ping every 20 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'PING' }));
      } else {
        // If socket is down, poll room state to keep UI in sync
        const currentCode = localStorage.getItem('efl_room_code') || 'EFL1';
        fetchRoomState(currentCode);
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect, fetchRoomState]);

  const send = useCallback(async (msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      // Fallback to REST action API if socket is not open
      try {
        const targetRoom = 'roomCode' in msg ? msg.roomCode : (roomState?.code || 'EFL1');
        const res = await fetch('/api/room/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: targetRoom,
            playerId: myPlayerId,
            action: msg,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.state) {
            setRoomState(data.state);
          }
        }
      } catch (err) {
        console.error('HTTP action fallback error:', err);
      }
    }
  }, [myPlayerId, roomState?.code]);

  const joinRoom = useCallback(async (
    roomCode: string,
    name: string,
    avatar: string,
    favoriteColor: string,
    isTeacher: boolean = false
  ) => {
    const cleanCode = (roomCode.trim() || 'EFL1').toUpperCase();
    const storedPlayerId = localStorage.getItem('efl_player_id') || undefined;

    // Send through WebSocket if available
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: cleanCode,
        name,
        avatar,
        favoriteColor,
        isTeacher,
        playerId: storedPlayerId,
      }));
    }

    // Also call REST join immediately as a reliable fallback/acceleration
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: cleanCode,
          name,
          avatar,
          favoriteColor,
          isTeacher,
          playerId: storedPlayerId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.playerId) {
          setMyPlayerId(data.playerId);
          localStorage.setItem('efl_player_id', data.playerId);
          localStorage.setItem('efl_room_code', cleanCode);
        }
        if (data.state) {
          setRoomState(data.state);
        }
      }
    } catch (err) {
      console.error('REST join error:', err);
    }
  }, []);

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

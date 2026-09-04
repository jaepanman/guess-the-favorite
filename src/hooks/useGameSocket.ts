import { useEffect, useRef, useState, useCallback } from 'react';
import { GameRoomState, ClientMessage, ServerMessage, Player, CategoryId, GameSettings } from '../types';
import {
  getLocalRoomState,
  localJoin,
  dispatchLocalAction,
  subscribeLocalEngine,
} from '../utils/localGameEngine';

function resolveWsUrl(serverUrl: string): string {
  if (serverUrl) {
    const clean = serverUrl.trim().replace(/\/+$/, '');
    if (clean.startsWith('https://')) {
      return clean.replace(/^https:\/\//, 'wss://') + '/ws';
    }
    if (clean.startsWith('http://')) {
      return clean.replace(/^http:\/\//, 'ws://') + '/ws';
    }
    return `wss://${clean}/ws`;
  }
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  return `${protocol}//${host}/ws`;
}

function resolveHttpUrl(serverUrl: string, endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (serverUrl) {
    const cleanBase = serverUrl.trim().replace(/\/+$/, '');
    return `${cleanBase}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}

export function useGameSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const [serverUrl, setServerUrlState] = useState<string>(() => {
    return localStorage.getItem('efl_server_url') || (import.meta.env.VITE_SERVER_URL as string) || '';
  });
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [roomState, setRoomState] = useState<GameRoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('efl_player_id') || null;
  });
  const [error, setError] = useState<string | null>(null);

  const setServerUrl = useCallback((url: string) => {
    const clean = url.trim();
    setServerUrlState(clean);
    if (clean) {
      localStorage.setItem('efl_server_url', clean);
    } else {
      localStorage.removeItem('efl_server_url');
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsLiveConnected(false);
  }, []);

  const testServerConnection = useCallback(async (): Promise<boolean> => {
    try {
      const url = resolveHttpUrl(serverUrl, '/api/health');
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      return res.ok;
    } catch {
      return false;
    }
  }, [serverUrl]);

  // Fetch state via REST fallback
  const fetchRoomState = useCallback(async (code: string = 'EFL1') => {
    try {
      const storedPlayerId = localStorage.getItem('efl_player_id');
      const url = resolveHttpUrl(
        serverUrl,
        `/api/room/${encodeURIComponent(code)}${storedPlayerId ? `?playerId=${storedPlayerId}` : ''}`
      );
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.state && isMountedRef.current) {
          setRoomState(data.state);
          setIsLocalMode(false);
          return true;
        }
      }
    } catch {
      // Benign network fallback failure
    }
    return false;
  }, [serverUrl]);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    try {
      const wsUrl = resolveWsUrl(serverUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }

      connectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && ws.readyState !== WebSocket.OPEN) {
          // If live socket hasn't established after 2.5s, enable local fallback without killing connection
          setIsLocalMode((prev) => {
            if (!prev) {
              setRoomState((current) => current || getLocalRoomState());
            }
            return true;
          });
        }
      }, 2500);

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        setIsLiveConnected(true);
        setIsLocalMode(false);
        setError(null);

        // Attempt reconnection if previous session exists
        const savedPlayerId = localStorage.getItem('efl_player_id');
        const savedRoomCode = localStorage.getItem('efl_room_code') || 'EFL1';
        if (savedPlayerId) {
          ws.send(
            JSON.stringify({
              type: 'RECONNECT',
              roomCode: savedRoomCode,
              playerId: savedPlayerId,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          if (msg.type === 'ROOM_STATE') {
            setRoomState(msg.state);
            // If our local player is no longer in this room (e.g. server restarted or room reset), clean up
            setMyPlayerId((prevId) => {
              if (prevId && (!msg.state.players || !msg.state.players[prevId])) {
                localStorage.removeItem('efl_player_id');
                return null;
              }
              return prevId;
            });
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
        if (!isMountedRef.current) return;
        setIsLiveConnected(false);

        // Schedule auto-reconnect cleanly without clearing active roomState
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setIsLiveConnected(false);
      };
    } catch {
      if (isMountedRef.current) {
        setIsLiveConnected(false);
        setIsLocalMode(true);
        setRoomState((current) => current || getLocalRoomState());
      }
    }
  }, [serverUrl]);

  // Subscribe to local engine state changes when in local mode
  useEffect(() => {
    if (isLocalMode) {
      const unsubscribe = subscribeLocalEngine((updatedState) => {
        setRoomState(updatedState);
      });
      return unsubscribe;
    }
  }, [isLocalMode]);

  // Initialize connection and periodic ping/fetch (strictly dependent only on serverUrl)
  useEffect(() => {
    isMountedRef.current = true;

    fetchRoomState().then((ok) => {
      if (!ok && isMountedRef.current && !isLiveConnected) {
        setIsLocalMode(true);
        setRoomState((curr) => curr || getLocalRoomState());
      }
    });

    connect();

    // Heartbeat ping every 20 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 20000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [serverUrl, connect, fetchRoomState]);

  const send = useCallback(async (msg: ClientMessage) => {
    // If live WebSocket is connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
      return;
    }

    // Try HTTP fallback if not exclusively in local mode
    if (!isLocalMode) {
      try {
        const targetRoom = 'roomCode' in msg ? msg.roomCode : (roomState?.code || 'EFL1');
        const res = await fetch(resolveHttpUrl(serverUrl, '/api/room/action'), {
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
            return;
          }
        }
      } catch {
        // Fall back to local engine below
      }
    }

    // Local in-browser host engine fallback
    if (myPlayerId) {
      const updated = dispatchLocalAction(myPlayerId, msg);
      setRoomState(updated);
    }
  }, [isLocalMode, myPlayerId, roomState?.code, serverUrl]);

  const joinRoom = useCallback(async (
    roomCode: string,
    name: string,
    avatar: string,
    favoriteColor: string,
    isTeacher: boolean = false
  ) => {
    const cleanCode = (roomCode.trim() || 'EFL1').toUpperCase();
    const storedPlayerId = localStorage.getItem('efl_player_id') || undefined;

    // 1. If WebSocket is connected, send JOIN_ROOM directly
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
      return;
    }

    // 2. Try REST join endpoint if WebSocket is not open
    try {
      const res = await fetch(resolveHttpUrl(serverUrl, '/api/room/join'), {
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
          setIsLocalMode(false);
          return;
        }
      }
    } catch {
      // Network join failed, fallback to local below
    }

    // 3. Fallback: run in local in-browser classroom mode
    setIsLocalMode(true);
    const { player, state } = localJoin(cleanCode, name, avatar, favoriteColor, isTeacher, storedPlayerId);
    setMyPlayerId(player.id);
    localStorage.setItem('efl_player_id', player.id);
    localStorage.setItem('efl_room_code', cleanCode);
    setRoomState(state);
  }, [serverUrl]);

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

  const endGame = useCallback((roomCode: string) => {
    send({ type: 'END_GAME', roomCode });
  }, [send]);

  const resetGame = useCallback((roomCode: string) => {
    send({ type: 'RESET_GAME', roomCode });
  }, [send]);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem('efl_player_id');
    setMyPlayerId(null);
  }, []);

  // Current player identification
  const myPlayer: Player | undefined = roomState && myPlayerId ? roomState.players[myPlayerId] : undefined;

  return {
    isConnected: isLiveConnected || isLocalMode,
    isLiveConnected,
    isLocalMode,
    serverUrl,
    setServerUrl,
    testServerConnection,
    roomState,
    myPlayerId,
    setMyPlayerId,
    myPlayer,
    error,
    joinRoom,
    leaveRoom,
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
    endGame,
    resetGame,
  };
}

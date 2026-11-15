import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  event: string;
  class_session_id?: number;
  data: any;
}

interface UseWebSocketOptions {
  classSessionId?: number;
  onEvent?: (event: string, data: any) => void;
  autoConnect?: boolean;
}

export function useWebSocket({
  classSessionId,
  onEvent,
  autoConnect = true,
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('classsphere_access_token');
    if (!token) {
      setIsConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If running with Vite dev server proxying /ws or backend on port 8000
    const host = window.location.port === '5173' ? `${window.location.hostname}:8000` : window.location.host;
    const path = classSessionId ? `/ws/classroom/${classSessionId}` : '/ws/live';
    const wsUrl = `${protocol}//${host}${path}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onEventRef.current && parsed.event) {
            onEventRef.current(parsed.event, parsed.data);
          }
        } catch {
          // Non-JSON message (e.g. heartbeat pong)
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Exponential backoff reconnect: max 10s
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setIsConnected(false);
    }
  }, [classSessionId]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, autoConnect]);

  const sendMessage = useCallback((type: string, payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect: connect,
  };
}

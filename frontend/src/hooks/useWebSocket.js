import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('Control Hub Linked');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'SIMULATION_UPDATE') {
          setData(payload);
        }
      } catch (err) {
        console.error('Payload Corrupted:', err);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('Link Disconnected, Reconnecting...');
      setTimeout(connect, 3000);
    };

    wsRef.current.onerror = (err) => {
      console.error('Core Link Failure:', err);
      wsRef.current.close();
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { data, isConnected };
};

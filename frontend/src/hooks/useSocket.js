import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket(userId, onNotification) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('notification', (data) => {
      onNotificationRef.current?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return { connected };
}

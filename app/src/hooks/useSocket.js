import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = (userId, baseUrl = 'http://localhost:5000') => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newAlerts, setNewAlerts] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection
    socketRef.current = io(baseUrl, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-user-room', userId);
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket server');
    });

    socket.on('new-disease-alert', (data) => {
      console.log('New disease alert received:', data);
      setNewAlerts(prev => [...prev, data.alert]);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Disease Alert', {
          body: data.message,
          icon: '/favicon.ico',
          tag: `alert-${data.alert._id}`
        });
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, baseUrl]);

  const clearNewAlerts = () => {
    setNewAlerts([]);
  };

  return {
    socket: socketRef.current,
    isConnected,
    newAlerts,
    clearNewAlerts
  };
};

export default useSocket;

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : window.location.origin);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      // Note: no client emit needed here — the backend auto-joins this socket
      // to its personal room (`user:${socket.userId}`) using the JWT payload
      // as soon as the connection is authenticated (see sockets/index.js).
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('Socket.io connection error:', err.message);
      setIsConnected(false);
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  // Backend listens for 'ticket:join' / 'ticket:leave' with a plain ticketId string
  // (see sockets/index.js) — must match exactly, no wrapper object.
  const joinTicket = useCallback((ticketId) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('ticket:join', ticketId);
    }
  }, []);

  const leaveTicket = useCallback((ticketId) => {
    if (socketRef.current && ticketId) {
      socketRef.current.emit('ticket:leave', ticketId);
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinTicket,
        leaveTicket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
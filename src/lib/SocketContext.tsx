import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to Node.js Socket.IO backend
    const rawSocketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    if (rawSocketUrl === 'none' || rawSocketUrl === 'disabled') {
      console.log('Real-time Socket.IO disabled by configuration');
      return;
    }

    const socketUrl = rawSocketUrl;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to Node.js Real-time Socket.IO Server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Real-time Server');
      setConnected(false);
    });

    // Listen for global activity notifications
    newSocket.on('new_activity', (data: { message: string, type: string }) => {
      toast.info(data.message, {
        description: "Live Activity Alert",
        position: 'bottom-right',
        duration: 5000,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

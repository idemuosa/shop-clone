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
    // Connect to Node.js Socket.IO backend (defaults to window.location.origin or http://localhost:3000)
    const socketUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
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

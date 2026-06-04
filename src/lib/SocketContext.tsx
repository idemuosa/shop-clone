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
    // Connect to the new Node.js backend
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

    newSocket.on('connect', () => {
      console.log('Connected to Real-time Server');
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

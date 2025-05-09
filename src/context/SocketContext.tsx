import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In a real environment, this would connect to a real WebSocket server
    // For now, we'll mock the socket communication
    const mockSocket = io();
    
    const mockConnect = () => {
      setIsConnected(true);
      console.log('Socket connected');
    };
    
    const mockDisconnect = () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    };
    
    // Mock connection events
    setTimeout(mockConnect, 1000);
    
    setSocket(mockSocket);
    
    return () => {
      mockDisconnect();
      mockSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
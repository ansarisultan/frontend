import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.token) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: currentUser.token
        }
      });
      
      setSocket(newSocket);
      
      return () => newSocket.close();
    }
  }, [currentUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
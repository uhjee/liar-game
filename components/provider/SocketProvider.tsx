import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, User } from '../../types';

type ClientSocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface ISocketContext {
  socket: ClientSocketType | null;
  isConnected: boolean;
  users: User[];
  isHost: boolean;
}

const SocketContext = createContext<ISocketContext>({
  socket: null,
  isConnected: false,
  users: [],
  isHost: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<ClientSocketType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isHost, setIsHost] = useState(false);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: '/api/socket',
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socket.on('checkAuth', ({ isHost }) => {
      setIsHost(isHost);
    });

    socket.on('updateUsers', (users: User[]) => {
      setUsers(users);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    setSocket(socket);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, users, isHost }}>
      {children}
    </SocketContext.Provider>
  );
};

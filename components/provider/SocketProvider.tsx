import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  RoomInfo,
  ServerToClientEvents,
  User,
} from '../../types';

type ClientSocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface ISocketContext {
  socket: ClientSocketType | null;
  isConnected: boolean;
  rooms: RoomInfo[];
}

const SocketContext = createContext<ISocketContext>({
  socket: null,
  isConnected: false,
  rooms: [],
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<ClientSocketType | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: '/api/socket',
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    socket.on('updateRooms', (roomInfos: RoomInfo[]) => {
      setRooms(roomInfos);
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
    <SocketContext.Provider value={{ socket, isConnected, rooms }}>
      {children}
    </SocketContext.Provider>
  );
};

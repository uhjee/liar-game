import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../../components/provider/SocketProvider';
import useRoomId from '../../hooks/useRoomId';
import Layout from '../Layout';
import { User } from '../../types';

const Waiting = () => {
  const router = useRouter();
  const roomId = useRoomId();
  const [users, setUsers] = useState<User[]>([]);
  const [isHost, setIsHost] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      const emitLeaveRoom = () => {
        socket?.emit('leaveRoom', roomId);
      };

      if (router.query.roomId) {
        socket.emit('joinRoom', roomId);
      }

      window.addEventListener('popstate', () => {
        emitLeaveRoom();
      });

      socket.on('gameStarted', () => {
        router.push(`/category/${roomId}`);
      });

      socket.on('updateRoomUsers', (users: User[]) => {
        setUsers(users);
      });

      return () => {
        socket.off('gameStarted');
        socket.off('updateRoomUsers');

        window.removeEventListener('popstate', () => {
          emitLeaveRoom();
        });
      };
    }
  }, [socket, router, roomId]);

  const checkHost = useCallback(
    (users: User[]) => {
      if (users.length > 0) {
        setIsHost(users.some((u) => u.isHost && u.socketId === socket?.id));
      }
    },
    [socket],
  );

  useEffect(() => {
    checkHost(users);
  }, [users, checkHost]);

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame', roomId);
    }
  };

  return (
    <Layout>
      <h3>{router.query.roomId} - 대기 중...</h3>
      <ul>
        {users.map((user, index) => (
          <li key={index}>
            {user.nickname} {user.isHost && '(방장)'}
          </li>
        ))}
      </ul>
      {!!isHost && <button onClick={handleStartGame}>게임 시작</button>}
    </Layout>
  );
};

export default Waiting;

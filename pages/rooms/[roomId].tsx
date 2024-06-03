import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../../components/provider/SocketProvider';
import useRoomId from '../../hooks/useRoomId';
import Layout from "../Layout";

const Waiting = () => {
  const router = useRouter();
  const roomId = useRoomId();
  const { socket, users, isHost } = useSocket();

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

      return () => {
        socket.off('gameStarted');

        window.removeEventListener('popstate', () => {
          emitLeaveRoom();
        });
      };
    }
  }, [socket, router, roomId]);

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

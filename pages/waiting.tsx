import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../components/provider/SocketProvider';

const Waiting = () => {
  const router = useRouter();
  const { socket, users, isHost } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('gameStarted', () => {
        router.push('/select-category');
      });

      return () => {
        socket.off('gameStarted');
      };
    }
  }, [socket, router]);

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame');
    }
  };

  return (
    <div>
      <h1>대기 중...</h1>
      <ul>
        {users.map((user, index) => (
          <li key={index}>
            {user.nickname} {user.isHost && '(방장)'}
          </li>
        ))}
      </ul>
      {!!isHost && (
        <button onClick={handleStartGame}>게임 시작</button>
      )}
    </div>
  );
};

export default Waiting;

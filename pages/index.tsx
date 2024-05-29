import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../components/provider/SocketProvider';

const Home = () => {
  const [nickname, setNickname] = useState<string>('');
  const router = useRouter();
  const { socket } = useSocket();

  const handleJoin = () => {
    if (nickname && socket) {
      socket.emit('join', nickname);
      router.push('/rooms');
    }
  };

  return (
    <div>
      <h1>라이어 게임</h1>
      <input
        type="text"
        placeholder="닉네임 입력"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button onClick={handleJoin}>참여</button>
    </div>
  );
};

export default Home;

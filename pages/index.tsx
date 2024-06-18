import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../components/provider/SocketProvider';
import styled from 'styled-components';
import { Metadata } from 'next';

const backgroundImage = '/img/background.png';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background-image: url(${backgroundImage});
  background-repeat: no-repeat;
  background-size: cover;
`;
const Content = styled.div`
  position: absolute;
  top: 33vh;
  left: 126vh;
  width: 360px;
  height: 250px;
  overflow: auto;
`;

export const metadata: Metadata = {
  title: 'Watchall Apple LierGame',
  description: '후',
  icons: {
    icon: '/favicon.png',
  },
};

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
    <Container>
      <Content>
        <h3>라이어 게임</h3>
        <input
          type="text"
          placeholder="닉네임 입력"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button onClick={handleJoin}>참여</button>
      </Content>
    </Container>
  );
};

export default Home;

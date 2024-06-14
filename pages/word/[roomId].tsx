import { useState, useEffect } from 'react';
import { useSocket } from '../../components/provider/SocketProvider';
import Layout from '../Layout';
import useRoomId from '../../hooks/useRoomId';

const ShowWord = () => {
  const roomId = useRoomId();
  const [word, setWord] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      if (!!roomId) {
        socket.emit('readyToReceiveWord', roomId);

        socket.on('assignWords', (word) => {
          setWord(word);
        });
      }

      return () => {
        socket.off('gameStarted');
      };
    }
  }, [socket, roomId]);

  return (
    <Layout>
      <h3>당신의 단어는?</h3>
      {word && <p>{word}</p>}
    </Layout>
  );
};

export default ShowWord;

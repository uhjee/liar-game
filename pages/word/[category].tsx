import { useState, useEffect } from 'react';
import { useSocket } from '../../components/provider/SocketProvider';
import { useRouter } from 'next/router';

const ShowWord = () => {
  const [word, setWord] = useState<string | null>(null);
  const { socket } = useSocket();

  const router = useRouter();
  console.log(router.query.category);

  useEffect(() => {
    if (socket) {
      if (!!router.query.category) {
        socket.emit('readyToReceiveWord');

        socket.on('assignWords', (word) => {
          setWord(word);
        });
      }

      return () => {
        socket.off('gameStarted');
      };
    }
  }, [socket, router.query.category]);

  return (
    <div>
      <h1>당신의 단어는?</h1>
      {word && <p>{word}</p>}
    </div>
  );
};

export default ShowWord;

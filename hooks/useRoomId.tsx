import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const useRoomId = () => {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();
  useEffect(() => {
    if (router.query.roomId) {
      setRoomId(router.query.roomId as string);
    }
  }, [router.query.roomId]);

  return roomId;
};

export default useRoomId;

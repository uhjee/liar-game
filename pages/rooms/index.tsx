import { ChangeEventHandler, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '../../components/provider/SocketProvider';
import { RoomInfo } from '../../types';

const Rooms = () => {
  const router = useRouter();
  const { socket, rooms } = useSocket();
  const [newRoomTitle, setNewRoomTitle] = useState('');

  //   useEffect(() => {
  //     if (socket) {
  //       socket.on('gameStarted', () => {
  //         router.push('/select-category');
  //       });

  //       return () => {
  //         socket.off('gameStarted');
  //       };
  //     }
  //   }, [socket, router]);

  const handlerMakeNewRoom = () => {
    if (socket) {
      socket.emit('newRoom', newRoomTitle);
      setNewRoomTitle('');
    }
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setNewRoomTitle(e.target.value);
  };

  const onClickRoomHandler = (room: RoomInfo) => {
    router.push(`/rooms/${room.roomId}`);
  };

  return (
    <div>
      <h1>방 목록</h1>
      <ul>
        {rooms.map((room, index) => (
          <li key={index} onClick={(e) => onClickRoomHandler(room)}>
            {room.title} ({room.headCount}명)
          </li>
        ))}
      </ul>
      <input type="text" value={newRoomTitle} onChange={handleInputChange} />
      <button
        onClick={handlerMakeNewRoom}
        disabled={!newRoomTitle || newRoomTitle.length === 0}
      >
        방 만들기
      </button>
    </div>
  );
};

export default Rooms;

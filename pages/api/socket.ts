import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as IOServer } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  User,
  InterServerEvents,
  SocketData,
  CategoryCountMap,
  StringArrayMap,
  StringMap,
} from '../../types';
import path from 'path';
import fs from 'fs/promises'; // 비동기 파일 작업을 위한 fs/promises 사용
import { title } from 'process';
import Game from '../../service/class/Game';

/**
 * NextApiResponse 타입을 확장하여 소켓 서버를 포함.
 */
type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: IOServer<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
      >;
    };
    isHost: boolean;
  };
};

/** 게임에 참여하는 사용자 목록 */
let users: User[] = [];
let rooms: Game[] = [];

/** 초기 게임 상태 */
let gameState = {
  started: false,
  selectedCategoryMap: {} as CategoryCountMap,
  wordByUser: {} as StringMap,
  isExecutedRandom: false,
};

/**
 * 게임 상태를 초기값으로 리셋.
 */
const initialGameState = () => {
  gameState = {
    started: false,
    selectedCategoryMap: {} as CategoryCountMap,
    wordByUser: {} as StringMap,
    isExecutedRandom: false,
  };
};

/**
 * 주어진 단어 배열에서 랜덤 단어 선택.
 * @param {string[]} words - 선택할 단어 배열.
 * @returns {string} - 랜덤으로 선택된 단어.
 */
const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)];
};

/**
 * 선택된 카테고리에 따라 사용자들에게 랜덤 단어 배포.
 * @param {string} category - 단어를 선택할 카테고리.
 * @param {boolean} isExecutedRandom - 랜덤 단어 배포가 이미 실행되었는지 여부.
 */
const makeRandomWordByUsers = async (
  category: string,
  isExecutedRandom = false,
) => {
  if (isExecutedRandom) {
    return;
  }

  const filePath = path.join(process.cwd(), 'data', 'words.json');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const wordMap: StringArrayMap = JSON.parse(data);
    const words = wordMap[category];
    const commonWord = getRandomWord(words);
    words.splice(
      words.findIndex((w) => w === commonWord),
      1,
    );

    const liarIndex = Math.floor(Math.random() * users.length);
    const wordByUser: StringMap = {};
    users.forEach((user, index) => {
      if (index === liarIndex) {
        wordByUser[user.socketId] = getRandomWord(words);
      } else {
        wordByUser[user.socketId] = commonWord;
      }
    });
    console.log({ wordByUser });
    gameState.wordByUser = wordByUser;
    gameState.isExecutedRandom = true;
  } catch (e) {}
};

const getGameByRoomId = (roomId: number) => {
  return rooms.find((r) => r.getId() === roomId);
};

const getUserBySocketId = (socketId: string) => {
  return users.find((u) => u.socketId === socketId);
};

const getRoomInfos = (rooms: Game[]) => {
  console.log({ rooms });
  return rooms.map((i) => ({
    roomId: i.getId(),
    title: i.getTitle(),
    headCount: i.getHeadCount(),
  }));
};

/**
 * Socket.IO 연결 및 다양한 게임 이벤트 처리.
 * @param {NextApiRequest} req - Next.js API 요청 객체.
 * @param {NextApiResponseWithSocket} res - 소켓 서버가 확장된 Next.js API 응답 객체.
 */
const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  console.log('?');
  if (!res.socket.server.io) {
    console.log('Setting up socket');
    const io = new IOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(res.socket.server, {
      path: '/api/socket',
    });
    res.socket.server.io = io;

    io.on('connect', (socket) => {
      console.log('New connection');

      socket.on('join', (nickname: string) => {
        if (!users.find((user) => user.nickname === nickname)) {
          users.push({ nickname, socketId: socket.id });
          console.log({ users });
          const roomInfos = getRoomInfos(rooms);
          io.emit('updateRooms', roomInfos);
        }
      });

      socket.on('newRoom', (title) => {
        const newRoom = new Game(title);
        rooms.push(newRoom);

        const roomInfos = getRoomInfos(rooms);
        io.emit('updateRooms', roomInfos);
      });

      socket.on('joinRoom', (roomIdStr: string) => {
        const roomId = Number(roomIdStr);
        const user = getUserBySocketId(socket.id);
        const room = getGameByRoomId(roomId);
        if (user && room) {
          // game instance에 인원 추가
          room.addUser(user);
          // socket room에 추가
          socket.join(roomIdStr);

          const roomInfos = getRoomInfos(rooms);
          // 룸 정보
          io.emit('updateRooms', roomInfos);

          // 방 인원
          io.to(roomIdStr).emit('updateUsers', room.getUsers());

          // 방장 처리
          if (room.getHost()?.socketId === socket.id) {
            io.to(socket.id).emit('checkAuth', {
              isHost: true,
            });
          }
        }
      });

      socket.on('leaveRoom', (roomIdStr: string) => {
        const roomId = Number(roomIdStr);
        const user = getUserBySocketId(socket.id);
        const room = getGameByRoomId(roomId);
        if (user && room) {
          const wasHost = room.getHost()?.socketId === socket.id;

          room.deleteUser(user);
          socket.leave(roomIdStr);
          const roomInfos = getRoomInfos(rooms);
          // 룸 정보
          io.emit('updateRooms', roomInfos);

          // 방 인원
          io.to(roomIdStr).emit('updateUsers', room.getUsers());

          // 방장 처리
          if (wasHost) {
            const nextHost = room.getHost();
            if (!!nextHost) {
              io.to(nextHost.socketId).emit('checkAuth', {
                isHost: true,
              });
            }
          }
        }
      });

      socket.on('startGame', (roomIdStr: string) => {
        const roomId = Number(roomIdStr);
        const room = getGameByRoomId(roomId);
        if (room) {
          room.setIsStarted(true);
          io.to(roomIdStr).emit('gameStarted');
        }
      });

      socket.on('readyToSelectCategory', (roomIdStr: string) => {
        const roomId = Number(roomIdStr);
        const room = getGameByRoomId(roomId);
        if (room) {
          io.to(roomIdStr).emit('initialCategories', room.getCategories());
        }
      });

      socket.on('selectCategory', (category: string, roomIdStr: string) => {
        if (Object.keys(gameState.selectedCategoryMap).includes(category)) {
          Object.entries(gameState.selectedCategoryMap).forEach(([k, v]) => {
            if (k === category) {
              gameState.selectedCategoryMap[category] = v + 1;
            }
          });
        } else {
          gameState.selectedCategoryMap[category] = 1;
        }
        console.log({ categoryMap: gameState.selectedCategoryMap });
        io.emit('updateCategories', gameState.selectedCategoryMap);

        // 전원 투표 완료 판단
        if (
          Object.values(gameState.selectedCategoryMap).reduce(
            (acc, curr) => (acc += curr),
          ) === users.length
        ) {
          const maxCatetory = Object.entries(
            gameState.selectedCategoryMap,
          ).reduce(
            (max, curr) => {
              let newMax = max;
              if (max[1] === curr[1]) {
                newMax = [max, curr][Math.floor(Math.random() * 2)];
              } else if (max[1] < curr[1]) {
                newMax = curr;
              }
              return newMax;
            },
            ['', 0],
          );

          io.emit('successSelectCategories', maxCatetory[0]);
          makeRandomWordByUsers(maxCatetory[0], gameState.isExecutedRandom);
        }
      });

      socket.on('readyToReceiveWord', async () => {
        const socketId = socket.id;
        const userWord = gameState.wordByUser[socketId];
        io.to(socket.id).emit('assignWords', userWord);
      });

      socket.on('disconnect', () => {
        const newUsers = users.filter((u) => u.socketId !== socket.id);
        users = newUsers;
        io.emit('updateUsers', users);
        console.log({ users });
        console.log('User disconnected');
      });
    });
  } else {
    console.log('Socket is already set up');
  }
  res.end();
};

export default SocketHandler;

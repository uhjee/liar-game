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
import fs from 'fs/promises'; // Note the use of fs/promises for async file operations

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

let users: User[] = [];
let gameState = {
  started: false,
  selectedCategoryMap: {} as CategoryCountMap,
  wordByUser: {} as StringMap,
  isExecutedRandom: false,
};

const initialGameState = () => {
  gameState = {
    started: false,
    selectedCategoryMap: {} as CategoryCountMap,
    wordByUser: {} as StringMap,
    isExecutedRandom: false,
  };
};

const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)];
};

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

      /**
       * 참가자 닉네임 입력을 받았을 때 핸들러
       * @param   {[type]}  join      [join description]
       * @param   {string}  nickname  [nickname description]
       *
       * @return  {[type]}            [return description]
       */
      socket.on('join', (nickname: string) => {
        if (!users.find((user) => user.nickname === nickname)) {
          const isHost = users.length === 0;
          users.push({ nickname, isHost, socketId: socket.id });
          console.log({ users });
          if (isHost) {
            io.to(socket.id).emit('checkAuth', {
              isHost,
            });
          }
          io.emit('updateUsers', users);
        }
      });

      /**
       * 방장이 게임 시작을 눌렀을 때 핸들러
       *
       * @param   {[type]}  startGame  [startGame description]
       *
       * @return  {[type]}             [return description]
       */
      socket.on('startGame', () => {
        gameState.started = true;
        gameState.selectedCategoryMap = {};
        io.emit('gameStarted');
      });

      /**
       * 참가자들이 카테고리를 투표했을 때 핸들러
       *
       * @param   {[type]}  selectCategory  [selectCategory description]
       * @param   {string}  category        [category description]
       *
       * @return  {[type]}                  [return description]
       */
      socket.on('selectCategory', (category: string) => {
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

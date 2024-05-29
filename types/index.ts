// types/index.d.ts

export interface ServerToClientEvents {
  updateRooms: (roomInfos: RoomInfo[]) => void;
  updateUsers: (users: User[]) => void;
  checkAuth: (auth: Auth) => void;
  gameStarted: () => void;
  initialCategories: (categories: string[]) => void;
  updateCategories: (categoryMap: CategoryCountMap) => void;
  successSelectCategories: (maxCategory: string) => void;
  assignWords: (assignedWord: string) => void;
}

export interface ClientToServerEvents {
  join: (nickname: string) => void;
  newRoom: (title: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  startGame: (roomId: string) => void;
  readyToSelectCategory: (roomId: string) => void;
  readyToReceiveWord: () => void;
  selectCategory: (category: string) => void;
}

export interface User {
  nickname: string;
  isHost?: boolean;
  socketId: string;
}

export interface Auth {
  isHost: boolean;
}

export interface RoomInfo {
  roomId: number;
  title: string;
  headCount: number;
}

export interface InterServerEvents {}

export interface SocketData {
  nickname: string;
}

export interface CategoryCountMap {
  [key: string]: number;
}

export interface StringArrayMap {
  [key: string]: string[];
}

export interface StringMap {
  [key: string]: string;
}

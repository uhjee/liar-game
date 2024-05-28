// types/index.d.ts

export interface ServerToClientEvents {
  updateUsers: (users: User[]) => void;
  checkAuth: (auth: Auth) => void;
  gameStarted: () => void;
  updateCategories: (categoryMap: CategoryCountMap) => void;
  successSelectCategories: (maxCategory: string) => void;
  assignWords: (assignedWord: string) => void;
}

export interface ClientToServerEvents {
  join: (nickname: string) => void;
  startGame: () => void;
  readyToReceiveWord: () => void;
  selectCategory: (category: string) => void;
}

export interface User {
  nickname: string;
  isHost: boolean;
  socketId: string;
}

export interface Auth {
  isHost: boolean;
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

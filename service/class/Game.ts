import path from 'path';
import { CategoryCountMap, StringArrayMap, StringMap, User } from '../../types';
import fs from 'fs/promises'; // 비동기 파일 작업을 위한 fs/promises 사용

export default class Game {
  // Static property to keep track of the last used ID
  private static lastId = 0;

  // Instance property to store the unique ID
  public readonly id: number;

  private title: string;
  private wordMap: StringArrayMap = {};
  private categories: string[] = [];
  private users: User[];
  private isStarted: boolean;
  private selectCategoryMap: CategoryCountMap;
  private wordByUser: StringMap;
  private isExecutedRandom: boolean;

  constructor(title: string) {
    // Increment the last ID and assign it to the instance
    this.id = Game.generateUniqueId();

    this.title = title;
    this.users = [];
    this.isStarted = false;
    this.selectCategoryMap = {};
    this.wordByUser = {};
    this.isExecutedRandom = false;
    this.initialWordFile();
  }

  // Static method to generate a unique ID
  private static generateUniqueId(): number {
    return ++Game.lastId;
  }

  // Additional instance properties and methods can go here
  public getId(): number {
    return this.id;
  }

  // Getter and Setter for title
  public getTitle(): string {
    return this.title;
  }

  public setTitle(title: string): void {
    this.title = title;
  }

  public getWordMap(): StringArrayMap {
    return this.wordMap;
  }
  public getCategories(): string[] {
    return this.categories;
  }

  // Getter and Setter for users
  public getUsers(): User[] {
    return this.users;
  }

  public setUsers(users: User[]): void {
    this.users = users;
  }

  public getHost() {
    return this.getUsers().find((u) => u.isHost);
  }

  public addUser(user: User) {
    const isHost = this.getUsers().length === 0;
    user.isHost = isHost;
    this.users.push(user);
  }

  public deleteUser(user: User) {
    const newUsers = this.users.filter((u) => u.socketId !== user.socketId);

    if (user.isHost) {
      if (newUsers.length > 0) {
        const nextHostIndex = newUsers.findIndex((u) => !u.isHost);
        newUsers[nextHostIndex].isHost = true;
      }
    }
    this.setUsers(newUsers);
  }

  // Getter and Setter for isStarted
  public getIsStarted(): boolean {
    return this.isStarted;
  }

  public setIsStarted(isStarted: boolean): void {
    this.isStarted = isStarted;
  }

  // Getter and Setter for selectCategoryMap
  public getSelectCategoryMap(): CategoryCountMap {
    return this.selectCategoryMap;
  }

  public setSelectCategoryMap(selectCategoryMap: CategoryCountMap): void {
    this.selectCategoryMap = selectCategoryMap;
  }

  // Getter and Setter for wordByUser
  public getWordByUser(): StringMap {
    return this.wordByUser;
  }

  public setWordByUser(wordByUser: StringMap): void {
    this.wordByUser = wordByUser;
  }

  // Getter and Setter for isExecutedRandom
  public getIsExecutedRandom(): boolean {
    return this.isExecutedRandom;
  }

  public setIsExecutedRandom(isExecutedRandom: boolean): void {
    this.isExecutedRandom = isExecutedRandom;
  }

  public getHeadCount() {
    return this.users.length;
  }

  // 게임 정보 초기화
  public initialGameState() {
    this.setIsStarted(false);
    this.setSelectCategoryMap({});
    this.setWordByUser({});
    this.setIsExecutedRandom(false);
  }

  // Read and Set word json data
  private async initialWordFile() {
    const filePath = path.join(process.cwd(), 'data', 'words.json');
    const data = await fs.readFile(filePath, 'utf8');
    const newWordMap = JSON.parse(data) as StringArrayMap;
    this.wordMap = newWordMap;
    this.categories = Object.keys(newWordMap);
  }

  /**
   * 주어진 단어 배열에서 랜덤 단어 선택.
   * @param {string[]} words - 선택할 단어 배열.
   * @returns {string} - 랜덤으로 선택된 단어.
   */
  private getRandomWord = (words: string[]): string => {
    return words[Math.floor(Math.random() * words.length)];
  };

  /**
   * 선택된 카테고리에 따라 사용자들에게 랜덤 단어 배포.
   * @param {string} category - 단어를 선택할 카테고리.
   * @param {boolean} isExecutedRandom - 랜덤 단어 배포가 이미 실행되었는지 여부.
   */
  public makeRandomWordByUsers(category: string) {
    if (this.isExecutedRandom) {
      return;
    }

    const words = this.wordMap[category];
    const commonWord = this.getRandomWord(words);
    const liarIndex = Math.floor(Math.random() * this.users.length);
    const wordByUser: StringMap = {};
    this.users.forEach((user, index) => {
      if (index === liarIndex) {
        wordByUser[user.socketId] = this.getRandomWord(
          words.filter((w) => w !== commonWord),
        );
      } else {
        wordByUser[user.socketId] = commonWord;
      }
    });
    this.setWordByUser(wordByUser);
    this.setIsExecutedRandom(true);
  }
}

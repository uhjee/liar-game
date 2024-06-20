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
    const isHost = this.getUsers().filter((u) => u.isHost).length === 0;
    user.isHost = isHost;
    const newUsers = [...this.users, user];
    this.setUsers(newUsers);

    console.log({ users: this.getUsers() });
  }

  private isExistUserSocketId(socketId: string) {
    return this.users.some((u) => u.socketId === socketId);
  }

  private getUserBySocketId(socketId: string) {
    const found = this.users.find((u) => u.socketId === socketId);
    return found;
  }

  public deleteUser(socketId: string): number | null {
    if (!this.isExistUserSocketId(socketId)) {
      return null;
    }
    const newUsers = this.users.filter((u) => u.socketId !== socketId);
    if (this.getHost()?.socketId === socketId) {
      if (newUsers.length > 0) {
        newUsers[0].isHost = true;
      }
    }
    this.setUsers(newUsers);
    return newUsers.length;
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
   * 사용자 개인이 선택한 카테고리를 Map에 [카테고리명: 카운트숫자] 형태로 삽입, 수정한다.
   * @param   {string}  category  [category description]
   * @return  {boolean}            투표가 완료되었는지 여부를 반환
   */
  public voteCategory(category: string): boolean {
    const categoryMap = this.getSelectCategoryMap();
    if (Object.keys(categoryMap).includes(category)) {
      Object.entries(categoryMap).forEach(([k, v]) => {
        if (k === category) {
          categoryMap[category] = v + 1;
        }
      });
    } else {
      categoryMap[category] = 1;
    }
    this.setSelectCategoryMap(categoryMap);

    const isAllVoted = this.isAllVotedCategory();
    if (isAllVoted) {
      console.log({ isAllVoted });
      this.makeRandomWordByUsers(this.getMaxCountCategory());
    }
    return isAllVoted;
  }

  /**
   * 모든 참가자들이 카테고리를 선택했는지 여부를 반환한다.
   * @return  {boolean} [return description]
   */
  public isAllVotedCategory(): boolean {
    return (
      Object.values(this.getSelectCategoryMap()).reduce(
        (acc, curr) => (acc += curr),
      ) === this.getUsers().length
    );
  }

  /**
   * 투표된 카테고리 중 가장 높은 투표를 반은 카테고리를 반환한다.
   * max 카테고리가 2개 이상일 경우, 그 중 랜덤으로 반환한다.
   * @return  {string}  [return description]
   */
  public getMaxCountCategory(): string {
    const maxCatetoryEntry = Object.entries(this.getSelectCategoryMap()).reduce(
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
    return maxCatetoryEntry[0];
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
    console.log({ wordByUser });
    this.setWordByUser(wordByUser);
    this.setIsExecutedRandom(true);
  }

  /**
   * 특정 socketId(유저)의 word를 반환한다.
   * @param   {string}  socketId  [socketId description]
   * @return  {[type]}            [return description]
   */
  public getWordBySocketId(socketId: string) {
    return this.getWordByUser()[socketId];
  }
}

// React Native環境用のデータベースラッパー
import { nativeStorage } from './nativeStorage';

export class NativeDatabase {
  private static instance: NativeDatabase;
  
  private constructor() {}

  static getInstance(): NativeDatabase {
    if (!NativeDatabase.instance) {
      NativeDatabase.instance = new NativeDatabase();
    }
    return NativeDatabase.instance;
  }

  // 初期化は自動で行われる
  async seedData(): Promise<void> {
    return nativeStorage.seedData();
  }

  // Users
  async getUsers(userId?: string): Promise<any[]> {
    return nativeStorage.getUsers(userId);
  }

  // Videos
  async getVideos(userId: string): Promise<any[]> {
    return nativeStorage.getVideos(userId);
  }

  async getVideoById(id: string): Promise<any> {
    return nativeStorage.getVideoById(id);
  }

  async createVideo(video: any): Promise<void> {
    return nativeStorage.createVideo(video);
  }

  // Memos
  async getMemos(userId: string, videoId?: string): Promise<any[]> {
    return nativeStorage.getMemos(userId, videoId);
  }

  async createMemo(memo: any): Promise<void> {
    return nativeStorage.createMemo(memo);
  }

  async deleteMemo(id: string): Promise<void> {
    return nativeStorage.deleteMemo(id);
  }

  // Tasks
  async getTasks(userId: string): Promise<any[]> {
    return nativeStorage.getTasks(userId);
  }

  async createTask(task: any): Promise<void> {
    return nativeStorage.createTask(task);
  }

  async updateTask(id: string, updates: any): Promise<void> {
    return nativeStorage.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<void> {
    return nativeStorage.deleteTask(id);
  }

  // Utility
  async clearAllData(): Promise<void> {
    return nativeStorage.clearAllData();
  }
}
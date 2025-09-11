import { webStorage } from './webStorage';

// Web-only database implementation that mirrors the Database class interface
export class WebDatabase {
  private static instance: WebDatabase;
  
  private constructor() {
    // No initialization needed for web storage
  }

  static getInstance(): WebDatabase {
    if (!WebDatabase.instance) {
      WebDatabase.instance = new WebDatabase();
    }
    return WebDatabase.instance;
  }

  // Seed initial data
  async seedData() {
    return webStorage.seedData();
  }

  // User operations
  async createUser(user: any): Promise<void> {
    return webStorage.createUser(user);
  }

  async getUserById(id: string): Promise<any> {
    return webStorage.getUserById(id);
  }

  // Video operations
  async createVideo(video: any): Promise<void> {
    return webStorage.createVideo(video);
  }

  async getVideos(userId: string): Promise<any[]> {
    return webStorage.getVideos(userId);
  }

  async getVideoById(id: string): Promise<any> {
    return webStorage.getVideoById(id);
  }

  // Memo operations
  async createMemo(memo: any): Promise<void> {
    return webStorage.createMemo(memo);
  }

  async getMemos(userId: string, videoId?: string): Promise<any[]> {
    return webStorage.getMemos(userId, videoId);
  }

  async deleteMemo(id: string): Promise<void> {
    return webStorage.deleteMemo(id);
  }

  // Task operations
  async createTask(task: any): Promise<void> {
    return webStorage.createTask(task);
  }

  async getTasks(userId: string): Promise<any[]> {
    return webStorage.getTasks(userId);
  }

  async updateTask(id: string, updates: any): Promise<void> {
    return webStorage.updateTask(id, updates);
  }

  // Clear all data (for development/testing)
  async clearAllData(): Promise<void> {
    return webStorage.clearAllData();
  }
}
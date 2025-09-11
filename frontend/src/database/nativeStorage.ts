// React Native環境用のAsyncStorageベースのデータストレージ
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageData {
  users: any[];
  videos: any[];
  memos: any[];
  tasks: any[];
  viewing_sessions: any[];
}

const STORAGE_KEY = '@mindful_replay_data';

class NativeStorage {
  private data: StorageData = {
    users: [],
    videos: [],
    memos: [],
    tasks: [],
    viewing_sessions: [],
  };

  private initialized = false;

  constructor() {
    this.initializeAsync();
  }

  private async initializeAsync() {
    if (this.initialized) return;
    
    try {
      console.log('[NativeStorage] Loading data from AsyncStorage...');
      await this.loadFromAsyncStorage();
      
      // 初期データが無い場合はシードデータを作成
      if (this.data.users.length === 0) {
        console.log('[NativeStorage] Creating seed data...');
        this.seedInitialData();
        await this.saveToAsyncStorage();
      }
      
      this.initialized = true;
      console.log('[NativeStorage] Initialization completed');
    } catch (error) {
      console.error('[NativeStorage] Initialization failed:', error);
      // エラーが発生した場合はメモリ内でシードデータを作成
      this.seedInitialData();
      this.initialized = true;
    }
  }

  private async loadFromAsyncStorage() {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        this.data = JSON.parse(storedData);
        console.log('[NativeStorage] Data loaded from AsyncStorage');
      }
    } catch (error) {
      console.error('[NativeStorage] Failed to load from AsyncStorage:', error);
    }
  }

  private async saveToAsyncStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      console.log('[NativeStorage] Data saved to AsyncStorage');
    } catch (error) {
      console.error('[NativeStorage] Failed to save to AsyncStorage:', error);
    }
  }

  private seedInitialData() {
    const now = new Date().toISOString();
    
    // Users
    this.data.users = [
      {
        id: 'user_demo',
        email: 'demo@mindfulreplay.com',
        username: 'demo_user',
        display_name: 'Demo User',
        created_at: now,
        updated_at: now,
      }
    ];

    // Videos
    this.data.videos = [
      {
        id: 'video_1',
        user_id: 'user_demo',
        youtube_id: 'dQw4w9WgXcQ',
        youtube_url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'サンプル動画1: プログラミング学習のコツ',
        description: 'プログラミング学習を効率的に進めるための基本的なコツを解説します。',
        thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: 240,
        channel_name: 'プログラミング学習チャンネル',
        published_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'video_2',
        user_id: 'user_demo',
        youtube_id: 'jNQXAC9IVRw',
        youtube_url: 'https://youtu.be/jNQXAC9IVRw',
        title: 'サンプル動画2: React Native開発入門',
        description: 'React Nativeを使ったモバイルアプリ開発の基礎を学びます。',
        thumbnail_url: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
        duration: 360,
        channel_name: 'モバイル開発ガイド',
        published_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'video_3',
        user_id: 'user_demo',
        youtube_id: 'ZK3O402wf1c',
        youtube_url: 'https://youtu.be/ZK3O402wf1c',
        title: 'サンプル動画3: TypeScript実践テクニック',
        description: 'TypeScriptを実際のプロジェクトで活用するための実践的なテクニック。',
        thumbnail_url: 'https://img.youtube.com/vi/ZK3O402wf1c/maxresdefault.jpg',
        duration: 180,
        channel_name: 'TypeScript Masters',
        published_at: now,
        created_at: now,
        updated_at: now,
      }
    ];

    // Memos
    this.data.memos = [
      {
        id: 'memo_1',
        user_id: 'user_demo',
        video_id: 'video_1',
        content: '変数名は分かりやすく命名することが重要',
        timestamp_sec: 120,
        memo_type: 'insight',
        importance: 'high',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'memo_2',
        user_id: 'user_demo',
        video_id: 'video_1',
        content: 'コードレビューは品質向上に欠かせない',
        timestamp_sec: 180,
        memo_type: 'insight',
        importance: 'medium',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'memo_3',
        user_id: 'user_demo',
        video_id: 'video_2',
        content: 'React Navigationの使い方を復習する',
        timestamp_sec: 90,
        memo_type: 'todo',
        importance: 'medium',
        created_at: now,
        updated_at: now,
      }
    ];

    // Tasks
    this.data.tasks = [
      {
        id: 'task_1',
        user_id: 'user_demo',
        memo_id: 'memo_3',
        video_id: 'video_2',
        title: 'React Navigation公式ドキュメントを読む',
        description: 'React Navigationの最新バージョンのドキュメントを読んで理解を深める',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_2',
        user_id: 'user_demo',
        memo_id: 'memo_1',
        video_id: 'video_1',
        title: '変数命名規則をチームで統一する',
        description: 'プロジェクトの変数命名規則を明文化し、チーム内で共有する',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: now,
        updated_at: now,
      }
    ];

    console.log('[NativeStorage] Seed data created');
  }

  // 初期化完了を待つヘルパーメソッド
  async waitForInitialization(): Promise<void> {
    if (this.initialized) return;
    
    return new Promise((resolve) => {
      const checkInit = () => {
        if (this.initialized) {
          resolve();
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
  }

  // データアクセスメソッド
  async getUsers(userId?: string): Promise<any[]> {
    await this.waitForInitialization();
    return userId ? this.data.users.filter(u => u.id === userId) : this.data.users;
  }

  async getVideos(userId: string): Promise<any[]> {
    await this.waitForInitialization();
    return this.data.videos.filter(v => v.user_id === userId);
  }

  async getVideoById(id: string): Promise<any> {
    await this.waitForInitialization();
    const video = this.data.videos.find(v => v.id === id);
    if (!video) throw new Error('Video not found');
    return video;
  }

  async createVideo(video: any): Promise<void> {
    await this.waitForInitialization();
    this.data.videos.push({ ...video, id: video.id || `video_${Date.now()}` });
    await this.saveToAsyncStorage();
  }

  async getMemos(userId: string, videoId?: string): Promise<any[]> {
    await this.waitForInitialization();
    let memos = this.data.memos.filter(m => m.user_id === userId);
    if (videoId) {
      memos = memos.filter(m => m.video_id === videoId);
    }
    return memos;
  }

  async createMemo(memo: any): Promise<void> {
    await this.waitForInitialization();
    this.data.memos.unshift({ ...memo, id: memo.id || `memo_${Date.now()}` });
    await this.saveToAsyncStorage();
  }

  async deleteMemo(id: string): Promise<void> {
    await this.waitForInitialization();
    this.data.memos = this.data.memos.filter(m => m.id !== id);
    await this.saveToAsyncStorage();
  }

  async getTasks(userId: string): Promise<any[]> {
    await this.waitForInitialization();
    return this.data.tasks.filter(t => t.user_id === userId);
  }

  async createTask(task: any): Promise<void> {
    await this.waitForInitialization();
    this.data.tasks.unshift({ ...task, id: task.id || `task_${Date.now()}` });
    await this.saveToAsyncStorage();
  }

  async updateTask(id: string, updates: any): Promise<void> {
    await this.waitForInitialization();
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.tasks[index] = { ...this.data.tasks[index], ...updates };
      await this.saveToAsyncStorage();
    }
  }

  async deleteTask(id: string): Promise<void> {
    await this.waitForInitialization();
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    await this.saveToAsyncStorage();
  }

  async clearAllData(): Promise<void> {
    this.data = {
      users: [],
      videos: [],
      memos: [],
      tasks: [],
      viewing_sessions: [],
    };
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[NativeStorage] All data cleared');
  }

  async seedData(): Promise<void> {
    await this.waitForInitialization();
    // データがすでにある場合は何もしない
    if (this.data.users.length > 0) {
      console.log('[NativeStorage] Data already exists, skipping seed');
      return;
    }
    this.seedInitialData();
    await this.saveToAsyncStorage();
  }
}

export const nativeStorage = new NativeStorage();
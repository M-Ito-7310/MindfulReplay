// Web環境用のインメモリデータストレージ
interface StorageData {
  users: any[];
  videos: any[];
  memos: any[];
  tasks: any[];
  viewing_sessions: any[];
}

class WebStorage {
  private data: StorageData = {
    users: [],
    videos: [],
    memos: [],
    tasks: [],
    viewing_sessions: [],
  };

  constructor() {
    // LocalStorageから既存データを読み込み
    this.loadFromLocalStorage();
    
    // 初期データが無い場合はシードデータを作成
    if (this.data.users.length === 0) {
      this.seedInitialData();
    }
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('mindfulreplay_data');
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('mindfulreplay_data', JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private seedInitialData() {
    const now = new Date().toISOString();
    
    // デモユーザー
    this.data.users.push({
      id: 'user_demo',
      email: 'demo@example.com',
      username: 'demo',
      display_name: 'デモユーザー',
      created_at: now,
      updated_at: now,
    });

    // サンプル動画
    this.data.videos.push(
      {
        id: 'video_1',
        user_id: 'user_demo',
        youtube_id: 'dQw4w9WgXcQ',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'プロダクティビティ向上のコツ - 効率的な仕事術',
        description: '仕事の効率を劇的に向上させる実践的なテクニックを紹介します',
        thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: 600,
        channel_name: 'Productivity Master',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'video_2',
        user_id: 'user_demo',
        youtube_id: 'jNQXAC9IVRw',
        youtube_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        title: 'マインドフルネス瞑想入門 - 初心者向けガイド',
        description: '日常生活に取り入れやすいマインドフルネス瞑想の基本を学びます',
        thumbnail_url: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
        duration: 900,
        channel_name: 'Mindfulness Journey',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'video_3',
        user_id: 'user_demo',
        youtube_id: '9bZkp7q19f0',
        youtube_url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        title: 'タイムマネジメントの極意',
        description: '限られた時間を最大限に活用する方法',
        thumbnail_url: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
        duration: 720,
        channel_name: 'Time Management Pro',
        created_at: now,
        updated_at: now,
      }
    );

    // サンプルメモ
    this.data.memos.push(
      {
        id: 'memo_1',
        user_id: 'user_demo',
        video_id: 'video_1',
        content: 'ポモドーロテクニックを試してみる。25分集中、5分休憩のサイクル。',
        timestamp_sec: 120,
        memo_type: 'action',
        importance: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'memo_2',
        user_id: 'user_demo',
        video_id: 'video_2',
        content: '呼吸に意識を向けることで、今この瞬間に集中できる。',
        timestamp_sec: 300,
        memo_type: 'insight',
        importance: 5,
        created_at: now,
        updated_at: now,
      }
    );

    this.saveToLocalStorage();
  }

  // User operations
  async createUser(user: any): Promise<void> {
    const now = new Date().toISOString();
    this.data.users.push({
      ...user,
      created_at: now,
      updated_at: now,
    });
    this.saveToLocalStorage();
  }

  async getUserById(id: string): Promise<any> {
    const user = this.data.users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Video operations
  async createVideo(video: any): Promise<void> {
    const now = new Date().toISOString();
    this.data.videos.push({
      ...video,
      created_at: now,
      updated_at: now,
    });
    this.saveToLocalStorage();
  }

  async getVideos(userId: string): Promise<any[]> {
    return this.data.videos
      .filter(v => v.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getVideoById(id: string): Promise<any> {
    const video = this.data.videos.find(v => v.id === id);
    if (!video) {
      throw new Error('Video not found');
    }
    return video;
  }

  // Memo operations
  async createMemo(memo: any): Promise<void> {
    const now = new Date().toISOString();
    const id = memo.id || `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.data.memos.push({
      ...memo,
      id,
      memo_type: memo.memo_type || 'insight',
      importance: memo.importance || 3,
      created_at: now,
      updated_at: now,
    });
    this.saveToLocalStorage();
  }

  async getMemos(userId: string, videoId?: string): Promise<any[]> {
    let memos = this.data.memos.filter(m => m.user_id === userId);
    
    if (videoId) {
      memos = memos.filter(m => m.video_id === videoId);
    }
    
    return memos.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async deleteMemo(id: string): Promise<void> {
    console.log('[WebStorage] deleteMemo called with id:', id);
    console.log('[WebStorage] Current memos:', this.data.memos);
    
    const index = this.data.memos.findIndex(m => m.id === id);
    console.log('[WebStorage] Memo index found:', index);
    
    if (index === -1) {
      console.error('[WebStorage] Memo not found with id:', id);
      throw new Error('Memo not found');
    }
    
    this.data.memos.splice(index, 1);
    console.log('[WebStorage] Memo removed, saving to localStorage');
    this.saveToLocalStorage();
    console.log('[WebStorage] Memo deleted successfully');
  }

  // Task operations
  async createTask(task: any): Promise<void> {
    const now = new Date().toISOString();
    const id = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.data.tasks.push({
      ...task,
      id,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      created_at: now,
      updated_at: now,
    });
    this.saveToLocalStorage();
  }

  async getTasks(userId: string): Promise<any[]> {
    return this.data.tasks
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async updateTask(id: string, updates: any): Promise<void> {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }
    
    this.data.tasks[index] = {
      ...this.data.tasks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToLocalStorage();
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    this.data = {
      users: [],
      videos: [],
      memos: [],
      tasks: [],
      viewing_sessions: [],
    };
    localStorage.removeItem('mindfulreplay_data');
  }

  // Seed data (idempotent)
  async seedData(): Promise<void> {
    if (this.data.users.length === 0) {
      this.seedInitialData();
    }
  }
}

export const webStorage = new WebStorage();
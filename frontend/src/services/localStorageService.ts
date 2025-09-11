import { database } from '@/database';
import { Video, Memo, Task, User, ApiResponse } from '@/types';

// 現在のユーザーID（実際のアプリではAuthから取得）
const getCurrentUserId = () => 'user_demo';

class LocalStorageService {
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      console.log('[LocalStorage] Initializing database...');
      try {
        // Initialize database without automatic seed data
        await database.seedData(); // This now only creates the demo user
        this.initialized = true;
        console.log('[LocalStorage] Database initialized successfully - ready for real data');
      } catch (error) {
        console.error('[LocalStorage] Database initialization failed:', error);
        throw error;
      }
    }
  }

  // Video operations
  async getVideos(): Promise<ApiResponse<{ items: Video[] }>> {
    try {
      await this.initialize();
      const userId = getCurrentUserId();
      const videos = await database.getVideos(userId);
      
      return {
        success: true,
        data: {
          items: videos.map(this.formatVideo),
        },
      };
    } catch (error) {
      console.error('Failed to get videos:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: '動画の取得に失敗しました',
        },
      };
    }
  }

  async getVideoById(id: string): Promise<ApiResponse<Video>> {
    try {
      await this.initialize();
      const video = await database.getVideoById(id);
      
      return {
        success: true,
        data: this.formatVideo(video),
      };
    } catch (error) {
      console.error('Failed to get video:', error);
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '動画が見つかりません',
        },
      };
    }
  }

  async createVideo(videoData: any): Promise<ApiResponse<{ video: Video }>> {
    try {
      await this.initialize();
      const userId = getCurrentUserId();
      const id = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const video = {
        ...videoData,
        id,
        user_id: userId,
      };
      
      await database.createVideo(video);
      const created = await database.getVideoById(id);
      
      return {
        success: true,
        data: {
          video: this.formatVideo(created),
        },
      };
    } catch (error) {
      console.error('Failed to create video:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: '動画の保存に失敗しました',
        },
      };
    }
  }

  // Memo operations
  async getMemos(videoId?: string): Promise<ApiResponse<{ items: Memo[] }>> {
    try {
      await this.initialize();
      const userId = getCurrentUserId();
      const memos = await database.getMemos(userId, videoId);
      
      return {
        success: true,
        data: {
          items: memos.map(this.formatMemo),
        },
      };
    } catch (error) {
      console.error('Failed to get memos:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'メモの取得に失敗しました',
        },
      };
    }
  }

  async getMemoById(id: string): Promise<ApiResponse<Memo>> {
    try {
      await this.initialize();
      const userId = getCurrentUserId();
      const memos = await database.getMemos(userId);
      const memo = memos.find(m => m.id === id);
      
      if (!memo) {
        throw new Error('Memo not found');
      }
      
      return {
        success: true,
        data: this.formatMemo(memo),
      };
    } catch (error) {
      console.error('Failed to get memo:', error);
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'メモが見つかりません',
        },
      };
    }
  }

  async createMemo(memoData: any): Promise<ApiResponse<Memo>> {
    try {
      await this.initialize();
      const userId = getCurrentUserId();
      
      const memo = {
        ...memoData,
        user_id: userId,
        video_id: memoData.videoId, // API互換性のため変換
      };
      
      await database.createMemo(memo);
      
      // 作成されたメモを返す（IDは自動生成される）
      const memos = await database.getMemos(userId);
      const created = memos[0]; // 最新のメモ
      
      return {
        success: true,
        data: this.formatMemo(created),
      };
    } catch (error) {
      console.error('Failed to create memo:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'メモの保存に失敗しました',
        },
      };
    }
  }

  async deleteMemo(id: string): Promise<ApiResponse<void>> {
    try {
      await this.initialize();
      await database.deleteMemo(id);
      
      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Failed to delete memo:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'メモの削除に失敗しました',
        },
      };
    }
  }

  // Task operations
  async getTasks(): Promise<ApiResponse<{ items: Task[] }>> {
    try {
      await this.initialize();
      const userId = getCurrentUserId();
      const tasks = await database.getTasks(userId);
      
      return {
        success: true,
        data: {
          items: tasks.map(this.formatTask),
        },
      };
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'タスクの取得に失敗しました',
        },
      };
    }
  }

  async createTask(taskData: any): Promise<ApiResponse<Task>> {
    try {
      await this.initialize();
      const userId = getCurrentUserId();
      
      const task = {
        ...taskData,
        user_id: userId,
      };
      
      await database.createTask(task);
      
      // 作成されたタスクを返す
      const tasks = await database.getTasks(userId);
      const created = tasks[0]; // 最新のタスク
      
      return {
        success: true,
        data: this.formatTask(created),
      };
    } catch (error) {
      console.error('Failed to create task:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'タスクの保存に失敗しました',
        },
      };
    }
  }

  async updateTask(id: string, updates: any): Promise<ApiResponse<Task>> {
    try {
      await this.initialize();
      await database.updateTask(id, updates);
      
      const tasks = await database.getTasks(getCurrentUserId());
      const updated = tasks.find(t => t.id === id);
      
      return {
        success: true,
        data: this.formatTask(updated),
      };
    } catch (error) {
      console.error('Failed to update task:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'タスクの更新に失敗しました',
        },
      };
    }
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    try {
      await this.initialize();
      await database.deleteTask(id);
      
      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      console.error('Failed to delete task:', error);
      return {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'タスクの削除に失敗しました',
        },
      };
    }
  }

  // Format helpers
  private formatVideo(video: any): Video {
    return {
      id: video.id,
      user_id: video.user_id,
      youtube_id: video.youtube_id,
      youtube_url: video.youtube_url,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      duration: video.duration,
      channel_name: video.channel_name,
      published_at: video.published_at,
      created_at: video.created_at,
      updated_at: video.updated_at,
    };
  }

  private formatMemo(memo: any): Memo {
    return {
      id: memo.id,
      user_id: memo.user_id,
      video_id: memo.video_id,
      content: memo.content,
      timestamp_sec: memo.timestamp_sec,
      memo_type: memo.memo_type as any,
      importance: memo.importance as any,
      created_at: memo.created_at,
      updated_at: memo.updated_at,
    };
  }

  private formatTask(task: any): Task {
    return {
      id: task.id,
      user_id: task.user_id,
      memo_id: task.memo_id,
      video_id: task.video_id,
      title: task.title,
      description: task.description,
      status: task.status as any,
      priority: task.priority as any,
      due_date: task.due_date,
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
  }

  // Development helpers
  async clearAllData(): Promise<void> {
    await database.clearAllData();
    this.initialized = false;
  }

}

export const localStorageService = new LocalStorageService();
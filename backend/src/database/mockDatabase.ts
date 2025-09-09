import { v4 as uuidv4 } from 'uuid';

// Mock data interfaces matching our PostgreSQL schema
export interface MockUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockVideo {
  id: string;
  user_id: string;
  youtube_id: string;
  youtube_url: string;
  title: string;
  thumbnail_url?: string;
  description?: string;
  duration?: number;
  channel_name?: string;
  published_at?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MockMemo {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  timestamp_sec?: number;
  created_at: Date;
  updated_at: Date;
}

export interface MockTask {
  id: string;
  user_id: string;
  memo_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MockReminder {
  id: string;
  user_id: string;
  memo_id?: string;
  task_id?: string;
  title: string;
  scheduled_for: Date;
  interval_days?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MockTag {
  id: string;
  name: string;
  color?: string;
  created_at: Date;
  updated_at: Date;
}

// In-memory storage
class MockDatabase {
  private users: Map<string, MockUser> = new Map();
  private videos: Map<string, MockVideo> = new Map();
  private memos: Map<string, MockMemo> = new Map();
  private tasks: Map<string, MockTask> = new Map();
  private reminders: Map<string, MockReminder> = new Map();
  private tags: Map<string, MockTag> = new Map();
  
  // User operations
  createUser(userData: Omit<MockUser, 'id' | 'created_at' | 'updated_at'>): MockUser {
    const user: MockUser = {
      id: uuidv4(),
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  getUserByEmail(email: string): MockUser | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  getUserById(id: string): MockUser | undefined {
    return this.users.get(id);
  }

  updateUser(id: string, updates: Partial<MockUser>): MockUser | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updated_at: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Video operations
  createVideo(videoData: Omit<MockVideo, 'id' | 'created_at' | 'updated_at'>): MockVideo {
    const video: MockVideo = {
      id: uuidv4(),
      ...videoData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.videos.set(video.id, video);
    return video;
  }

  getVideosByUserId(userId: string): MockVideo[] {
    return Array.from(this.videos.values())
      .filter(video => video.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  getVideoById(id: string): MockVideo | undefined {
    return this.videos.get(id);
  }

  updateVideo(id: string, updates: Partial<MockVideo>): MockVideo | undefined {
    const video = this.videos.get(id);
    if (!video) return undefined;

    const updatedVideo = {
      ...video,
      ...updates,
      updated_at: new Date()
    };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  deleteVideo(id: string): boolean {
    return this.videos.delete(id);
  }

  // Memo operations
  createMemo(memoData: Omit<MockMemo, 'id' | 'created_at' | 'updated_at'>): MockMemo {
    const memo: MockMemo = {
      id: uuidv4(),
      ...memoData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.memos.set(memo.id, memo);
    return memo;
  }

  getMemosByUserId(userId: string): MockMemo[] {
    return Array.from(this.memos.values())
      .filter(memo => memo.user_id === userId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  getMemosByVideoId(videoId: string): MockMemo[] {
    return Array.from(this.memos.values())
      .filter(memo => memo.video_id === videoId)
      .sort((a, b) => (a.timestamp_sec || 0) - (b.timestamp_sec || 0));
  }

  getMemoById(id: string): MockMemo | undefined {
    return this.memos.get(id);
  }

  updateMemo(id: string, updates: Partial<MockMemo>): MockMemo | undefined {
    const memo = this.memos.get(id);
    if (!memo) return undefined;

    const updatedMemo = {
      ...memo,
      ...updates,
      updated_at: new Date()
    };
    this.memos.set(id, updatedMemo);
    return updatedMemo;
  }

  deleteMemo(id: string): boolean {
    return this.memos.delete(id);
  }

  // Task operations
  createTask(taskData: Omit<MockTask, 'id' | 'created_at' | 'updated_at'>): MockTask {
    const task: MockTask = {
      id: uuidv4(),
      ...taskData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.tasks.set(task.id, task);
    return task;
  }

  getTasksByUserId(userId: string): MockTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.user_id === userId)
      .sort((a, b) => {
        // Sort by priority first, then by due date, then by created date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        if (a.due_date && b.due_date) {
          return a.due_date.getTime() - b.due_date.getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        
        return b.created_at.getTime() - a.created_at.getTime();
      });
  }

  getTaskById(id: string): MockTask | undefined {
    return this.tasks.get(id);
  }

  updateTask(id: string, updates: Partial<MockTask>): MockTask | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = {
      ...task,
      ...updates,
      updated_at: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  // Reminder operations
  createReminder(reminderData: Omit<MockReminder, 'id' | 'created_at' | 'updated_at'>): MockReminder {
    const reminder: MockReminder = {
      id: uuidv4(),
      ...reminderData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  getRemindersByUserId(userId: string): MockReminder[] {
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.user_id === userId)
      .sort((a, b) => a.scheduled_for.getTime() - b.scheduled_for.getTime());
  }

  getReminderById(id: string): MockReminder | undefined {
    return this.reminders.get(id);
  }

  updateReminder(id: string, updates: Partial<MockReminder>): MockReminder | undefined {
    const reminder = this.reminders.get(id);
    if (!reminder) return undefined;

    const updatedReminder = {
      ...reminder,
      ...updates,
      updated_at: new Date()
    };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  deleteReminder(id: string): boolean {
    return this.reminders.delete(id);
  }

  // Tag operations
  createTag(tagData: Omit<MockTag, 'id' | 'created_at' | 'updated_at'>): MockTag {
    const tag: MockTag = {
      id: uuidv4(),
      ...tagData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  getAllTags(): MockTag[] {
    return Array.from(this.tags.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getTagById(id: string): MockTag | undefined {
    return this.tags.get(id);
  }

  updateTag(id: string, updates: Partial<MockTag>): MockTag | undefined {
    const tag = this.tags.get(id);
    if (!tag) return undefined;

    const updatedTag = {
      ...tag,
      ...updates,
      updated_at: new Date()
    };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  deleteTag(id: string): boolean {
    return this.tags.delete(id);
  }

  // Utility methods
  clear(): void {
    this.users.clear();
    this.videos.clear();
    this.memos.clear();
    this.tasks.clear();
    this.reminders.clear();
    this.tags.clear();
  }

  // Get counts for dashboard
  getCounts(userId: string) {
    return {
      videos: this.getVideosByUserId(userId).length,
      memos: this.getMemosByUserId(userId).length,
      tasks: this.getTasksByUserId(userId).length,
      reminders: this.getRemindersByUserId(userId).filter(r => r.is_active).length
    };
  }
}

// Singleton instance
export const mockDb = new MockDatabase();
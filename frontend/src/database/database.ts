// Native-only database implementation using SQLite
let db: any = null;

try {
  const SQLite = require('expo-sqlite');
  // Expo SDK 54+ uses openDatabaseAsync
  if (SQLite.openDatabaseAsync) {
    console.log('[Database] Using new Expo SQLite API (SDK 54+)');
    SQLite.openDatabaseAsync('mindfulreplay.db').then((database: any) => {
      db = database;
      console.log('[Database] SQLite database opened successfully');
    }).catch((error: any) => {
      console.error('[Database] Failed to open SQLite database:', error);
    });
  } else if (SQLite.openDatabase) {
    console.log('[Database] Using legacy Expo SQLite API');
    db = SQLite.openDatabase('mindfulreplay.db');
  } else {
    throw new Error('No compatible SQLite API found');
  }
} catch (error) {
  console.error('SQLite initialization failed:', error);
}

export class Database {
  private static instance: Database;
  
  private constructor() {
    if (db) {
      this.initDatabase();
    }
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private initDatabase() {
    if (!db) return;
    
    db.transaction(tx => {
      // Users table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          display_name TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );

      // Videos table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          youtube_id TEXT NOT NULL,
          youtube_url TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          thumbnail_url TEXT,
          duration INTEGER,
          channel_name TEXT,
          published_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // Memos table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS memos (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          video_id TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp_sec INTEGER,
          memo_type TEXT,
          importance INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (video_id) REFERENCES videos (id)
        );`
      );

      // Tasks table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          memo_id TEXT,
          video_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          priority TEXT NOT NULL DEFAULT 'medium',
          due_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (memo_id) REFERENCES memos (id),
          FOREIGN KEY (video_id) REFERENCES videos (id)
        );`
      );

      // ViewingSessions table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS viewing_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          video_id TEXT NOT NULL,
          watch_duration INTEGER NOT NULL,
          pause_count INTEGER DEFAULT 0,
          rewind_count INTEGER DEFAULT 0,
          engagement_level INTEGER,
          created_at TEXT NOT NULL,
          completed_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (video_id) REFERENCES videos (id)
        );`
      );

      // Create indexes for performance
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos (user_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_memos_user_id ON memos (user_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_memos_video_id ON memos (video_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_viewing_sessions_user_id ON viewing_sessions (user_id);');
    });
  }

  // Initialize database without seed data
  async seedData() {
    const defaultUserId = 'user_demo';
    
    // Check if demo user exists, create if not found
    await this.getUserById(defaultUserId).catch(async () => {
      // Create demo user only (no sample content)
      await this.createUser({
        id: defaultUserId,
        email: 'demo@example.com',
        username: 'demo',
        display_name: 'デモユーザー',
      });

      console.log('Demo user created successfully - no sample data generated');
    });
  }

  // User operations
  async createUser(user: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO users (id, email, username, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.email, user.username, user.display_name || null, now, now],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUserById(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0));
            } else {
              reject(new Error('User not found'));
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Video operations
  async createVideo(video: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO videos (
            id, user_id, youtube_id, youtube_url, title, description, 
            thumbnail_url, duration, channel_name, published_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            video.id,
            video.user_id,
            video.youtube_id,
            video.youtube_url,
            video.title,
            video.description || null,
            video.thumbnail_url || null,
            video.duration || null,
            video.channel_name || null,
            video.published_at || null,
            now,
            now
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getVideos(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC',
          [userId],
          (_, { rows }) => {
            const videos = [];
            for (let i = 0; i < rows.length; i++) {
              videos.push(rows.item(i));
            }
            resolve(videos);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getVideoById(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM videos WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows.item(0));
            } else {
              reject(new Error('Video not found'));
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Memo operations
  async createMemo(memo: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const id = memo.id || `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO memos (
            id, user_id, video_id, content, timestamp_sec, 
            memo_type, importance, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            memo.user_id,
            memo.video_id,
            memo.content,
            memo.timestamp_sec || null,
            memo.memo_type || 'insight',
            memo.importance || 3,
            now,
            now
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getMemos(userId: string, videoId?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM memos WHERE user_id = ?';
      const params = [userId];
      
      if (videoId) {
        query += ' AND video_id = ?';
        params.push(videoId);
      }
      
      query += ' ORDER BY created_at DESC';
      
      db.transaction(tx => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const memos = [];
            for (let i = 0; i < rows.length; i++) {
              memos.push(rows.item(i));
            }
            resolve(memos);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteMemo(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM memos WHERE id = ?',
          [id],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Task operations
  async createTask(task: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const id = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO tasks (
            id, user_id, memo_id, video_id, title, description, 
            status, priority, due_date, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            task.user_id,
            task.memo_id || null,
            task.video_id || null,
            task.title,
            task.description || null,
            task.status || 'pending',
            task.priority || 'medium',
            task.due_date || null,
            now,
            now
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getTasks(userId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
          [userId],
          (_, { rows }) => {
            const tasks = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(rows.item(i));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateTask(id: string, updates: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const fields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        if (key !== 'id' && key !== 'created_at') {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });
      
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);
      
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
          values,
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteTask(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM tasks WHERE id = ?',
          [id],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Clear all data (for development/testing)
  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql('DELETE FROM viewing_sessions', [], 
          () => tx.executeSql('DELETE FROM tasks', [],
            () => tx.executeSql('DELETE FROM memos', [],
              () => tx.executeSql('DELETE FROM videos', [],
                () => tx.executeSql('DELETE FROM users', [],
                  () => resolve(),
                  (_, error) => { reject(error); return false; }
                ),
                (_, error) => { reject(error); return false; }
              ),
              (_, error) => { reject(error); return false; }
            ),
            (_, error) => { reject(error); return false; }
          ),
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }
}

export const database = Database.getInstance();
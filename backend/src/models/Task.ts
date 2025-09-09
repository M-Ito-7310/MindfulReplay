import db from '../database/connection';
import { Task } from '../types/database';

export interface TaskWithDetails extends Task {
  memo?: {
    id: string;
    content: string;
    timestamp_seconds: number | null;
  };
  video?: {
    id: string;
    title: string;
    youtube_id: string;
    thumbnail_url: string | null;
  };
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export class TaskModel {
  static async create(taskData: {
    user_id: string;
    title: string;
    description?: string | null;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: Date | null;
    memo_id?: string | null;
    video_id?: string | null;
  }): Promise<Task> {
    const [task] = await db('tasks')
      .insert({
        ...taskData,
        priority: taskData.priority || 'medium',
        status: 'pending'
      })
      .returning('*');

    return task;
  }

  static async findById(id: string, userId: string): Promise<TaskWithDetails | null> {
    const task = await db('tasks')
      .leftJoin('memos', 'tasks.memo_id', 'memos.id')
      .leftJoin('videos', 'tasks.video_id', 'videos.id')
      .select([
        'tasks.*',
        'memos.id as memo_id',
        'memos.content as memo_content',
        'memos.timestamp_seconds as memo_timestamp_seconds',
        'videos.id as video_id',
        'videos.title as video_title',
        'videos.youtube_id as video_youtube_id',
        'videos.thumbnail_url as video_thumbnail_url'
      ])
      .where({ 'tasks.id': id, 'tasks.user_id': userId })
      .first();

    if (!task) return null;

    return {
      id: task.id,
      user_id: task.user_id,
      memo_id: task.memo_id,
      video_id: task.video_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      completed_at: task.completed_at,
      created_at: task.created_at,
      updated_at: task.updated_at,
      memo: task.memo_id ? {
        id: task.memo_id,
        content: task.memo_content,
        timestamp_seconds: task.memo_timestamp_seconds
      } : undefined,
      video: task.video_id ? {
        id: task.video_id,
        title: task.video_title,
        youtube_id: task.video_youtube_id,
        thumbnail_url: task.video_thumbnail_url
      } : undefined
    };
  }

  static async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
      order?: 'asc' | 'desc';
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      search?: string;
      video_id?: string;
      overdue?: boolean;
    } = {}
  ): Promise<{ tasks: TaskWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
      status,
      priority,
      search,
      video_id,
      overdue
    } = options;

    const offset = (page - 1) * limit;

    let query = db('tasks')
      .leftJoin('memos', 'tasks.memo_id', 'memos.id')
      .leftJoin('videos', 'tasks.video_id', 'videos.id')
      .select([
        'tasks.*',
        'memos.id as memo_id',
        'memos.content as memo_content',
        'memos.timestamp_seconds as memo_timestamp_seconds',
        'videos.id as video_id',
        'videos.title as video_title',
        'videos.youtube_id as video_youtube_id',
        'videos.thumbnail_url as video_thumbnail_url'
      ])
      .where('tasks.user_id', userId);

    if (status) {
      query = query.where('tasks.status', status);
    }

    if (priority) {
      query = query.where('tasks.priority', priority);
    }

    if (video_id) {
      query = query.where('tasks.video_id', video_id);
    }

    if (search) {
      query = query.where(function() {
        this.whereILike('tasks.title', `%${search}%`)
            .orWhereILike('tasks.description', `%${search}%`);
      });
    }

    if (overdue) {
      query = query
        .where('tasks.status', '!=', 'completed')
        .where('tasks.due_date', '<', new Date())
        .whereNotNull('tasks.due_date');
    }

    // Custom sorting for priority
    if (sort === 'priority') {
      query = query.orderByRaw(`
        CASE tasks.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END ${order}
      `);
    } else {
      query = query.orderBy(`tasks.${sort}`, order);
    }

    query = query.limit(limit).offset(offset);

    const tasks = await query;

    // Get total count
    let countQuery = db('tasks')
      .where('tasks.user_id', userId);

    if (status) {
      countQuery = countQuery.where('tasks.status', status);
    }

    if (priority) {
      countQuery = countQuery.where('tasks.priority', priority);
    }

    if (video_id) {
      countQuery = countQuery.where('tasks.video_id', video_id);
    }

    if (search) {
      countQuery = countQuery.where(function() {
        this.whereILike('tasks.title', `%${search}%`)
            .orWhereILike('tasks.description', `%${search}%`);
      });
    }

    if (overdue) {
      countQuery = countQuery
        .where('tasks.status', '!=', 'completed')
        .where('tasks.due_date', '<', new Date())
        .whereNotNull('tasks.due_date');
    }

    const [{ count }] = await countQuery.count('tasks.id as count');

    const processedTasks = tasks.map(task => ({
      id: task.id,
      user_id: task.user_id,
      memo_id: task.memo_id,
      video_id: task.video_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      completed_at: task.completed_at,
      created_at: task.created_at,
      updated_at: task.updated_at,
      memo: task.memo_id ? {
        id: task.memo_id,
        content: task.memo_content,
        timestamp_seconds: task.memo_timestamp_seconds
      } : undefined,
      video: task.video_id ? {
        id: task.video_id,
        title: task.video_title,
        youtube_id: task.video_youtube_id,
        thumbnail_url: task.video_thumbnail_url
      } : undefined
    }));

    return {
      tasks: processedTasks,
      total: parseInt(count as string, 10)
    };
  }

  static async update(id: string, userId: string, data: {
    title?: string;
    description?: string | null;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    due_date?: Date | null;
    completed_at?: Date | null;
  }): Promise<Task> {
    const updateData: any = { ...data };

    // Set completed_at when status changes to completed
    if (data.status === 'completed' && !data.completed_at) {
      updateData.completed_at = new Date();
    }

    // Clear completed_at when status changes from completed
    if (data.status && data.status !== 'completed') {
      updateData.completed_at = null;
    }

    updateData.updated_at = new Date();

    const [task] = await db('tasks')
      .where({ id, user_id: userId })
      .update(updateData)
      .returning('*');

    if (!task) {
      const error = new Error('Task not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    return task;
  }

  static async delete(id: string, userId: string): Promise<void> {
    const deletedRows = await db('tasks')
      .where({ id, user_id: userId })
      .del();

    if (deletedRows === 0) {
      const error = new Error('Task not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
  }

  static async getStats(userId: string): Promise<TaskStats> {
    const stats = await db('tasks')
      .select([
        db.raw('COUNT(*) as total'),
        db.raw('SUM(CASE WHEN status = \'pending\' THEN 1 ELSE 0 END) as pending'),
        db.raw('SUM(CASE WHEN status = \'in_progress\' THEN 1 ELSE 0 END) as in_progress'),
        db.raw('SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completed'),
        db.raw('SUM(CASE WHEN status = \'cancelled\' THEN 1 ELSE 0 END) as cancelled'),
        db.raw('SUM(CASE WHEN status != \'completed\' AND due_date < NOW() AND due_date IS NOT NULL THEN 1 ELSE 0 END) as overdue')
      ])
      .where('user_id', userId)
      .first();

    return {
      total: parseInt(stats.total, 10),
      pending: parseInt(stats.pending, 10),
      in_progress: parseInt(stats.in_progress, 10),
      completed: parseInt(stats.completed, 10),
      cancelled: parseInt(stats.cancelled, 10),
      overdue: parseInt(stats.overdue, 10)
    };
  }

  static async getOverdueTasks(userId: string, limit: number = 50): Promise<TaskWithDetails[]> {
    const { tasks } = await this.findByUser(userId, {
      overdue: true,
      sort: 'due_date',
      order: 'asc',
      limit
    });

    return tasks;
  }

  static async getUpcomingTasks(userId: string, days: number = 7): Promise<TaskWithDetails[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const tasks = await db('tasks')
      .leftJoin('memos', 'tasks.memo_id', 'memos.id')
      .leftJoin('videos', 'tasks.video_id', 'videos.id')
      .select([
        'tasks.*',
        'memos.id as memo_id',
        'memos.content as memo_content',
        'memos.timestamp_seconds as memo_timestamp_seconds',
        'videos.id as video_id',
        'videos.title as video_title',
        'videos.youtube_id as video_youtube_id',
        'videos.thumbnail_url as video_thumbnail_url'
      ])
      .where('tasks.user_id', userId)
      .where('tasks.status', '!=', 'completed')
      .where('tasks.due_date', '>=', new Date())
      .where('tasks.due_date', '<=', futureDate)
      .whereNotNull('tasks.due_date')
      .orderBy('tasks.due_date', 'asc');

    return tasks.map(task => ({
      id: task.id,
      user_id: task.user_id,
      memo_id: task.memo_id,
      video_id: task.video_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      completed_at: task.completed_at,
      created_at: task.created_at,
      updated_at: task.updated_at,
      memo: task.memo_id ? {
        id: task.memo_id,
        content: task.memo_content,
        timestamp_seconds: task.memo_timestamp_seconds
      } : undefined,
      video: task.video_id ? {
        id: task.video_id,
        title: task.video_title,
        youtube_id: task.video_youtube_id,
        thumbnail_url: task.video_thumbnail_url
      } : undefined
    }));
  }
}
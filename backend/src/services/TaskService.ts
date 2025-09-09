import { TaskModel, TaskWithDetails, TaskStats } from '../models/Task';
import { MemoModel } from '../models/Memo';
import { VideoModel } from '../models/Video';
// import { Task } from '../types/database';
import { PaginatedResponse } from '../types/api';

export class TaskService {
  static async createTask(
    userId: string,
    data: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
      memoId?: string;
      videoId?: string;
    }
  ): Promise<TaskWithDetails> {
    // Validate memo belongs to user if provided
    if (data.memoId) {
      const memo = await MemoModel.findById(data.memoId, userId);
      if (!memo) {
        const error = new Error('Memo not found') as any;
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }
    }

    // Validate video belongs to user if provided
    if (data.videoId) {
      const video = await VideoModel.findById(data.videoId, userId);
      if (!video) {
        const error = new Error('Video not found') as any;
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }
    }

    // Create task
    const task = await TaskModel.create({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'medium',
      due_date: data.dueDate ? new Date(data.dueDate) : null,
      memo_id: data.memoId || null,
      video_id: data.videoId || null
    });

    // Return task with details
    const taskDetails = await TaskModel.findById(task.id, userId);
    return taskDetails!;
  }

  static async getUserTasks(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
      order?: 'asc' | 'desc';
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      search?: string;
      videoId?: string;
      overdue?: boolean;
    } = {}
  ): Promise<PaginatedResponse<TaskWithDetails>> {
    const { tasks, total } = await TaskModel.findByUser(userId, {
      ...options,
      video_id: options.videoId
    });

    const page = options.page || 1;
    const limit = options.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      items: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static async getTaskDetails(taskId: string, userId: string): Promise<TaskWithDetails> {
    const task = await TaskModel.findById(taskId, userId);
    
    if (!task) {
      const error = new Error('Task not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    return task;
  }

  static async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      dueDate?: string | null;
    }
  ): Promise<TaskWithDetails> {
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dueDate !== undefined) {
      updateData.due_date = data.dueDate ? new Date(data.dueDate) : null;
    }

    await TaskModel.update(taskId, userId, updateData);

    // Return updated task
    return this.getTaskDetails(taskId, userId);
  }

  static async deleteTask(taskId: string, userId: string): Promise<void> {
    await TaskModel.delete(taskId, userId);
  }

  static async completeTask(taskId: string, userId: string): Promise<TaskWithDetails> {
    return this.updateTask(taskId, userId, { 
      status: 'completed'
    });
  }

  static async reopenTask(taskId: string, userId: string): Promise<TaskWithDetails> {
    return this.updateTask(taskId, userId, { 
      status: 'pending'
    });
  }

  static async getTaskStats(userId: string): Promise<TaskStats> {
    return TaskModel.getStats(userId);
  }

  static async getOverdueTasks(userId: string): Promise<TaskWithDetails[]> {
    return TaskModel.getOverdueTasks(userId);
  }

  static async getUpcomingTasks(userId: string, days: number = 7): Promise<TaskWithDetails[]> {
    return TaskModel.getUpcomingTasks(userId, days);
  }

  static async getVideoTasks(videoId: string, userId: string): Promise<TaskWithDetails[]> {
    const { tasks } = await TaskModel.findByUser(userId, {
      video_id: videoId,
      sort: 'created_at',
      order: 'desc',
      limit: 1000 // Get all tasks for a video
    });

    return tasks;
  }

  static async searchTasks(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<TaskWithDetails>> {
    return this.getUserTasks(userId, {
      ...options,
      search: query
    });
  }

  static async createTaskFromMemo(
    memoId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
    } = {}
  ): Promise<TaskWithDetails> {
    // Get memo details
    const memo = await MemoModel.findById(memoId, userId);
    if (!memo) {
      const error = new Error('Memo not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Create task based on memo content
    const taskData = {
      title: data.title || memo.content.substring(0, 100), // Use first 100 chars as title if not provided
      description: data.description || memo.content,
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      memoId: memo.id,
      videoId: memo.video_id
    };

    const task = await this.createTask(userId, taskData);

    // Mark memo as converted to task
    await MemoModel.update(memoId, userId, { is_task: true });

    return task;
  }

  static async getDashboardData(userId: string): Promise<{
    stats: TaskStats;
    overdue: TaskWithDetails[];
    upcoming: TaskWithDetails[];
    recent: TaskWithDetails[];
  }> {
    const [stats, overdue, upcoming, recent] = await Promise.all([
      this.getTaskStats(userId),
      this.getOverdueTasks(userId),
      this.getUpcomingTasks(userId),
      this.getUserTasks(userId, { 
        limit: 5, 
        sort: 'created_at', 
        order: 'desc' 
      }).then(result => result.items)
    ]);

    return {
      stats,
      overdue: overdue.slice(0, 5), // Limit to 5 overdue tasks
      upcoming: upcoming.slice(0, 5), // Limit to 5 upcoming tasks
      recent
    };
  }
}
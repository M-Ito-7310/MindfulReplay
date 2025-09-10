import { getTaskRepository, getMemoRepository, getVideoRepository } from '../database/repositories';
import { Task, CreateTaskData, UpdateTaskData } from '../database/repositories/taskRepository';
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
    }
  ): Promise<Task> {
    const taskRepo = getTaskRepository();
    const memoRepo = getMemoRepository();

    // Validate memo belongs to user if provided
    if (data.memoId) {
      const memo = await memoRepo.findById(data.memoId);
      if (!memo || memo.user_id !== userId) {
        const error = new Error('Memo not found') as any;
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }
    }

    // Create task
    const taskData: CreateTaskData = {
      user_id: userId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      due_date: data.dueDate,
      memo_id: data.memoId,
      status: 'pending'
    };

    const task = await taskRepo.create(taskData);
    return task;
  }

  static async getUserTasks(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<Task>> {
    const taskRepo = getTaskRepository();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let result;
    if (options.status) {
      result = await taskRepo.findByStatus(userId, options.status, { limit, offset });
    } else if (options.priority) {
      result = await taskRepo.findByPriority(userId, options.priority, { limit, offset });
    } else if (options.search) {
      result = await taskRepo.searchByTitle(userId, options.search, { limit, offset });
    } else {
      result = await taskRepo.findByUserId(userId, { limit, offset });
    }

    const totalPages = Math.ceil(result.total / limit);

    return {
      items: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static async getTaskDetails(taskId: string, userId: string): Promise<Task> {
    const taskRepo = getTaskRepository();
    const task = await taskRepo.findById(taskId);
    
    if (!task || task.user_id !== userId) {
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
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      dueDate?: string;
    }
  ): Promise<Task> {
    const taskRepo = getTaskRepository();
    
    // Validate task belongs to user
    const existingTask = await this.getTaskDetails(taskId, userId);
    
    const updateData: UpdateTaskData = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;

    const updatedTask = await taskRepo.update(taskId, updateData);
    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    return updatedTask;
  }

  static async deleteTask(taskId: string, userId: string): Promise<void> {
    const taskRepo = getTaskRepository();
    
    // Validate task belongs to user
    await this.getTaskDetails(taskId, userId);
    
    const success = await taskRepo.delete(taskId);
    if (!success) {
      throw new Error('Failed to delete task');
    }
  }

  static async completeTask(taskId: string, userId: string): Promise<Task> {
    return this.updateTask(taskId, userId, { 
      status: 'completed'
    });
  }

  static async reopenTask(taskId: string, userId: string): Promise<Task> {
    return this.updateTask(taskId, userId, { 
      status: 'pending'
    });
  }

  static async getTaskStats(userId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  }> {
    const taskRepo = getTaskRepository();
    
    const [allTasks, overdueTasks] = await Promise.all([
      taskRepo.findByUserId(userId, { limit: 1000 }),
      taskRepo.getOverdueTasks(userId, { limit: 1000 })
    ]);
    
    const tasks = allTasks.data;
    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      overdue: overdueTasks.data.length
    };
    
    return stats;
  }

  static async getOverdueTasks(userId: string): Promise<Task[]> {
    const taskRepo = getTaskRepository();
    const result = await taskRepo.getOverdueTasks(userId, { limit: 100 });
    return result.data;
  }

  static async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
    const taskRepo = getTaskRepository();
    const result = await taskRepo.getUpcomingTasks(userId, days, { limit: 100 });
    return result.data;
  }

  static async getMemoTasks(memoId: string, userId: string): Promise<Task[]> {
    const taskRepo = getTaskRepository();
    const memoRepo = getMemoRepository();
    
    // Validate memo belongs to user
    const memo = await memoRepo.findById(memoId);
    if (!memo || memo.user_id !== userId) {
      throw new Error('Memo not found');
    }
    
    const result = await taskRepo.findByMemoId(memoId, { limit: 1000 });
    return result.data;
  }

  static async searchTasks(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Task>> {
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
  ): Promise<Task> {
    const memoRepo = getMemoRepository();
    
    // Get memo details
    const memo = await memoRepo.findById(memoId);
    if (!memo || memo.user_id !== userId) {
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
      memoId: memo.id
    };

    const task = await this.createTask(userId, taskData);

    return task;
  }

  static async getDashboardData(userId: string): Promise<{
    stats: {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
      cancelled: number;
      overdue: number;
    };
    overdue: Task[];
    upcoming: Task[];
    recent: Task[];
  }> {
    const [stats, overdue, upcoming, recent] = await Promise.all([
      this.getTaskStats(userId),
      this.getOverdueTasks(userId),
      this.getUpcomingTasks(userId),
      this.getUserTasks(userId, { 
        limit: 5
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
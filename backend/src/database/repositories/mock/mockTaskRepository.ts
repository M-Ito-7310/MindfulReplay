import { TaskRepository, Task, CreateTaskData, UpdateTaskData } from '../taskRepository';
import { ListResponse, QueryOptions } from '../baseRepository';
import { mockDb } from '../../mockDatabase';
import { getMemoRepository } from '../index';

export class MockTaskRepository implements TaskRepository {
  async create(data: CreateTaskData): Promise<Task> {
    const task = mockDb.createTask(data);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const task = mockDb.getTaskById(id);
    return task || null;
  }

  async findByUserId(userId: string, options?: QueryOptions): Promise<ListResponse<Task>> {
    let tasks = mockDb.getTasksByUserId(userId);
    
    // Sort by created_at desc by default
    tasks.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    // Apply pagination if specified
    const total = tasks.length;
    if (options?.offset) {
      tasks = tasks.slice(options.offset);
    }
    if (options?.limit) {
      tasks = tasks.slice(0, options.limit);
    }

    return {
      data: tasks,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByMemoId(memoId: string, options?: QueryOptions): Promise<ListResponse<Task>> {
    const allTasks = Array.from((mockDb as any).tasks.values());
    let tasks = allTasks.filter((task: Task) => task.memo_id === memoId);
    
    // Sort by created_at desc
    tasks.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    // Apply pagination
    const total = tasks.length;
    if (options?.offset) {
      tasks = tasks.slice(options.offset);
    }
    if (options?.limit) {
      tasks = tasks.slice(0, options.limit);
    }

    return {
      data: tasks,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByStatus(userId: string, status: Task['status'], options?: QueryOptions): Promise<ListResponse<Task>> {
    let userTasks = mockDb.getTasksByUserId(userId);
    let tasks = userTasks.filter(task => task.status === status);
    
    // Sort by priority and due date
    tasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // If same priority, sort by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return b.created_at.getTime() - a.created_at.getTime();
    });
    
    // Apply pagination
    const total = tasks.length;
    if (options?.offset) {
      tasks = tasks.slice(options.offset);
    }
    if (options?.limit) {
      tasks = tasks.slice(0, options.limit);
    }

    return {
      data: tasks,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByPriority(userId: string, priority: Task['priority'], options?: QueryOptions): Promise<ListResponse<Task>> {
    let userTasks = mockDb.getTasksByUserId(userId);
    let tasks = userTasks.filter(task => task.priority === priority);
    
    // Sort by status and due date
    const statusOrder = { pending: 1, in_progress: 2, completed: 3, cancelled: 4 };
    tasks.sort((a, b) => {
      const aStatus = statusOrder[a.status];
      const bStatus = statusOrder[b.status];
      
      if (aStatus !== bStatus) {
        return aStatus - bStatus;
      }
      
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      return b.created_at.getTime() - a.created_at.getTime();
    });
    
    // Apply pagination
    const total = tasks.length;
    if (options?.offset) {
      tasks = tasks.slice(options.offset);
    }
    if (options?.limit) {
      tasks = tasks.slice(0, options.limit);
    }

    return {
      data: tasks,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async searchByTitle(userId: string, query: string, options?: QueryOptions): Promise<ListResponse<Task>> {
    let userTasks = mockDb.getTasksByUserId(userId);
    
    // Simple text search in title and description
    const searchResults = userTasks.filter(task => 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
    );

    // Apply pagination
    const total = searchResults.length;
    let results = searchResults;
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return {
      data: results,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async getOverdueTasks(userId: string, options?: QueryOptions): Promise<ListResponse<Task>> {
    const now = new Date();
    let userTasks = mockDb.getTasksByUserId(userId);
    
    let overdueTasks = userTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    );
    
    // Sort by how overdue they are (most overdue first)
    overdueTasks.sort((a, b) => {
      const aOverdue = now.getTime() - new Date(a.due_date!).getTime();
      const bOverdue = now.getTime() - new Date(b.due_date!).getTime();
      return bOverdue - aOverdue;
    });
    
    // Apply pagination
    const total = overdueTasks.length;
    if (options?.offset) {
      overdueTasks = overdueTasks.slice(options.offset);
    }
    if (options?.limit) {
      overdueTasks = overdueTasks.slice(0, options.limit);
    }

    return {
      data: overdueTasks,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async getUpcomingTasks(userId: string, days: number, options?: QueryOptions): Promise<ListResponse<Task>> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    let userTasks = mockDb.getTasksByUserId(userId);
    
    let upcomingTasks = userTasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) >= now && 
      new Date(task.due_date) <= futureDate &&
      task.status !== 'completed' && 
      task.status !== 'cancelled'
    );
    
    // Sort by due date (soonest first)
    upcomingTasks.sort((a, b) => 
      new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    );
    
    // Apply pagination
    const total = upcomingTasks.length;
    if (options?.offset) {
      upcomingTasks = upcomingTasks.slice(options.offset);
    }
    if (options?.limit) {
      upcomingTasks = upcomingTasks.slice(0, options.limit);
    }

    return {
      data: upcomingTasks,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByVideoId(userId: string, videoId: string, options?: QueryOptions): Promise<ListResponse<Task>> {
    const memoRepo = getMemoRepository();
    
    // First, find all memos for this video that belong to the user
    const memosResult = await memoRepo.findByVideoId(userId, videoId, { limit: 1000 });
    const memoIds = memosResult.data.map(memo => memo.id);
    
    // Then find all tasks that are linked to any of these memos
    let userTasks = mockDb.getTasksByUserId(userId);
    let videoTasks = userTasks.filter(task => 
      task.memo_id && memoIds.includes(task.memo_id)
    );
    
    // Sort by creation date (newest first)
    videoTasks.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    // Apply pagination
    const total = videoTasks.length;
    if (options?.offset) {
      videoTasks = videoTasks.slice(options.offset);
    }
    if (options?.limit) {
      videoTasks = videoTasks.slice(0, options.limit);
    }

    return {
      data: videoTasks,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async update(id: string, data: UpdateTaskData): Promise<Task | null> {
    const task = mockDb.updateTask(id, data);
    return task || null;
  }

  async delete(id: string): Promise<boolean> {
    return mockDb.deleteTask(id);
  }
}
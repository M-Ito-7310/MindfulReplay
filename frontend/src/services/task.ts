import { apiService } from './api';
import { API_CONFIG } from '@/constants/api';
import { Task, CreateTaskData, UpdateTaskData, TaskStats, ApiResponse, PaginatedResponse } from '@/types';

interface TaskListOptions {
  page?: number;
  limit?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
  order?: 'asc' | 'desc';
  videoId?: string;
  overdue?: boolean;
}

interface SearchOptions {
  page?: number;
  limit?: number;
}

interface DashboardData {
  stats: TaskStats;
  overdue: Task[];
  upcoming: Task[];
  recent: Task[];
}

class TaskService {
  // Get all tasks with filtering options
  async getTasks(options: TaskListOptions = {}): Promise<PaginatedResponse<Task>> {
    const queryParams = new URLSearchParams();
    
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.status) queryParams.append('status', options.status);
    if (options.priority) queryParams.append('priority', options.priority);
    if (options.search) queryParams.append('search', options.search);
    if (options.sort) queryParams.append('sort', options.sort);
    if (options.order) queryParams.append('order', options.order);
    if (options.videoId) queryParams.append('videoId', options.videoId);
    if (options.overdue) queryParams.append('overdue', 'true');

    const endpoint = `${API_CONFIG.ENDPOINTS.TASKS}?${queryParams.toString()}`;
    const response = await apiService.get<PaginatedResponse<Task>>(endpoint);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  // Get a single task by ID
  async getTask(id: string): Promise<Task> {
    const response = await apiService.get<{ task: Task }>(API_CONFIG.ENDPOINTS.TASK_DETAIL(id));
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.task;
  }

  // Create a new task
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await apiService.post<{ task: Task }>(API_CONFIG.ENDPOINTS.TASKS, data);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.task;
  }

  // Update an existing task
  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await apiService.put<{ task: Task }>(API_CONFIG.ENDPOINTS.TASK_DETAIL(id), data);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.task;
  }

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    const response = await apiService.delete<{ message: string }>(API_CONFIG.ENDPOINTS.TASK_DETAIL(id));
    if (!response.success) {
      throw new Error('Failed to delete task');
    }
  }

  // Complete a task
  async completeTask(id: string): Promise<Task> {
    const response = await apiService.post<{ task: Task }>(API_CONFIG.ENDPOINTS.TASK_COMPLETE(id));
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.task;
  }

  // Reopen a completed task
  async reopenTask(id: string): Promise<Task> {
    const response = await apiService.post<{ task: Task }>(API_CONFIG.ENDPOINTS.TASK_REOPEN(id));
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.task;
  }

  // Get task statistics
  async getTaskStats(): Promise<TaskStats> {
    const response = await apiService.get<{ stats: TaskStats }>(API_CONFIG.ENDPOINTS.TASK_STATS);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.stats;
  }

  // Get overdue tasks
  async getOverdueTasks(): Promise<Task[]> {
    const response = await apiService.get<{ tasks: Task[] }>(API_CONFIG.ENDPOINTS.TASK_OVERDUE);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.tasks;
  }

  // Get upcoming tasks
  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    const endpoint = `${API_CONFIG.ENDPOINTS.TASK_UPCOMING}?days=${days}`;
    const response = await apiService.get<{ tasks: Task[] }>(endpoint);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.tasks;
  }

  // Search tasks
  async searchTasks(query: string, options: SearchOptions = {}): Promise<PaginatedResponse<Task>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());

    const endpoint = `${API_CONFIG.ENDPOINTS.TASK_SEARCH}?${queryParams.toString()}`;
    const response = await apiService.get<PaginatedResponse<Task>>(endpoint);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  // Create task from memo
  async createTaskFromMemo(
    memoId: string, 
    data: { title?: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'urgent'; dueDate?: string }
  ): Promise<Task> {
    const response = await apiService.post<{ task: Task }>(API_CONFIG.ENDPOINTS.TASK_FROM_MEMO(memoId), data);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data.task;
  }

  // Get dashboard data
  async getDashboard(): Promise<DashboardData> {
    const response = await apiService.get<DashboardData>(API_CONFIG.ENDPOINTS.TASK_DASHBOARD);
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }
}

export const taskService = new TaskService();
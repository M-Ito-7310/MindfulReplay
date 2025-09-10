import { BaseRepository, ListResponse, QueryOptions } from './baseRepository';

export interface Task {
  id: string;
  user_id: string;
  memo_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskData {
  user_id: string;
  memo_id?: string;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
}

export interface TaskRepository extends BaseRepository<Task, CreateTaskData, UpdateTaskData> {
  findByUserId(userId: string, options?: QueryOptions): Promise<ListResponse<Task>>;
  findByMemoId(memoId: string, options?: QueryOptions): Promise<ListResponse<Task>>;
  findByStatus(userId: string, status: Task['status'], options?: QueryOptions): Promise<ListResponse<Task>>;
  findByPriority(userId: string, priority: Task['priority'], options?: QueryOptions): Promise<ListResponse<Task>>;
  searchByTitle(userId: string, query: string, options?: QueryOptions): Promise<ListResponse<Task>>;
  getOverdueTasks(userId: string, options?: QueryOptions): Promise<ListResponse<Task>>;
  getUpcomingTasks(userId: string, days: number, options?: QueryOptions): Promise<ListResponse<Task>>;
}
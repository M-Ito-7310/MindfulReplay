// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    timestamp: string;
    request_id?: string;
  };
}

// Specific response types
export interface VideoSaveResponse {
  video: Video;
}

export interface VideosListResponse {
  items: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Video Types
export interface Video {
  id: string;
  user_id: string;
  youtube_id: string;
  youtube_url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration?: number;
  channel_name?: string;
  published_at?: string;
  theme_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Memo Types
export interface Memo {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  timestamp_sec?: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Task Types
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
  created_at: string;
  updated_at: string;
}

// Theme Types
export interface Theme {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  VideoList: undefined;
  VideoPlayer: { videoId: string };
  MemoCreate: { videoId: string; timestamp?: number };
  MemoEdit: { memoId: string };
  MemoList: { videoId?: string };
  TaskList: { memoId?: string; status?: Task['status']; priority?: Task['priority'] };
  TaskCreate: { memoId?: string };
  TaskEdit: { taskId: string };
  Profile: undefined;
};

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

export interface VideoForm {
  youtube_url: string;
  theme_id?: string;
}

export interface MemoForm {
  content: string;
  timestamp_sec?: number;
  tag_ids?: string[];
}

export interface TaskForm {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

// Additional Task API Types
export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  memoId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

// Pagination Types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
// API Response Types
export interface ApiResponse<T> {
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
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
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
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
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
  TaskList: undefined;
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
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}
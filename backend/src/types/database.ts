export interface User {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  is_active: boolean;
  email_verified: boolean;
  email_verified_at: Date | null;
  notification_settings: {
    email: boolean;
    push: boolean;
    reminder: boolean;
  };
}

export interface Video {
  id: string;
  user_id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  channel_name: string | null;
  channel_id: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  published_at: Date | null;
  saved_at: Date;
  last_watched_at: Date | null;
  watch_count: number;
  is_archived: boolean;
  metadata: any;
}

export interface Theme {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  usage_count: number;
}

export interface Memo {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  timestamp_seconds: number | null;
  is_task: boolean;
  is_important: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  user_id: string;
  memo_id: string | null;
  video_id: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Reminder {
  id: string;
  user_id: string;
  memo_id: string | null;
  task_id: string | null;
  video_id: string | null;
  reminder_type: 'spaced_repetition' | 'scheduled' | 'recurring';
  scheduled_for: Date;
  title: string;
  message: string | null;
  is_sent: boolean;
  sent_at: Date | null;
  is_acknowledged: boolean;
  acknowledged_at: Date | null;
  repetition_number: number;
  next_interval_days: number | null;
  created_at: Date;
}
// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    
    // Video endpoints
    VIDEOS: '/api/videos',
    VIDEO_DETAIL: (id: string) => `/api/videos/${id}`,
    
    // Memo endpoints
    MEMOS: '/api/memos',
    MEMO_DETAIL: (id: string) => `/api/memos/${id}`,
    
    // Task endpoints
    TASKS: '/api/tasks',
    TASK_DETAIL: (id: string) => `/api/tasks/${id}`,
    TASK_STATS: '/api/tasks/stats',
    TASK_OVERDUE: '/api/tasks/overdue',
    TASK_UPCOMING: '/api/tasks/upcoming',
    TASK_DASHBOARD: '/api/tasks/dashboard',
    TASK_SEARCH: '/api/tasks/search',
    TASK_COMPLETE: (id: string) => `/api/tasks/${id}/complete`,
    TASK_REOPEN: (id: string) => `/api/tasks/${id}/reopen`,
    TASK_FROM_MEMO: (memoId: string) => `/api/tasks/from-memo/${memoId}`,
    
    // Reminder endpoints
    REMINDERS: '/api/reminders',
    REMINDER_DETAIL: (id: string) => `/api/reminders/${id}`,
  },
  TIMEOUT: 10000, // 10 seconds
};

// Request headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@mindful_replay:access_token',
  REFRESH_TOKEN: '@mindful_replay:refresh_token',
  USER_DATA: '@mindful_replay:user_data',
  THEME_PREFERENCE: '@mindful_replay:theme',
};
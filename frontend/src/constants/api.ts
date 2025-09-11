// API Configuration
const DEV_IP = '192.168.1.10'; // 👈 実際のIPアドレスに変更してください
export const API_CONFIG = {
  BASE_URL: `http://${DEV_IP}:3000/api`,
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    
    // Video endpoints
    VIDEOS: '/videos',
    VIDEO_DETAIL: (id: string) => `/videos/${id}`,
    VIDEO_PREVIEW: '/videos/preview',
    
    // Memo endpoints
    MEMOS: '/memos',
    MEMO_DETAIL: (id: string) => `/memos/${id}`,
    
    // Task endpoints
    TASKS: '/tasks',
    TASK_DETAIL: (id: string) => `/tasks/${id}`,
    TASK_STATS: '/tasks/stats',
    TASK_OVERDUE: '/tasks/overdue',
    TASK_UPCOMING: '/tasks/upcoming',
    TASK_DASHBOARD: '/tasks/dashboard',
    TASK_SEARCH: '/tasks/search',
    TASK_COMPLETE: (id: string) => `/tasks/${id}/complete`,
    TASK_REOPEN: (id: string) => `/tasks/${id}/reopen`,
    TASK_FROM_MEMO: (memoId: string) => `/tasks/from-memo/${memoId}`,
    
    // Reminder endpoints
    REMINDERS: '/reminders',
    REMINDER_DETAIL: (id: string) => `/reminders/${id}`,
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
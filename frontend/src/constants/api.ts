// API Configuration
// 環境変数や現在のホストに基づいて自動的にAPIベースURLを決定
const getApiBaseUrl = (): string => {
  try {
    // 環境変数が設定されている場合はそれを使用
    if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL) {
      if (__DEV__) {
        console.log('[API Config] Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
      }
      return process.env.EXPO_PUBLIC_API_URL;
    }
    
    // Web環境の場合（window とlocation の存在を安全にチェック）
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (__DEV__) {
        console.log('[API Config] Web environment detected, hostname:', hostname);
      }
      
      // ローカル開発環境の場合
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
      }
      
      // 同じホストでバックエンドが動いている場合
      return `http://${hostname}:3000/api`;
    }
    
    // Native環境の場合（デフォルト）
    // 環境変数からIPを取得、なければデフォルトIP
    const DEV_IP = process.env.EXPO_PUBLIC_DEV_IP || '192.168.1.10'; // 必要に応じて変更
    const apiUrl = `http://${DEV_IP}:3000/api`;
    if (__DEV__) {
      console.log('[API Config] Native environment detected, using local IP');
      console.log('[API Config] Native API URL:', apiUrl);
    }
    return apiUrl;
  } catch (error) {
    if (__DEV__) {
      console.error('[API Config] Error in getApiBaseUrl:', error);
    }
    // フォールバック: Native環境として扱う
    const DEV_IP = (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_DEV_IP) || '192.168.1.10';
    const fallbackUrl = `http://${DEV_IP}:3000/api`;
    if (__DEV__) {
      console.log('[API Config] Using fallback URL:', fallbackUrl);
    }
    return fallbackUrl;
  }
};

// 動的にベースURLを取得する関数を作成
const createApiConfig = () => {
  const baseUrl = getApiBaseUrl();
  
  // Development mode only logging
  if (__DEV__) {
    console.log('[API Config] Final BASE_URL:', baseUrl);
    console.log('[API Config] Environment detection:', {
      hasWindow: typeof window !== 'undefined',
      isReactNative: typeof navigator !== 'undefined' && navigator.product === 'ReactNative',
      hasProcess: typeof process !== 'undefined',
      apiUrlConfigured: !!(typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL),
      devIpConfigured: !!(typeof process !== 'undefined' && process.env.EXPO_PUBLIC_DEV_IP),
    });
  }
  
  return {
    BASE_URL: baseUrl,
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
};

// API設定オブジェクトを作成してエクスポート
export const API_CONFIG = createApiConfig();

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
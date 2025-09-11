import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_HEADERS, STORAGE_KEYS } from '@/constants/api';
import { ApiResponse } from '@/types';
import { localStorageService } from './localStorageService';

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Get auth token from storage
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Set auth token in storage
  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  // Remove auth token from storage
  async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();

    const config: RequestInit = {
      headers: {
        ...API_HEADERS,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`[API] Making request to: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[API] Response status: ${response.status}`);

      const data = await response.json();
      console.log(`[API] Response data:`, data);

      if (!response.ok) {
        const errorMessage = data.error?.message || `HTTP error! status: ${response.status}`;
        console.error(`[API] Request failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`[API] Request error for ${url}:`, error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('[API] Request timeout');
          throw new Error('Request timeout');
        }
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          console.error('[API] Network connectivity error');
          throw new Error('Network connectivity error. Please check your connection.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // GET request with local storage fallback
  async get<T>(endpoint: string, options?: { params?: any }): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints
    if (this.shouldUseLocalStorage(endpoint)) {
      console.log(`[API] Using local storage for endpoint: ${endpoint}`);
      try {
        const result = await this.handleLocalStorageGet<T>(endpoint, options);
        console.log(`[API] Local storage result:`, result);
        return result;
      } catch (error) {
        console.error(`[API] Local storage error for ${endpoint}:`, error);
        throw error;
      }
    }
    
    // For Web, check backend availability first
    if (!this.isNativePlatform()) {
      const isBackendReady = await this.isBackendAvailable();
      if (!isBackendReady) {
        console.log(`[API] Backend not available, falling back to local storage for: ${endpoint}`);
        return this.handleLocalStorageGet<T>(endpoint, options);
      }
    }
    
    // Fall back to API request
    try {
      console.log(`[API] Making network request to: ${this.baseURL}${endpoint}`);
      return await this.request<T>(endpoint, { method: 'GET' });
    } catch (error) {
      console.log(`[API] Network request failed, trying local storage fallback for: ${endpoint}`);
      // If API fails, try local storage as fallback
      return this.handleLocalStorageGet<T>(endpoint, options);
    }
  }

  // POST request with local storage support
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints
    if (this.shouldUseLocalStorage(endpoint)) {
      console.log(`[API] Using local storage POST for endpoint: ${endpoint}`, data);
      return this.handleLocalStoragePost<T>(endpoint, data);
    }
    
    // For Web, check backend availability first
    if (!this.isNativePlatform()) {
      const isBackendReady = await this.isBackendAvailable();
      if (!isBackendReady) {
        console.log(`[API] Backend not available, falling back to local storage POST for: ${endpoint}`);
        return this.handleLocalStoragePost<T>(endpoint, data);
      }
    }
    
    // Fall back to API request
    try {
      console.log(`[API] Making network POST request to: ${this.baseURL}${endpoint}`, data);
      return await this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
      console.log(`[API] Network POST failed, trying local storage fallback for: ${endpoint}`);
      // If API fails, try local storage as fallback
      return this.handleLocalStoragePost<T>(endpoint, data);
    }
  }

  // PUT request with local storage support
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints
    if (this.shouldUseLocalStorage(endpoint)) {
      return this.handleLocalStoragePut<T>(endpoint, data);
    }
    
    // Fall back to API request
    try {
      console.log(`[API] Making network PUT request to: ${this.baseURL}${endpoint}`, data);
      return await this.request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
      // If API fails, try local storage as fallback
      return this.handleLocalStoragePut<T>(endpoint, data);
    }
  }

  // DELETE request with local storage support
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints
    if (this.shouldUseLocalStorage(endpoint)) {
      return this.handleLocalStorageDelete<T>(endpoint);
    }
    
    // Fall back to API request
    try {
      console.log(`[API] Making network DELETE request to: ${this.baseURL}${endpoint}`);
      return await this.request<T>(endpoint, { method: 'DELETE' });
    } catch (error) {
      // If API fails, try local storage as fallback
      return this.handleLocalStorageDelete<T>(endpoint);
    }
  }

  // Check if endpoint should use local storage
  private shouldUseLocalStorage(endpoint: string): boolean {
    // Native platforms always use local storage for all endpoints
    if (this.isNativePlatform()) {
      const localEndpoints = [
        API_CONFIG.ENDPOINTS.VIDEOS,
        API_CONFIG.ENDPOINTS.MEMOS,
        API_CONFIG.ENDPOINTS.TASKS,
        API_CONFIG.ENDPOINTS.LOGIN,
        API_CONFIG.ENDPOINTS.LOGOUT,
        API_CONFIG.ENDPOINTS.REGISTER,
        API_CONFIG.ENDPOINTS.REFRESH,
      ];
      
      return localEndpoints.some(e => endpoint.includes(e));
    }
    
    // Web platforms should try backend first and use local storage as fallback
    // Only use local storage immediately for specific cases (when explicitly needed)
    return false;
  }

  // Check if running on native platform
  private isNativePlatform(): boolean {
    return typeof window === 'undefined' || 
           (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');
  }

  // Check if backend server is available (Web only)
  private async isBackendAvailable(): Promise<boolean> {
    if (this.isNativePlatform()) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      // Try multiple endpoints to check server availability
      const healthEndpoints = [
        `${this.baseURL.replace('/api', '')}/health`,
        `${this.baseURL}/health`,
        this.baseURL, // Just try the API base URL
      ];
      
      for (const endpoint of healthEndpoints) {
        try {
          console.log(`[API] Checking backend availability: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            signal: controller.signal,
          });
          
          if (response.ok || response.status === 404) { // 404 means server is responding
            clearTimeout(timeoutId);
            console.log(`[API] Backend server available at: ${endpoint}`);
            return true;
          }
        } catch (err) {
          // Continue to next endpoint
          continue;
        }
      }
      
      clearTimeout(timeoutId);
      console.log('[API] Backend server not available on any endpoint');
      return false;
    } catch (error) {
      console.log('[API] Backend server not available, using local storage fallback');
      return false;
    }
  }

  // Handle local storage GET requests
  private async handleLocalStorageGet<T>(endpoint: string, options?: { params?: any }): Promise<ApiResponse<T>> {
    if (endpoint.includes(API_CONFIG.ENDPOINTS.VIDEOS)) {
      // Check if it's a video preview request
      if (endpoint.includes('/preview')) {
        return this.handleVideoPreview<T>(endpoint);
      }
      
      // Check if it's a specific video request
      const videoIdMatch = endpoint.match(/\/videos\/([^\/]+)$/);
      if (videoIdMatch) {
        return localStorageService.getVideoById(videoIdMatch[1]) as Promise<ApiResponse<T>>;
      }
      return localStorageService.getVideos() as Promise<ApiResponse<T>>;
    }
    
    if (endpoint.includes(API_CONFIG.ENDPOINTS.MEMOS)) {
      // Check if it's a specific memo request
      const memoIdMatch = endpoint.match(/\/memos\/([^\/]+)$/);
      if (memoIdMatch) {
        return localStorageService.getMemoById(memoIdMatch[1]) as Promise<ApiResponse<T>>;
      }
      const videoId = options?.params?.videoId;
      return localStorageService.getMemos(videoId) as Promise<ApiResponse<T>>;
    }
    
    if (endpoint.includes(API_CONFIG.ENDPOINTS.TASKS)) {
      return localStorageService.getTasks() as Promise<ApiResponse<T>>;
    }
    
    // Default fallback
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'This endpoint is not supported offline',
      },
    } as ApiResponse<T>;
  }

  // Handle local storage POST requests
  private async handleLocalStoragePost<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    if (endpoint.includes(API_CONFIG.ENDPOINTS.VIDEOS)) {
      return localStorageService.createVideo(data) as Promise<ApiResponse<T>>;
    }
    
    if (endpoint.includes(API_CONFIG.ENDPOINTS.MEMOS)) {
      return localStorageService.createMemo(data) as Promise<ApiResponse<T>>;
    }
    
    if (endpoint.includes(API_CONFIG.ENDPOINTS.TASKS)) {
      return localStorageService.createTask(data) as Promise<ApiResponse<T>>;
    }

    // Handle authentication endpoints
    if (endpoint.includes(API_CONFIG.ENDPOINTS.LOGIN)) {
      console.log('[API] Handling local login:', data);
      // Mock successful login
      const mockToken = 'demo_jwt_token_' + Date.now();
      
      return {
        success: true,
        data: {
          user: { 
            id: 'user_demo', 
            email: data.email, 
            name: 'Demo User',
            username: 'demo_user',
            display_name: 'Demo User'
          },
          tokens: {
            accessToken: mockToken,
            refreshToken: 'demo_refresh_token_' + Date.now(),
            expiresIn: 3600
          }
        }
      } as ApiResponse<T>;
    }

    if (endpoint.includes(API_CONFIG.ENDPOINTS.LOGOUT)) {
      console.log('[API] Handling local logout');
      await this.removeAuthToken();
      return {
        success: true,
        data: undefined
      } as ApiResponse<T>;
    }

    if (endpoint.includes(API_CONFIG.ENDPOINTS.REGISTER)) {
      console.log('[API] Handling local register:', data);
      // Mock successful registration
      const mockToken = 'demo_jwt_token_' + Date.now();
      
      return {
        success: true,
        data: {
          user: { 
            id: 'user_demo', 
            email: data.email, 
            name: data.name || 'Demo User',
            username: data.username || 'demo_user',
            display_name: data.name || 'Demo User'
          },
          tokens: {
            accessToken: mockToken,
            refreshToken: 'demo_refresh_token_' + Date.now(),
            expiresIn: 3600
          }
        }
      } as ApiResponse<T>;
    }

    if (endpoint.includes(API_CONFIG.ENDPOINTS.REFRESH)) {
      console.log('[API] Handling local token refresh');
      // Mock successful token refresh
      const mockToken = 'demo_jwt_token_' + Date.now();
      
      return {
        success: true,
        data: {
          user: {
            id: 'user_demo',
            email: 'demo@mindfulreplay.com',
            name: 'Demo User',
            username: 'demo_user',
            display_name: 'Demo User'
          },
          tokens: {
            accessToken: mockToken,
            refreshToken: 'demo_refresh_token_' + Date.now(),
            expiresIn: 3600
          }
        }
      } as ApiResponse<T>;
    }
    
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'This endpoint is not supported offline',
      },
    } as ApiResponse<T>;
  }

  // Handle local storage PUT requests
  private async handleLocalStoragePut<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    if (endpoint.includes(API_CONFIG.ENDPOINTS.TASKS)) {
      const taskIdMatch = endpoint.match(/\/tasks\/([^\/]+)$/);
      if (taskIdMatch) {
        return localStorageService.updateTask(taskIdMatch[1], data) as Promise<ApiResponse<T>>;
      }
    }
    
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'This endpoint is not supported offline',
      },
    } as ApiResponse<T>;
  }

  // Handle local storage DELETE requests
  private async handleLocalStorageDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
    if (endpoint.includes(API_CONFIG.ENDPOINTS.MEMOS)) {
      const memoIdMatch = endpoint.match(/\/memos\/([^\/]+)$/);
      if (memoIdMatch) {
        return localStorageService.deleteMemo(memoIdMatch[1]) as Promise<ApiResponse<T>>;
      }
    }
    
    if (endpoint.includes(API_CONFIG.ENDPOINTS.TASKS)) {
      const taskIdMatch = endpoint.match(/\/tasks\/([^\/]+)$/);
      if (taskIdMatch) {
        return localStorageService.deleteTask(taskIdMatch[1]) as Promise<ApiResponse<T>>;
      }
    }
    
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'This endpoint is not supported offline',
      },
    } as ApiResponse<T>;
  }

  // Handle video preview requests (mock implementation)
  private async handleVideoPreview<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Extract URL from query parameter
    const urlMatch = endpoint.match(/url=([^&]+)/);
    if (!urlMatch) {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: '無効なURLです',
        },
      } as ApiResponse<T>;
    }

    const decodedUrl = decodeURIComponent(urlMatch[1]);
    
    // Extract YouTube video ID
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    let videoId = '';
    for (const pattern of patterns) {
      const match = decodedUrl.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    if (!videoId) {
      return {
        success: false,
        error: {
          code: 'INVALID_YOUTUBE_URL',
          message: '有効なYouTube URLを入力してください',
        },
      } as ApiResponse<T>;
    }

    // Mock video preview data with proper structure
    const mockVideoMetadata = {
      youtubeId: videoId,
      title: `サンプル動画タイトル (${videoId})`,
      description: 'これはサンプル動画の説明です。実際の動画では、動画の詳細な説明が表示されます。',
      channelId: 'sample_channel_id',
      channelName: 'サンプルチャンネル',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: 300, // 5 minutes default
      publishedAt: new Date().toISOString(),
      viewCount: 10000,
      likeCount: 500,
      tags: ['サンプル', 'YouTube', 'デモ']
    };

    const mockPreview = {
      youtubeUrl: decodedUrl,
      videoMetadata: mockVideoMetadata
    };

    return {
      success: true,
      data: mockPreview,
    } as ApiResponse<T>;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}

export const apiService = new ApiService();
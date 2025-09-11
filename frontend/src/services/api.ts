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

  // GET request
  async get<T>(endpoint: string, options?: { params?: any }): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints on native platforms
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
    
    // Make API request without fallback
    console.log(`[API] Making network request to: ${this.baseURL}${endpoint}`);
    return await this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints on native platforms
    if (this.shouldUseLocalStorage(endpoint)) {
      console.log(`[API] Using local storage POST for endpoint: ${endpoint}`, data);
      return this.handleLocalStoragePost<T>(endpoint, data);
    }
    
    // Make API request without fallback
    console.log(`[API] Making network POST request to: ${this.baseURL}${endpoint}`, data);
    return await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints on native platforms
    if (this.shouldUseLocalStorage(endpoint)) {
      return this.handleLocalStoragePut<T>(endpoint, data);
    }
    
    // Make API request without fallback
    console.log(`[API] Making network PUT request to: ${this.baseURL}${endpoint}`, data);
    return await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints on native platforms
    if (this.shouldUseLocalStorage(endpoint)) {
      return this.handleLocalStorageDelete<T>(endpoint);
    }
    
    // Make API request without fallback
    console.log(`[API] Making network DELETE request to: ${this.baseURL}${endpoint}`);
    return await this.request<T>(endpoint, { method: 'DELETE' });
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

    // Handle authentication endpoints (native platforms only)
    if (endpoint.includes(API_CONFIG.ENDPOINTS.LOGIN)) {
      console.log('[API] Login endpoint called in local storage mode');
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'Authentication requires backend server connection',
        },
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
      console.log('[API] Register endpoint called in local storage mode');
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'Registration requires backend server connection',
        },
      } as ApiResponse<T>;
    }

    if (endpoint.includes(API_CONFIG.ENDPOINTS.REFRESH)) {
      console.log('[API] Token refresh endpoint called in local storage mode');
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'Token refresh requires backend server connection',
        },
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

  // Handle video preview requests - removed mock implementation
  private async handleVideoPreview<T>(endpoint: string): Promise<ApiResponse<T>> {
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'Video preview requires backend server connection',
      },
    } as ApiResponse<T>;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}

export const apiService = new ApiService();
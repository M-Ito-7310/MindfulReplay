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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
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
      return this.handleLocalStorageGet<T>(endpoint, options);
    }
    
    // Fall back to API request
    try {
      return await this.request<T>(endpoint, { method: 'GET' });
    } catch (error) {
      // If API fails, try local storage as fallback
      return this.handleLocalStorageGet<T>(endpoint, options);
    }
  }

  // POST request with local storage support
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints
    if (this.shouldUseLocalStorage(endpoint)) {
      return this.handleLocalStoragePost<T>(endpoint, data);
    }
    
    // Fall back to API request
    try {
      return await this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
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
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request with local storage support
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Use local storage for specific endpoints
    if (this.shouldUseLocalStorage(endpoint)) {
      return this.handleLocalStorageDelete<T>(endpoint);
    }
    
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Check if endpoint should use local storage
  private shouldUseLocalStorage(endpoint: string): boolean {
    // Always use local storage for these endpoints in demo mode
    const localEndpoints = [
      API_CONFIG.ENDPOINTS.VIDEOS,
      API_CONFIG.ENDPOINTS.MEMOS,
      API_CONFIG.ENDPOINTS.TASKS,
    ];
    
    return localEndpoints.some(e => endpoint.includes(e));
  }

  // Handle local storage GET requests
  private async handleLocalStorageGet<T>(endpoint: string, options?: { params?: any }): Promise<ApiResponse<T>> {
    if (endpoint.includes(API_CONFIG.ENDPOINTS.VIDEOS)) {
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

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }
}

export const apiService = new ApiService();
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_HEADERS, STORAGE_KEYS } from '@/constants/api';
import { ApiResponse } from '@/types';
import { localStorageService } from './localStorageService';

class ApiService {
  private baseURL: string;
  private timeout: number;
  private backendAvailable: boolean | null = null;
  private connectionTested: boolean = false;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;

    // Force reset connection test on initialization
    this.resetConnectionTest();

    // Debug: log the base URL being used
    console.log('[API Service] Initialized with baseURL:', this.baseURL);
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
        const errorMessage = data.error?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          throw new Error('Network connectivity error. Please check your connection.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // GET request
  async get<T>(endpoint: string, options?: { params?: any }): Promise<ApiResponse<T>> {
    // Dynamic API selection based on backend availability
    const useBackend = await this.shouldUseBackendAPI(endpoint);
    
    if (!useBackend) {
      return await this.handleLocalStorageGet<T>(endpoint, options);
    }
    
    // Make API request with local storage fallback
    try {
      return await this.request<T>(endpoint, { method: 'GET' });
    } catch (error) {
      return await this.handleLocalStorageGet<T>(endpoint, options);
    }
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    console.log('[API Service] POST request to:', endpoint);
    console.log('[API Service] POST data:', data);

    // Dynamic API selection based on backend availability
    const useBackend = await this.shouldUseBackendAPI(endpoint);

    if (!useBackend) {
      console.log('[API Service] Using local storage fallback for POST');
      return this.handleLocalStoragePost<T>(endpoint, data);
    }

    // Make API request with local storage fallback
    try {
      console.log('[API Service] Making backend POST request');
      const result = await this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
      console.log('[API Service] Backend POST success:', result);
      return result;
    } catch (error) {
      console.log('[API Service] Backend POST failed, falling back to local storage:', error);
      return await this.handleLocalStoragePost<T>(endpoint, data);
    }
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Dynamic API selection based on backend availability
    const useBackend = await this.shouldUseBackendAPI(endpoint);
    
    if (!useBackend) {
      return this.handleLocalStoragePut<T>(endpoint, data);
    }
    
    // Make API request with local storage fallback
    try {
      return await this.request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
      return await this.handleLocalStoragePut<T>(endpoint, data);
    }
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Dynamic API selection based on backend availability
    const useBackend = await this.shouldUseBackendAPI(endpoint);
    
    if (!useBackend) {
      return this.handleLocalStorageDelete<T>(endpoint);
    }
    
    // Make API request with local storage fallback
    try {
      return await this.request<T>(endpoint, { method: 'DELETE' });
    } catch (error) {
      return await this.handleLocalStorageDelete<T>(endpoint);
    }
  }


  // Check if running on native platform
  private isNativePlatform(): boolean {
    return typeof window === 'undefined' || 
           (typeof navigator !== 'undefined' && navigator.product === 'ReactNative');
  }

  // Check if API URL is configured for backend communication
  private hasApiUrlConfigured(): boolean {
    // For web environment, always try backend first
    if (typeof window !== 'undefined' && window.location) {
      return true;
    }
    // For native environment, check if API URL is configured
    return !!(typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL);
  }

  // Dynamic API selection: determine whether to use backend or local storage
  private async shouldUseBackendAPI(endpoint: string): Promise<boolean> {
    console.log('[API Service] shouldUseBackendAPI called for endpoint:', endpoint);

    // Always use local storage if no API URL is configured
    if (!this.hasApiUrlConfigured()) {
      console.log('[API Service] API URL not configured, using local storage');
      return false;
    }

    console.log('[API Service] API URL configured, testing backend connection');

    // Test backend connection if not tested yet
    if (!this.connectionTested) {
      console.log('[API Service] Testing backend connection...');
      const connectionResult = await this.testConnection();
      this.backendAvailable = connectionResult.success;
      this.connectionTested = true;
      console.log('[API Service] Backend connection test result:', {
        success: connectionResult.success,
        error: connectionResult.error,
        latency: connectionResult.latency
      });
    }

    // Use backend if available
    const useBackend = this.backendAvailable === true;
    console.log('[API Service] Using backend:', useBackend);
    return useBackend;
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
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'Authentication requires backend server connection',
        },
      } as ApiResponse<T>;
    }

    if (endpoint.includes(API_CONFIG.ENDPOINTS.LOGOUT)) {
      await this.removeAuthToken();
      return {
        success: true,
        data: undefined
      } as ApiResponse<T>;
    }

    if (endpoint.includes(API_CONFIG.ENDPOINTS.REGISTER)) {
      return {
        success: false,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'Registration requires backend server connection',
        },
      } as ApiResponse<T>;
    }

    if (endpoint.includes(API_CONFIG.ENDPOINTS.REFRESH)) {
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

  // Test backend connectivity using CORS-enabled API endpoint
  async testConnection(): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    // Use a simple API endpoint that has CORS configured
    const testUrl = `${this.baseURL}/auth/login`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Send an invalid login request to test connectivity
      // We expect this to fail with authentication error, not CORS error
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ email: 'test@connection.com', password: 'invalid' }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      // If we get any response (even error), the connection is working
      if (response.status === 200 || response.status === 400 || response.status === 401) {
        console.log('[API Service] Connection test successful - got response status:', response.status);
        return { success: true, latency };
      } else {
        throw new Error(`Unexpected HTTP status: ${response.status}`);
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      console.log('[API Service] Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
        latency
      };
    }
  }

  // Reset connection test (for debugging)
  resetConnectionTest(): void {
    this.connectionTested = false;
    this.backendAvailable = null;
  }
}

export const apiService = new ApiService();
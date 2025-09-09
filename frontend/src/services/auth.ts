import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { API_CONFIG, STORAGE_KEYS } from '@/constants/api';
import { AuthResponse, LoginForm, SignupForm, User } from '@/types';

class AuthService {
  // Login user
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      credentials
    );

    if (response.success && response.data) {
      await this.storeAuthData(response.data);
      return response.data;
    }

    throw new Error(response.error?.message || 'Login failed');
  }

  // Register user
  async register(userData: SignupForm): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.REGISTER,
      userData
    );

    if (response.success && response.data) {
      await this.storeAuthData(response.data);
      return response.data;
    }

    throw new Error(response.error?.message || 'Registration failed');
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout API
      await apiService.post(API_CONFIG.ENDPOINTS.LOGOUT);
    } catch (error) {
      console.warn('Logout API call failed, clearing local data anyway');
    } finally {
      // Always clear local auth data
      await this.clearAuthData();
    }
  }

  // Refresh access token
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        return null;
      }

      const response = await apiService.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.REFRESH,
        { refreshToken }
      );

      if (response.success && response.data) {
        await this.storeAuthData(response.data);
        return response.data.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearAuthData();
      return null;
    }
  }

  // Store auth data in AsyncStorage
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user)],
      ]);

      // Set token in API service
      await apiService.setAuthToken(authData.accessToken);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  // Clear auth data from AsyncStorage
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      // Remove token from API service
      await apiService.removeAuthToken();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Get current user data
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Initialize auth state (call on app startup)
  async initializeAuth(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (token) {
        await apiService.setAuthToken(token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error initializing auth:', error);
      await this.clearAuthData();
      return false;
    }
  }
}

export const authService = new AuthService();
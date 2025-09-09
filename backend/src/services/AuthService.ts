import { UserModel } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, TokenPair } from '../utils/jwt';
import { User } from '../types/database';

export class AuthService {
  static async register(userData: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }): Promise<{ user: Omit<User, 'password_hash'>; tokens: TokenPair }> {
    // Check if email already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email already registered') as any;
      error.status = 409;
      error.code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    // Check if username already exists
    const existingUsername = await UserModel.findByUsername(userData.username);
    if (existingUsername) {
      const error = new Error('Username already taken') as any;
      error.status = 409;
      error.code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    // Hash password
    const password_hash = await hashPassword(userData.password);

    // Create user
    const user = await UserModel.create({
      email: userData.email,
      username: userData.username,
      password_hash,
      display_name: userData.displayName
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  static async login(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; tokens: TokenPair }> {
    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password') as any;
      error.status = 401;
      error.code = 'AUTHENTICATION_FAILED';
      throw error;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      const error = new Error('Invalid email or password') as any;
      error.status = 401;
      error.code = 'AUTHENTICATION_FAILED';
      throw error;
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const { verifyRefreshToken } = await import('../utils/jwt');
      const payload = verifyRefreshToken(refreshToken);

      // Get user to ensure they still exist and are active
      const user = await UserModel.findById(payload.userId);
      if (!user) {
        const error = new Error('User not found') as any;
        error.status = 401;
        error.code = 'AUTHENTICATION_FAILED';
        throw error;
      }

      // Generate new tokens
      return generateTokens(user);
    } catch (error) {
      const authError = new Error('Invalid refresh token') as any;
      authError.status = 401;
      authError.code = 'AUTHENTICATION_FAILED';
      throw authError;
    }
  }

  static async getUserProfile(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await UserModel.findById(userId);
    if (!user) return null;

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(userId: string, data: {
    display_name?: string;
    avatar_url?: string;
    notification_settings?: any;
  }): Promise<Omit<User, 'password_hash'>> {
    const user = await UserModel.updateProfile(userId, data);
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
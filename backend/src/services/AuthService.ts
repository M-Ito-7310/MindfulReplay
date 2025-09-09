import { getUserRepository } from '../database/repositories';
import { User } from '../database/repositories/userRepository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, TokenPair } from '../utils/jwt';

export class AuthService {
  static async register(userData: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ user: Omit<User, 'password_hash'>; tokens: TokenPair }> {
    const userRepo = getUserRepository();
    
    // Check if email already exists
    const existingUser = await userRepo.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email already registered') as any;
      error.status = 409;
      error.code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    // Hash password
    const password_hash = await hashPassword(userData.password);

    // Create user
    const user = await userRepo.create({
      email: userData.email,
      name: userData.name,
      password_hash
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
    const userRepo = getUserRepository();
    
    // Find user by email
    const user = await userRepo.findByEmail(email);
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

    // Update last login (simplified for mock)
    // await userRepo.update(user.id, { last_login: new Date() });

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

      const userRepo = getUserRepository();
      
      // Get user to ensure they still exist and are active
      const user = await userRepo.findById(payload.userId);
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
    const userRepo = getUserRepository();
    const user = await userRepo.findById(userId);
    if (!user) return null;

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(userId: string, data: {
    name?: string;
  }): Promise<Omit<User, 'password_hash'>> {
    const userRepo = getUserRepository();
    const user = await userRepo.update(userId, data);
    if (!user) {
      const error = new Error('User not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
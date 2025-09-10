import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { 
  userRegistrationSchema, 
  userLoginSchema, 
  refreshTokenSchema 
} from '../utils/validation';
import { ApiResponse } from '../types/api';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = userRegistrationSchema.parse(req.body);

      // Register user
      const result = await AuthService.register({
        email: validatedData.email,
        name: validatedData.username,
        password: validatedData.password
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(201).json(response);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = new Error('Validation failed') as any;
        validationError.status = 422;
        validationError.code = 'VALIDATION_ERROR';
        validationError.details = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return next(validationError);
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { email, password } = userLoginSchema.parse(req.body);

      // Login user
      const result = await AuthService.login(email, password);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = new Error('Validation failed') as any;
        validationError.status = 422;
        validationError.code = 'VALIDATION_ERROR';
        validationError.details = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return next(validationError);
      }
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      // Refresh tokens
      const tokens = await AuthService.refreshToken(refreshToken);

      const response: ApiResponse = {
        success: true,
        data: { tokens },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = new Error('Validation failed') as any;
        validationError.status = 422;
        validationError.code = 'VALIDATION_ERROR';
        validationError.details = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return next(validationError);
      }
      next(error);
    }
  }

  static async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getUserProfile(userId);

      if (!user) {
        const error = new Error('User not found') as any;
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }

      const response: ApiResponse = {
        success: true,
        data: { user },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      // Simple validation for profile update
      const allowedFields = ['display_name', 'avatar_url', 'notification_settings'];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const user = await AuthService.updateProfile(userId, updateData);

      const response: ApiResponse = {
        success: true,
        data: { user },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation, you might want to blacklist the refresh token
      // For now, we just return success
      
      const response: ApiResponse = {
        success: true,
        data: { message: 'Logged out successfully' },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
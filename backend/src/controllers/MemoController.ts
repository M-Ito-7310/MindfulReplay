import { Request, Response, NextFunction } from 'express';
import { MemoService } from '../services/MemoService';
import { memoCreateSchema, memoUpdateSchema, paginationSchema } from '../utils/validation';
import { ApiResponse } from '../types/api';

export class MemoController {
  static async createMemo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validatedData = memoCreateSchema.parse(req.body);

      const memo = await MemoService.createMemo(userId, {
        videoId: validatedData.videoId,
        content: validatedData.content,
        timestampSeconds: validatedData.timestampSeconds,
        isTask: validatedData.isTask,
        isImportant: validatedData.isImportant,
        tags: validatedData.tags
      });

      const response: ApiResponse = {
        success: true,
        data: { memo },
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

  static async getMemos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      const pagination = paginationSchema.parse(req.query);
      
      const options = {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        sort: req.query.sort as 'created_at' | 'updated_at' | 'timestamp_seconds' || 'created_at',
        order: pagination.order || 'desc',
        videoId: req.query.videoId as string,
        isTask: req.query.isTask === 'true' ? true : req.query.isTask === 'false' ? false : undefined,
        isImportant: req.query.isImportant === 'true' ? true : req.query.isImportant === 'false' ? false : undefined,
        search: req.query.search as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined
      };

      const result = await MemoService.getUserMemos(userId, options);

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

  static async getMemo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const memoId = req.params.id;

      const memo = await MemoService.getMemoDetails(memoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { memo },
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

  static async updateMemo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const memoId = req.params.id;
      const validatedData = memoUpdateSchema.parse(req.body);

      const memo = await MemoService.updateMemo(memoId, userId, {
        content: validatedData.content,
        timestampSeconds: validatedData.timestampSeconds,
        isTask: validatedData.isTask,
        isImportant: validatedData.isImportant,
        tags: validatedData.tags
      });

      const response: ApiResponse = {
        success: true,
        data: { memo },
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

  static async deleteMemo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const memoId = req.params.id;

      await MemoService.deleteMemo(memoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Memo deleted successfully' },
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

  static async getVideoMemos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const videoId = req.params.videoId;

      const memos = await MemoService.getVideoMemos(videoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { memos },
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

  static async searchMemos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        const error = new Error('Search query is required') as any;
        error.status = 400;
        error.code = 'VALIDATION_ERROR';
        throw error;
      }

      const pagination = paginationSchema.parse(req.query);
      const options = {
        page: pagination.page || 1,
        limit: pagination.limit || 20
      };

      const result = await MemoService.searchMemos(userId, query.trim(), options);

      const response: ApiResponse = {
        success: true,
        data: result,
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

  static async getImportantMemos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      const pagination = paginationSchema.parse(req.query);
      const options = {
        page: pagination.page || 1,
        limit: pagination.limit || 20
      };

      const result = await MemoService.getImportantMemos(userId, options);

      const response: ApiResponse = {
        success: true,
        data: result,
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

  static async convertToTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const memoId = req.params.id;

      const memo = await MemoService.convertToTask(memoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { memo },
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

  static async toggleImportant(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const memoId = req.params.id;

      const memo = await MemoService.toggleImportant(memoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { memo },
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
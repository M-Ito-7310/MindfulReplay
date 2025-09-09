import { Request, Response, NextFunction } from 'express';
import { VideoService } from '../services/VideoService';
import { videoSaveSchema, paginationSchema } from '../utils/validation';
import { ApiResponse } from '../types/api';

export class VideoController {
  static async saveVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { youtubeUrl, themes } = videoSaveSchema.parse(req.body);

      const video = await VideoService.saveVideo(userId, youtubeUrl, themes);

      const response: ApiResponse = {
        success: true,
        data: { video },
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

  static async getVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      // Validate query parameters
      const pagination = paginationSchema.parse(req.query);
      
      const options = {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        sort: req.query.sort as 'saved_at' | 'published_at' | 'title' || 'saved_at',
        order: pagination.order || 'desc',
        theme: req.query.theme as string,
        search: req.query.search as string,
        archived: req.query.archived === 'true'
      };

      const result = await VideoService.getUserVideos(userId, options);

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

  static async getVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const videoId = req.params.id;

      const video = await VideoService.getVideoDetails(videoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { video },
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

  static async updateVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const videoId = req.params.id;
      
      const allowedFields = ['is_archived', 'themes'];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const video = await VideoService.updateVideo(videoId, userId, updateData);

      const response: ApiResponse = {
        success: true,
        data: { video },
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

  static async deleteVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const videoId = req.params.id;

      await VideoService.deleteVideo(videoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Video deleted successfully' },
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

  static async markAsWatched(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const videoId = req.params.id;

      const video = await VideoService.markAsWatched(videoId, userId);

      const response: ApiResponse = {
        success: true,
        data: { video },
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

  static async searchVideos(req: Request, res: Response, next: NextFunction) {
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

      const result = await VideoService.searchUserVideos(userId, query.trim(), options);

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
}
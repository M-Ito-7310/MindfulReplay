import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';
import { taskCreateSchema, taskUpdateSchema, paginationSchema } from '../utils/validation';
import { ApiResponse } from '../types/api';

export class TaskController {
  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validatedData = taskCreateSchema.parse(req.body);

      const task = await TaskService.createTask(userId, {
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate,
        memoId: validatedData.memoId
      });

      const response: ApiResponse = {
        success: true,
        data: { task },
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

  static async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      const pagination = paginationSchema.parse(req.query);
      
      const options = {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        sort: req.query.sort as 'created_at' | 'updated_at' | 'due_date' | 'priority' || 'created_at',
        order: pagination.order || 'desc',
        status: req.query.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: req.query.priority as 'low' | 'medium' | 'high' | 'urgent',
        search: req.query.search as string,
        videoId: req.query.videoId as string,
        overdue: req.query.overdue === 'true'
      };

      const result = await TaskService.getUserTasks(userId, options);

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

  static async getTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const taskId = req.params.id;

      const task = await TaskService.getTaskDetails(taskId, userId);

      const response: ApiResponse = {
        success: true,
        data: { task },
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

  static async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const taskId = req.params.id;
      const validatedData = taskUpdateSchema.parse(req.body);

      const task = await TaskService.updateTask(taskId, userId, {
        title: validatedData.title,
        description: validatedData.description || undefined,
        priority: validatedData.priority,
        status: validatedData.status,
        dueDate: validatedData.dueDate || undefined
      });

      const response: ApiResponse = {
        success: true,
        data: { task },
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

  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const taskId = req.params.id;

      await TaskService.deleteTask(taskId, userId);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Task deleted successfully' },
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

  static async completeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const taskId = req.params.id;

      const task = await TaskService.completeTask(taskId, userId);

      const response: ApiResponse = {
        success: true,
        data: { task },
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

  static async reopenTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const taskId = req.params.id;

      const task = await TaskService.reopenTask(taskId, userId);

      const response: ApiResponse = {
        success: true,
        data: { task },
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

  static async getTaskStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const stats = await TaskService.getTaskStats(userId);

      const response: ApiResponse = {
        success: true,
        data: { stats },
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

  static async getOverdueTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const tasks = await TaskService.getOverdueTasks(userId);

      const response: ApiResponse = {
        success: true,
        data: { tasks },
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

  static async getUpcomingTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const days = parseInt(req.query.days as string) || 7;

      const tasks = await TaskService.getUpcomingTasks(userId, days);

      const response: ApiResponse = {
        success: true,
        data: { tasks },
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

  static async searchTasks(req: Request, res: Response, next: NextFunction) {
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

      const result = await TaskService.searchTasks(userId, query.trim(), options);

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

  static async createTaskFromMemo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const memoId = req.params.memoId;
      
      const { title, description, priority, dueDate } = req.body;

      const task = await TaskService.createTaskFromMemo(memoId, userId, {
        title,
        description,
        priority,
        dueDate
      });

      const response: ApiResponse = {
        success: true,
        data: { task },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const dashboard = await TaskService.getDashboardData(userId);

      const response: ApiResponse = {
        success: true,
        data: dashboard,
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
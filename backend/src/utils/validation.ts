import { z } from 'zod';

export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character'),
  displayName: z.string().max(100, 'Display name must be less than 100 characters').optional()
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const videoSaveSchema = z.object({
  youtubeUrl: z.string()
    .url('Invalid URL format')
    .regex(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/, 
           'Invalid YouTube URL'),
  themes: z.array(z.string().uuid('Invalid theme ID')).optional()
});

export const memoCreateSchema = z.object({
  videoId: z.string().uuid('Invalid video ID'),
  content: z.string().min(1, 'Content is required').max(65535, 'Content is too long'),
  timestampSeconds: z.number().int().min(0).optional(),
  isTask: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(100)).optional()
});

export const memoUpdateSchema = z.object({
  content: z.string().min(1, 'Content is required').max(65535, 'Content is too long').optional(),
  timestampSeconds: z.number().int().min(0).nullable().optional(),
  isTask: z.boolean().optional(),
  isImportant: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(100)).optional()
});

export const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().max(65535, 'Description is too long').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
  memoId: z.string().uuid('Invalid memo ID').optional(),
  videoId: z.string().uuid('Invalid video ID').optional()
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long').optional(),
  description: z.string().max(65535, 'Description is too long').nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional()
});

export const themeCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().max(65535, 'Description is too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color code').optional(),
  icon: z.string().max(50, 'Icon name is too long').optional()
});

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
});
import { getMemoRepository, getVideoRepository } from '../database/repositories';
import { Memo } from '../database/repositories/memoRepository';
import { PaginatedResponse } from '../types/api';

export class MemoService {
  static async createMemo(
    userId: string,
    data: {
      videoId: string;
      content: string;
      timestampSeconds?: number;
      isTask?: boolean;
      isImportant?: boolean;
      tags?: string[];
    }
  ): Promise<Memo> {
    const videoRepo = getVideoRepository();
    const memoRepo = getMemoRepository();

    // Verify video belongs to user
    const video = await videoRepo.findById(data.videoId);
    if (!video || video.user_id !== userId) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Create memo using simplified schema (tags will be handled later)
    const memo = await memoRepo.create({
      user_id: userId,
      video_id: data.videoId,
      content: data.content,
      timestamp_sec: data.timestampSeconds
    });

    // TODO: Handle tags when we implement tag system
    // For now, return the memo without tag details

    return memo;
  }

  static async getUserMemos(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'created_at' | 'updated_at' | 'timestamp_seconds';
      order?: 'asc' | 'desc';
      videoId?: string;
      isTask?: boolean;
      isImportant?: boolean;
      search?: string;
      tags?: string[];
    } = {}
  ): Promise<PaginatedResponse<Memo>> {
    const memoRepo = getMemoRepository();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let result;
    if (options.videoId) {
      // Get memos for specific video
      result = await memoRepo.findByUserIdAndVideoId(userId, options.videoId, {
        limit, offset
      });
    } else if (options.search) {
      // Search memos by content
      result = await memoRepo.searchByContent(userId, options.search, {
        limit, offset
      });
    } else {
      // Get all user memos
      result = await memoRepo.findByUserId(userId, {
        limit, offset
      });
    }

    const totalPages = Math.ceil(result.total / limit);

    return {
      items: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static async getMemoDetails(memoId: string, userId: string): Promise<Memo> {
    const memoRepo = getMemoRepository();
    const memo = await memoRepo.findById(memoId);
    
    if (!memo) {
      const error = new Error('Memo not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Check if memo belongs to user
    if (memo.user_id !== userId) {
      const error = new Error('Access denied') as any;
      error.status = 403;
      error.code = 'ACCESS_DENIED';
      throw error;
    }

    return memo;
  }

  static async updateMemo(
    memoId: string,
    userId: string,
    data: {
      content?: string;
      timestampSeconds?: number | null;
      isTask?: boolean;
      isImportant?: boolean;
      tags?: string[];
    }
  ): Promise<Memo> {
    const memoRepo = getMemoRepository();
    
    // First verify memo exists and belongs to user
    const existingMemo = await this.getMemoDetails(memoId, userId);
    
    // Update memo properties
    const updateData: any = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.timestampSeconds !== undefined) updateData.timestamp_sec = data.timestampSeconds;
    
    // TODO: Handle isTask, isImportant, tags when we implement tag system
    // For now, only update content and timestamp
    
    if (Object.keys(updateData).length > 0) {
      const updatedMemo = await memoRepo.update(memoId, updateData);
      if (!updatedMemo) {
        const error = new Error('Failed to update memo') as any;
        error.status = 500;
        error.code = 'UPDATE_FAILED';
        throw error;
      }
      return updatedMemo;
    }

    return existingMemo;
  }

  static async deleteMemo(memoId: string, userId: string): Promise<void> {
    const memoRepo = getMemoRepository();
    
    // First verify memo exists and belongs to user
    await this.getMemoDetails(memoId, userId);
    
    // TODO: Handle tag cleanup when we implement tag system
    
    // Delete memo
    const deleted = await memoRepo.delete(memoId);
    if (!deleted) {
      const error = new Error('Failed to delete memo') as any;
      error.status = 500;
      error.code = 'DELETE_FAILED';
      throw error;
    }
  }

  static async getVideoMemos(videoId: string, userId: string): Promise<Memo[]> {
    const memoRepo = getMemoRepository();
    
    const result = await memoRepo.findByUserIdAndVideoId(userId, videoId, {
      limit: 1000 // Get all memos for a video
    });

    return result.data;
  }

  static async getMemosWithTimestamps(videoId: string, userId: string): Promise<Memo[]> {
    const memoRepo = getMemoRepository();
    
    const result = await memoRepo.findByUserIdAndVideoId(userId, videoId, {
      limit: 1000
    });
    
    // Filter only memos with timestamps
    return result.data.filter(memo => memo.timestamp_sec !== null && memo.timestamp_sec !== undefined);
  }

  static async searchMemos(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Memo>> {
    return this.getUserMemos(userId, {
      ...options,
      search: query
    });
  }

  static async getImportantMemos(
    userId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Memo>> {
    return this.getUserMemos(userId, {
      ...options,
      isImportant: true,
      sort: 'created_at',
      order: 'desc'
    });
  }

  static async getTaskMemos(
    userId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Memo>> {
    return this.getUserMemos(userId, {
      ...options,
      isTask: true,
      sort: 'created_at',
      order: 'desc'
    });
  }

  static async convertToTask(memoId: string, userId: string): Promise<Memo> {
    return this.updateMemo(memoId, userId, { isTask: true });
  }

  static async toggleImportant(memoId: string, userId: string): Promise<Memo> {
    // TODO: Implement when we add is_important field to memo schema
    const memo = await this.getMemoDetails(memoId, userId);
    // For now, just return the memo as-is since we haven't implemented isImportant field
    return memo;
  }
}
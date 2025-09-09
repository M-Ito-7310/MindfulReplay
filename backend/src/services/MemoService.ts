import { MemoModel, MemoWithDetails } from '../models/Memo';
import { TagModel } from '../models/Tag';
import { VideoModel } from '../models/Video';
import { Memo } from '../types/database';
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
  ): Promise<MemoWithDetails> {
    // Verify video belongs to user
    const video = await VideoModel.findById(data.videoId, userId);
    if (!video) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Create memo
    const memo = await MemoModel.create({
      user_id: userId,
      video_id: data.videoId,
      content: data.content,
      timestamp_seconds: data.timestampSeconds || null,
      is_task: data.isTask || false,
      is_important: data.isImportant || false
    });

    // Handle tags if provided
    if (data.tags && data.tags.length > 0) {
      const tagIds: string[] = [];
      
      for (const tagName of data.tags) {
        const tag = await TagModel.findOrCreate(userId, tagName);
        tagIds.push(tag.id);
      }

      await MemoModel.addTags(memo.id, userId, tagIds);
    }

    // Return memo with details
    const memoDetails = await MemoModel.findById(memo.id, userId);
    return memoDetails!;
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
  ): Promise<PaginatedResponse<MemoWithDetails>> {
    const { memos, total } = await MemoModel.findByUser(userId, {
      ...options,
      video_id: options.videoId
    });

    const page = options.page || 1;
    const limit = options.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      items: memos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static async getMemoDetails(memoId: string, userId: string): Promise<MemoWithDetails> {
    const memo = await MemoModel.findById(memoId, userId);
    
    if (!memo) {
      const error = new Error('Memo not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
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
  ): Promise<MemoWithDetails> {
    // Update memo properties
    const updateData: any = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.timestampSeconds !== undefined) updateData.timestamp_seconds = data.timestampSeconds;
    if (data.isTask !== undefined) updateData.is_task = data.isTask;
    if (data.isImportant !== undefined) updateData.is_important = data.isImportant;

    if (Object.keys(updateData).length > 0) {
      await MemoModel.update(memoId, userId, updateData);
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      const tagIds: string[] = [];
      
      for (const tagName of data.tags) {
        const tag = await TagModel.findOrCreate(userId, tagName);
        tagIds.push(tag.id);
      }

      await MemoModel.addTags(memoId, userId, tagIds);
    }

    // Return updated memo
    return this.getMemoDetails(memoId, userId);
  }

  static async deleteMemo(memoId: string, userId: string): Promise<void> {
    // Get memo to decrement tag usage
    const memo = await MemoModel.findById(memoId, userId);
    if (!memo) {
      const error = new Error('Memo not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Decrement tag usage counts
    if (memo.tags && memo.tags.length > 0) {
      for (const tag of memo.tags) {
        await TagModel.decrementUsage(tag.id);
      }
    }

    // Delete memo (cascade will handle memo_tags)
    await MemoModel.delete(memoId, userId);

    // Clean up unused tags
    await TagModel.cleanupUnused(userId);
  }

  static async getVideoMemos(videoId: string, userId: string): Promise<MemoWithDetails[]> {
    const { memos } = await MemoModel.findByUser(userId, {
      video_id: videoId,
      sort: 'timestamp_seconds',
      order: 'asc',
      limit: 1000 // Get all memos for a video
    });

    return memos;
  }

  static async getMemosWithTimestamps(videoId: string, userId: string): Promise<Memo[]> {
    return MemoModel.getByVideoWithTimestamps(videoId, userId);
  }

  static async searchMemos(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<MemoWithDetails>> {
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
  ): Promise<PaginatedResponse<MemoWithDetails>> {
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
  ): Promise<PaginatedResponse<MemoWithDetails>> {
    return this.getUserMemos(userId, {
      ...options,
      isTask: true,
      sort: 'created_at',
      order: 'desc'
    });
  }

  static async convertToTask(memoId: string, userId: string): Promise<MemoWithDetails> {
    return this.updateMemo(memoId, userId, { isTask: true });
  }

  static async toggleImportant(memoId: string, userId: string): Promise<MemoWithDetails> {
    const memo = await this.getMemoDetails(memoId, userId);
    return this.updateMemo(memoId, userId, { isImportant: !memo.is_important });
  }
}
import { getVideoRepository } from '../database/repositories';
import { Video } from '../database/repositories/videoRepository';
import { YouTubeService } from './YouTubeService';
import { PaginatedResponse } from '../types/api';

export class VideoService {
  static async saveVideo(
    userId: string, 
    youtubeUrl: string, 
    _themeIds: string[] = []
  ): Promise<Video> {
    const videoRepo = getVideoRepository();
    
    // Extract YouTube ID from URL
    const youtubeId = YouTubeService.extractVideoId(youtubeUrl);
    if (!youtubeId) {
      const error = new Error('Invalid YouTube URL') as any;
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Check if video already exists for this user
    const existingVideo = await videoRepo.findByUserIdAndYoutubeId(userId, youtubeId);
    if (existingVideo) {
      // TODO: Handle themes when we implement theme system
      return existingVideo;
    }

    // Get video metadata from YouTube API
    const metadata = await YouTubeService.getVideoMetadata(youtubeId);

    // Create video record
    const video = await videoRepo.create({
      user_id: userId,
      youtube_id: metadata.youtubeId,
      youtube_url: youtubeUrl,
      title: metadata.title,
      description: metadata.description,
      channel_name: metadata.channelName,
      thumbnail_url: metadata.thumbnailUrl,
      duration: metadata.duration,
      published_at: metadata.publishedAt.toISOString()
    });

    // TODO: Handle themes when we implement theme system

    return video;
  }

  static async getUserVideos(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'created_at' | 'updated_at' | 'title';
      order?: 'asc' | 'desc';
      search?: string;
    } = {}
  ): Promise<PaginatedResponse<Video>> {
    const videoRepo = getVideoRepository();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let result;
    if (options.search) {
      result = await videoRepo.searchByTitle(userId, options.search, {
        limit,
        offset
      });
    } else {
      result = await videoRepo.findByUserId(userId, {
        limit,
        offset
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

  static async getVideoDetails(videoId: string, userId: string): Promise<Video> {
    const videoRepo = getVideoRepository();
    const video = await videoRepo.findById(videoId);
    
    if (!video) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Check if video belongs to user
    if (video.user_id !== userId) {
      const error = new Error('Access denied') as any;
      error.status = 403;
      error.code = 'ACCESS_DENIED';
      throw error;
    }

    return video;
  }

  static async updateVideo(
    videoId: string, 
    userId: string, 
    data: {
      notes?: string;
    }
  ): Promise<Video> {
    const videoRepo = getVideoRepository();
    
    // First verify video exists and belongs to user
    await this.getVideoDetails(videoId, userId);
    
    // Update video properties
    const updateData: any = {};
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (Object.keys(updateData).length > 0) {
      const updatedVideo = await videoRepo.update(videoId, updateData);
      if (!updatedVideo) {
        const error = new Error('Failed to update video') as any;
        error.status = 500;
        error.code = 'UPDATE_FAILED';
        throw error;
      }
      return updatedVideo;
    }

    // Return current video if no updates
    return this.getVideoDetails(videoId, userId);
  }

  static async deleteVideo(videoId: string, userId: string): Promise<void> {
    const videoRepo = getVideoRepository();
    
    // First verify video exists and belongs to user
    await this.getVideoDetails(videoId, userId);
    
    // Delete video
    const deleted = await videoRepo.delete(videoId);
    if (!deleted) {
      const error = new Error('Failed to delete video') as any;
      error.status = 500;
      error.code = 'DELETE_FAILED';
      throw error;
    }
  }

  static async markAsWatched(videoId: string, userId: string): Promise<Video> {
    // First verify video exists and belongs to user
    const video = await this.getVideoDetails(videoId, userId);
    
    // TODO: Implement watch tracking when we add those fields to schema
    // For now, just return the video as-is
    return video;
  }

  static async searchUserVideos(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Video>> {
    return this.getUserVideos(userId, {
      ...options,
      search: query
    });
  }
}
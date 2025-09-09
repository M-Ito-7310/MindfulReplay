import { VideoModel, VideoWithDetails } from '../models/Video';
import { YouTubeService } from './YouTubeService';
import { Video } from '../types/database';
import { PaginatedResponse } from '../types/api';

export class VideoService {
  static async saveVideo(
    userId: string, 
    youtubeUrl: string, 
    themeIds: string[] = []
  ): Promise<VideoWithDetails> {
    // Extract YouTube ID from URL
    const youtubeId = YouTubeService.extractVideoId(youtubeUrl);
    if (!youtubeId) {
      const error = new Error('Invalid YouTube URL') as any;
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Check if video already exists for this user
    const existingVideo = await VideoModel.findByUserAndYouTubeId(userId, youtubeId);
    if (existingVideo) {
      // Update themes if provided and return existing video
      if (themeIds.length > 0) {
        await VideoModel.addToThemes(existingVideo.id, userId, themeIds);
      }
      
      const videoDetails = await VideoModel.findById(existingVideo.id, userId);
      return videoDetails!;
    }

    // Get video metadata from YouTube API
    const metadata = await YouTubeService.getVideoMetadata(youtubeId);

    // Create video record
    const video = await VideoModel.create({
      user_id: userId,
      youtube_id: metadata.youtubeId,
      title: metadata.title,
      description: metadata.description,
      channel_name: metadata.channelName,
      channel_id: metadata.channelId,
      thumbnail_url: metadata.thumbnailUrl,
      duration: metadata.duration,
      published_at: metadata.publishedAt,
      metadata: {
        view_count: metadata.viewCount,
        like_count: metadata.likeCount,
        tags: metadata.tags
      }
    });

    // Add to themes if provided
    if (themeIds.length > 0) {
      await VideoModel.addToThemes(video.id, userId, themeIds);
    }

    // Return video with themes
    const videoDetails = await VideoModel.findById(video.id, userId);
    return videoDetails!;
  }

  static async getUserVideos(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'saved_at' | 'published_at' | 'title';
      order?: 'asc' | 'desc';
      theme?: string;
      search?: string;
      archived?: boolean;
    } = {}
  ): Promise<PaginatedResponse<VideoWithDetails>> {
    const { videos, total } = await VideoModel.findByUser(userId, options);

    const page = options.page || 1;
    const limit = options.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      items: videos,
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

  static async getVideoDetails(videoId: string, userId: string): Promise<VideoWithDetails> {
    const video = await VideoModel.findById(videoId, userId);
    
    if (!video) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    return video;
  }

  static async updateVideo(
    videoId: string, 
    userId: string, 
    data: {
      is_archived?: boolean;
      themes?: string[];
    }
  ): Promise<VideoWithDetails> {
    // Update video properties
    const updateData: any = {};
    if (data.is_archived !== undefined) {
      updateData.is_archived = data.is_archived;
    }

    if (Object.keys(updateData).length > 0) {
      await VideoModel.update(videoId, userId, updateData);
    }

    // Update themes if provided
    if (data.themes !== undefined) {
      await VideoModel.addToThemes(videoId, userId, data.themes);
    }

    // Return updated video
    return this.getVideoDetails(videoId, userId);
  }

  static async deleteVideo(videoId: string, userId: string): Promise<void> {
    await VideoModel.delete(videoId, userId);
  }

  static async markAsWatched(videoId: string, userId: string): Promise<Video> {
    const video = await VideoModel.findById(videoId, userId);
    
    if (!video) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    return VideoModel.update(videoId, userId, {
      last_watched_at: new Date(),
      watch_count: (video.watch_count || 0) + 1
    });
  }

  static async searchUserVideos(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<VideoWithDetails>> {
    return this.getUserVideos(userId, {
      ...options,
      search: query
    });
  }
}
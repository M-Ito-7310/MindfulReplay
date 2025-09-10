import { VideoRepository, Video, CreateVideoData, UpdateVideoData } from '../videoRepository';
import { ListResponse, QueryOptions } from '../baseRepository';
import { mockDb } from '../../mockDatabase';

export class MockVideoRepository implements VideoRepository {
  async create(data: CreateVideoData): Promise<Video> {
    const video = mockDb.createVideo(data);
    return video;
  }

  async findById(id: string): Promise<Video | null> {
    const video = mockDb.getVideoById(id);
    return video || null;
  }

  async findByUserId(userId: string, options?: QueryOptions): Promise<ListResponse<Video>> {
    let videos = mockDb.getVideosByUserId(userId);
    
    // Apply pagination if specified
    const total = videos.length;
    if (options?.offset) {
      videos = videos.slice(options.offset);
    }
    if (options?.limit) {
      videos = videos.slice(0, options.limit);
    }

    return {
      data: videos,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByYouTubeId(youtubeId: string): Promise<Video | null> {
    const allVideos = Array.from((mockDb as any).videos.values()) as Video[];
    const video = allVideos.find((v: Video) => v.youtube_id === youtubeId);
    return video || null;
  }

  async findByUserIdAndYoutubeId(userId: string, youtubeId: string): Promise<Video | null> {
    const userVideos = mockDb.getVideosByUserId(userId);
    const video = userVideos.find(v => v.youtube_id === youtubeId);
    return video || null;
  }

  async searchByTitle(userId: string, query: string, options?: QueryOptions): Promise<ListResponse<Video>> {
    let userVideos = mockDb.getVideosByUserId(userId);
    
    // Simple text search in title and description
    const searchResults = userVideos.filter(video => 
      video.title.toLowerCase().includes(query.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(query.toLowerCase()))
    );

    // Apply pagination
    const total = searchResults.length;
    let results = searchResults;
    if (options?.offset) {
      results = results.slice(options.offset);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return {
      data: results,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async update(id: string, data: UpdateVideoData): Promise<Video | null> {
    const video = mockDb.updateVideo(id, data);
    return video || null;
  }

  async delete(id: string): Promise<boolean> {
    return mockDb.deleteVideo(id);
  }
}
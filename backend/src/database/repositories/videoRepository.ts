import { BaseRepository, ListResponse, QueryOptions } from './baseRepository';

export interface Video {
  id: string;
  user_id: string;
  youtube_id: string;
  youtube_url: string;
  title: string;
  thumbnail_url?: string;
  description?: string;
  duration?: number;
  channel_name?: string;
  published_at?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVideoData {
  user_id: string;
  youtube_id: string;
  youtube_url: string;
  title: string;
  thumbnail_url?: string;
  description?: string;
  duration?: number;
  channel_name?: string;
  published_at?: string;
  notes?: string;
}

export interface UpdateVideoData {
  title?: string;
  thumbnail_url?: string;
  description?: string;
  duration?: number;
  channel_name?: string;
  published_at?: string;
  notes?: string;
}

export interface VideoRepository extends BaseRepository<Video, CreateVideoData, UpdateVideoData> {
  findByUserId(userId: string, options?: QueryOptions): Promise<ListResponse<Video>>;
  findByYouTubeId(youtubeId: string): Promise<Video | null>;
  findByUserIdAndYoutubeId(userId: string, youtubeId: string): Promise<Video | null>;
  searchByTitle(userId: string, query: string, options?: QueryOptions): Promise<ListResponse<Video>>;
}
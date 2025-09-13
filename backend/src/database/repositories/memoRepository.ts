import { BaseRepository, ListResponse, QueryOptions } from './baseRepository';

export interface Memo {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  timestamp_sec?: number;
  created_at: Date;
  updated_at: Date;
}

export interface MemoWithVideo extends Memo {
  video?: {
    id: string;
    title: string;
    youtube_id: string;
    thumbnail_url: string | null;
  };
}

export interface CreateMemoData {
  user_id: string;
  video_id: string;
  content: string;
  timestamp_sec?: number;
}

export interface UpdateMemoData {
  content?: string;
  timestamp_sec?: number;
}

export interface MemoRepository extends BaseRepository<Memo, CreateMemoData, UpdateMemoData> {
  findByUserId(userId: string, options?: QueryOptions): Promise<ListResponse<Memo>>;
  findByVideoId(videoId: string, options?: QueryOptions): Promise<ListResponse<Memo>>;
  searchByContent(userId: string, query: string, options?: QueryOptions): Promise<ListResponse<Memo>>;
  findByUserIdAndVideoId(userId: string, videoId: string, options?: QueryOptions): Promise<ListResponse<Memo>>;

  // Methods that include video information
  findByUserIdWithVideo(userId: string, options?: QueryOptions): Promise<ListResponse<MemoWithVideo>>;
  findByIdWithVideo(id: string): Promise<MemoWithVideo | null>;
}
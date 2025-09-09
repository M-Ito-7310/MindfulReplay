import axios from 'axios';

interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
}

interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number; };
      medium: { url: string; width: number; height: number; };
      high: { url: string; width: number; height: number; };
      standard?: { url: string; width: number; height: number; };
      maxres?: { url: string; width: number; height: number; };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    regionRestriction?: {
      allowed?: string[];
      blocked?: string[];
    };
    contentRating: any;
    projection: string;
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    dislikeCount?: string;
    favoriteCount: string;
    commentCount?: string;
  };
}

export interface VideoMetadata {
  youtubeId: string;
  title: string;
  description: string;
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  publishedAt: Date;
  viewCount: number;
  likeCount: number | null;
  tags: string[];
}

export class YouTubeService {
  private static readonly API_KEY = process.env.YOUTUBE_API_KEY;
  private static readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  static async getVideoMetadata(youtubeId: string): Promise<VideoMetadata> {
    if (!this.API_KEY) {
      throw new Error('YouTube API key is not configured');
    }

    try {
      const response = await axios.get<YouTubeVideoResponse>(
        `${this.BASE_URL}/videos`,
        {
          params: {
            key: this.API_KEY,
            id: youtubeId,
            part: 'snippet,contentDetails,statistics'
          }
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        const error = new Error('Video not found') as any;
        error.status = 404;
        error.code = 'RESOURCE_NOT_FOUND';
        throw error;
      }

      const video = response.data.items[0];
      const duration = this.parseDuration(video.contentDetails.duration);

      return {
        youtubeId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelId: video.snippet.channelId,
        channelName: video.snippet.channelTitle,
        thumbnailUrl: video.snippet.thumbnails.high?.url || 
                     video.snippet.thumbnails.medium?.url || 
                     video.snippet.thumbnails.default.url,
        duration,
        publishedAt: new Date(video.snippet.publishedAt),
        viewCount: parseInt(video.statistics.viewCount, 10),
        likeCount: video.statistics.likeCount ? parseInt(video.statistics.likeCount, 10) : null,
        tags: video.snippet.tags || []
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        const apiError = new Error('YouTube API quota exceeded or access forbidden') as any;
        apiError.status = 502;
        apiError.code = 'YOUTUBE_API_ERROR';
        throw apiError;
      }

      if (error.response?.status === 404) {
        const notFoundError = new Error('Video not found or is private') as any;
        notFoundError.status = 404;
        notFoundError.code = 'RESOURCE_NOT_FOUND';
        throw notFoundError;
      }

      if (error.status && error.code) {
        throw error;
      }

      const serviceError = new Error('YouTube API service unavailable') as any;
      serviceError.status = 502;
      serviceError.code = 'YOUTUBE_API_ERROR';
      throw serviceError;
    }
  }

  private static parseDuration(duration: string): number {
    // Parse ISO 8601 duration format (PT1H23M45S)
    const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    
    if (!match) {
      return 0;
    }

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  static async searchVideos(query: string, maxResults: number = 10): Promise<any[]> {
    if (!this.API_KEY) {
      throw new Error('YouTube API key is not configured');
    }

    try {
      const response = await axios.get(
        `${this.BASE_URL}/search`,
        {
          params: {
            key: this.API_KEY,
            q: query,
            part: 'snippet',
            type: 'video',
            maxResults
          }
        }
      );

      return response.data.items || [];
    } catch (error: any) {
      if (error.response?.status === 403) {
        const apiError = new Error('YouTube API quota exceeded') as any;
        apiError.status = 502;
        apiError.code = 'YOUTUBE_API_ERROR';
        throw apiError;
      }

      const serviceError = new Error('YouTube search service unavailable') as any;
      serviceError.status = 502;
      serviceError.code = 'YOUTUBE_API_ERROR';
      throw serviceError;
    }
  }
}
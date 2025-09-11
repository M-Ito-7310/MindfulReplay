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
  private static readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';
  
  private static getApiKey(): string | undefined {
    return process.env.YOUTUBE_API_KEY;
  }
  
  private static shouldUseMock(): boolean {
    return process.env.YOUTUBE_USE_MOCK === 'true' || !process.env.YOUTUBE_API_KEY;
  }

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
    console.log(`[YouTubeService] Getting metadata for video ID: ${youtubeId}`);
    
    const apiKey = this.getApiKey();
    const useMock = this.shouldUseMock();
    
    console.log(`[YouTubeService] API Key configured: ${!!apiKey}`);
    console.log(`[YouTubeService] Using mock mode: ${useMock}`);

    // Use mock data if API key is not configured or mock mode is enabled
    if (useMock) {
      console.log(`[YouTubeService] Fetching mock metadata for: ${youtubeId}`);
      const mockData = this.getMockVideoMetadata(youtubeId);
      console.log(`[YouTubeService] Mock data returned:`, mockData);
      return mockData;
    }

    if (!apiKey) {
      throw new Error('YouTube API key is not configured');
    }

    try {
      const apiUrl = `${this.BASE_URL}/videos`;
      const params = {
        key: apiKey,
        id: youtubeId,
        part: 'snippet,contentDetails,statistics'
      };
      
      const response = await axios.get<YouTubeVideoResponse>(apiUrl, { params });

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

  private static getMockVideoMetadata(youtubeId: string): VideoMetadata {
    // Mock data for development and testing
    const mockVideos: Record<string, VideoMetadata> = {
      'dQw4w9WgXcQ': {
        youtubeId: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
        description: 'The official video for "Never Gonna Give You Up" by Rick Astley. Never Gonna Give You Up was a global smash on its release in July 1987, topping the charts...',
        channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
        channelName: 'Rick Astley',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        duration: 213, // 3:33
        publishedAt: new Date('2009-10-25T00:00:00Z'),
        viewCount: 1000000000,
        likeCount: 10000000,
        tags: ['Rick Astley', 'Never Gonna Give You Up', '80s', 'pop']
      },
      'jNQXAC9IVRw': {
        youtubeId: 'jNQXAC9IVRw',
        title: 'Me at the zoo',
        description: 'The first video on YouTube. Recorded at the San Diego Zoo.',
        channelId: 'UC4QobU6STFB0P71PMvOGN5A',
        channelName: 'jawed',
        thumbnailUrl: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
        duration: 19,
        publishedAt: new Date('2005-04-23T00:00:00Z'),
        viewCount: 250000000,
        likeCount: 5000000,
        tags: ['first video', 'zoo', 'elephants']
      }
    };

    // Return specific mock data if available, otherwise generate generic mock data
    if (mockVideos[youtubeId]) {
      return mockVideos[youtubeId];
    }

    // Generate generic mock data for unknown video IDs
    return {
      youtubeId,
      title: `Sample Video - ${youtubeId}`,
      description: `This is a mock video for development purposes. YouTube ID: ${youtubeId}. This video demonstrates the video metadata retrieval functionality without requiring actual YouTube API calls.`,
      channelId: 'UC_MOCK_CHANNEL_ID',
      channelName: 'Mock Channel',
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      duration: 300, // 5 minutes
      publishedAt: new Date(),
      viewCount: Math.floor(Math.random() * 1000000),
      likeCount: Math.floor(Math.random() * 50000),
      tags: ['mock', 'development', 'sample']
    };
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
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('YouTube API key is not configured');
    }

    try {
      const response = await axios.get(
        `${this.BASE_URL}/search`,
        {
          params: {
            key: apiKey,
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
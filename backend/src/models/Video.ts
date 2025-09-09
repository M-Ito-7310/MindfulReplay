import db from '../database/connection';
import { Video } from '../types/database';

export interface VideoWithDetails extends Video {
  themes?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
  memo_count?: number;
  task_count?: number;
}

export class VideoModel {
  static async create(videoData: {
    user_id: string;
    youtube_id: string;
    title: string;
    description?: string;
    channel_name?: string;
    channel_id?: string;
    thumbnail_url?: string;
    duration?: number;
    published_at?: Date;
    metadata?: any;
  }): Promise<Video> {
    const [video] = await db('videos')
      .insert({
        ...videoData,
        metadata: JSON.stringify(videoData.metadata || {})
      })
      .returning('*');

    return {
      ...video,
      metadata: JSON.parse(video.metadata || '{}')
    };
  }

  static async findByUserAndYouTubeId(userId: string, youtubeId: string): Promise<Video | null> {
    const video = await db('videos')
      .where({ user_id: userId, youtube_id: youtubeId })
      .first();

    if (!video) return null;

    return {
      ...video,
      metadata: JSON.parse(video.metadata || '{}')
    };
  }

  static async findById(id: string, userId: string): Promise<VideoWithDetails | null> {
    const video = await db('videos')
      .leftJoin('video_themes', 'videos.id', 'video_themes.video_id')
      .leftJoin('themes', 'video_themes.theme_id', 'themes.id')
      .select([
        'videos.*',
        db.raw('COALESCE(json_agg(DISTINCT jsonb_build_object(\'id\', themes.id, \'name\', themes.name, \'color\', themes.color)) FILTER (WHERE themes.id IS NOT NULL), \'[]\') as themes'),
        db.raw('(SELECT COUNT(*) FROM memos WHERE video_id = videos.id) as memo_count'),
        db.raw('(SELECT COUNT(*) FROM tasks WHERE video_id = videos.id) as task_count')
      ])
      .where({ 'videos.id': id, 'videos.user_id': userId })
      .groupBy('videos.id')
      .first();

    if (!video) return null;

    return {
      ...video,
      metadata: JSON.parse(video.metadata || '{}'),
      themes: JSON.parse(video.themes || '[]')
    };
  }

  static async findByUser(
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
  ): Promise<{ videos: VideoWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sort = 'saved_at',
      order = 'desc',
      theme,
      search,
      archived = false
    } = options;

    const offset = (page - 1) * limit;

    let query = db('videos')
      .leftJoin('video_themes', 'videos.id', 'video_themes.video_id')
      .leftJoin('themes', 'video_themes.theme_id', 'themes.id')
      .select([
        'videos.*',
        db.raw('COALESCE(json_agg(DISTINCT jsonb_build_object(\'id\', themes.id, \'name\', themes.name, \'color\', themes.color)) FILTER (WHERE themes.id IS NOT NULL), \'[]\') as themes'),
        db.raw('(SELECT COUNT(*) FROM memos WHERE video_id = videos.id) as memo_count')
      ])
      .where('videos.user_id', userId)
      .where('videos.is_archived', archived);

    if (theme) {
      query = query.where('themes.id', theme);
    }

    if (search) {
      query = query.where(function() {
        this.whereILike('videos.title', `%${search}%`)
            .orWhereILike('videos.description', `%${search}%`)
            .orWhereILike('videos.channel_name', `%${search}%`);
      });
    }

    query = query
      .groupBy('videos.id')
      .orderBy(`videos.${sort}`, order)
      .limit(limit)
      .offset(offset);

    const videos = await query;

    // Get total count
    let countQuery = db('videos')
      .where('videos.user_id', userId)
      .where('videos.is_archived', archived);

    if (theme) {
      countQuery = countQuery
        .join('video_themes', 'videos.id', 'video_themes.video_id')
        .where('video_themes.theme_id', theme);
    }

    if (search) {
      countQuery = countQuery.where(function() {
        this.whereILike('videos.title', `%${search}%`)
            .orWhereILike('videos.description', `%${search}%`)
            .orWhereILike('videos.channel_name', `%${search}%`);
      });
    }

    const [{ count }] = await countQuery.count('videos.id as count');

    const processedVideos = videos.map(video => ({
      ...video,
      metadata: JSON.parse(video.metadata || '{}'),
      themes: JSON.parse(video.themes || '[]')
    }));

    return {
      videos: processedVideos,
      total: parseInt(count as string, 10)
    };
  }

  static async update(id: string, userId: string, data: {
    is_archived?: boolean;
    last_watched_at?: Date;
    watch_count?: number;
    metadata?: any;
  }): Promise<Video> {
    const updateData: any = { ...data };
    
    if (updateData.metadata) {
      updateData.metadata = JSON.stringify(updateData.metadata);
    }

    const [video] = await db('videos')
      .where({ id, user_id: userId })
      .update(updateData)
      .returning('*');

    if (!video) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    return {
      ...video,
      metadata: JSON.parse(video.metadata || '{}')
    };
  }

  static async delete(id: string, userId: string): Promise<void> {
    const deletedRows = await db('videos')
      .where({ id, user_id: userId })
      .del();

    if (deletedRows === 0) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
  }

  static async addToThemes(videoId: string, userId: string, themeIds: string[]): Promise<void> {
    // Verify video belongs to user
    const video = await db('videos')
      .where({ id: videoId, user_id: userId })
      .first();

    if (!video) {
      const error = new Error('Video not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Remove existing themes
    await db('video_themes')
      .where({ video_id: videoId })
      .del();

    // Add new themes
    if (themeIds.length > 0) {
      const insertData = themeIds.map(themeId => ({
        video_id: videoId,
        theme_id: themeId
      }));

      await db('video_themes').insert(insertData);
    }
  }
}
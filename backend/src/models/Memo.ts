import db from '../database/connection';
import { Memo } from '../types/database';

export interface MemoWithDetails extends Memo {
  video?: {
    id: string;
    title: string;
    youtube_id: string;
    thumbnail_url: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

export class MemoModel {
  static async create(memoData: {
    user_id: string;
    video_id: string;
    content: string;
    timestamp_seconds?: number | null;
    is_task?: boolean;
    is_important?: boolean;
  }): Promise<Memo> {
    const [memo] = await db('memos')
      .insert({
        ...memoData,
        is_task: memoData.is_task || false,
        is_important: memoData.is_important || false
      })
      .returning('*');

    return memo;
  }

  static async findById(id: string, userId: string): Promise<MemoWithDetails | null> {
    const memo = await db('memos')
      .leftJoin('videos', 'memos.video_id', 'videos.id')
      .leftJoin('memo_tags', 'memos.id', 'memo_tags.memo_id')
      .leftJoin('tags', 'memo_tags.tag_id', 'tags.id')
      .select([
        'memos.*',
        'videos.id as video_id',
        'videos.title as video_title',
        'videos.youtube_id as video_youtube_id',
        'videos.thumbnail_url as video_thumbnail_url',
        db.raw('COALESCE(json_agg(DISTINCT jsonb_build_object(\'id\', tags.id, \'name\', tags.name)) FILTER (WHERE tags.id IS NOT NULL), \'[]\') as tags')
      ])
      .where({ 'memos.id': id, 'memos.user_id': userId })
      .groupBy([
        'memos.id', 
        'videos.id', 
        'videos.title', 
        'videos.youtube_id', 
        'videos.thumbnail_url'
      ])
      .first();

    if (!memo) return null;

    return {
      id: memo.id,
      user_id: memo.user_id,
      video_id: memo.video_id,
      content: memo.content,
      timestamp_seconds: memo.timestamp_seconds,
      is_task: memo.is_task,
      is_important: memo.is_important,
      created_at: memo.created_at,
      updated_at: memo.updated_at,
      video: memo.video_id ? {
        id: memo.video_id,
        title: memo.video_title,
        youtube_id: memo.video_youtube_id,
        thumbnail_url: memo.video_thumbnail_url
      } : undefined,
      tags: JSON.parse(memo.tags || '[]')
    };
  }

  static async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: 'created_at' | 'updated_at' | 'timestamp_seconds';
      order?: 'asc' | 'desc';
      video_id?: string;
      is_task?: boolean;
      is_important?: boolean;
      search?: string;
      tags?: string[];
    } = {}
  ): Promise<{ memos: MemoWithDetails[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'desc',
      video_id,
      is_task,
      is_important,
      search,
      tags
    } = options;

    const offset = (page - 1) * limit;

    let query = db('memos')
      .leftJoin('videos', 'memos.video_id', 'videos.id')
      .leftJoin('memo_tags', 'memos.id', 'memo_tags.memo_id')
      .leftJoin('tags', 'memo_tags.tag_id', 'tags.id')
      .select([
        'memos.*',
        'videos.id as video_id',
        'videos.title as video_title',
        'videos.youtube_id as video_youtube_id',
        'videos.thumbnail_url as video_thumbnail_url',
        db.raw('COALESCE(json_agg(DISTINCT jsonb_build_object(\'id\', tags.id, \'name\', tags.name)) FILTER (WHERE tags.id IS NOT NULL), \'[]\') as tags')
      ])
      .where('memos.user_id', userId);

    if (video_id) {
      query = query.where('memos.video_id', video_id);
    }

    if (is_task !== undefined) {
      query = query.where('memos.is_task', is_task);
    }

    if (is_important !== undefined) {
      query = query.where('memos.is_important', is_important);
    }

    if (search) {
      query = query.whereILike('memos.content', `%${search}%`);
    }

    if (tags && tags.length > 0) {
      query = query.whereIn('tags.id', tags);
    }

    query = query
      .groupBy([
        'memos.id', 
        'videos.id', 
        'videos.title', 
        'videos.youtube_id', 
        'videos.thumbnail_url'
      ])
      .orderBy(`memos.${sort}`, order)
      .limit(limit)
      .offset(offset);

    const memos = await query;

    // Get total count
    let countQuery = db('memos')
      .where('memos.user_id', userId);

    if (video_id) {
      countQuery = countQuery.where('memos.video_id', video_id);
    }

    if (is_task !== undefined) {
      countQuery = countQuery.where('memos.is_task', is_task);
    }

    if (is_important !== undefined) {
      countQuery = countQuery.where('memos.is_important', is_important);
    }

    if (search) {
      countQuery = countQuery.whereILike('memos.content', `%${search}%`);
    }

    if (tags && tags.length > 0) {
      countQuery = countQuery
        .join('memo_tags', 'memos.id', 'memo_tags.memo_id')
        .whereIn('memo_tags.tag_id', tags)
        .distinct('memos.id');
    }

    const [{ count }] = await countQuery.count('memos.id as count');

    const processedMemos = memos.map(memo => ({
      id: memo.id,
      user_id: memo.user_id,
      video_id: memo.video_id,
      content: memo.content,
      timestamp_seconds: memo.timestamp_seconds,
      is_task: memo.is_task,
      is_important: memo.is_important,
      created_at: memo.created_at,
      updated_at: memo.updated_at,
      video: memo.video_id ? {
        id: memo.video_id,
        title: memo.video_title,
        youtube_id: memo.video_youtube_id,
        thumbnail_url: memo.video_thumbnail_url
      } : undefined,
      tags: JSON.parse(memo.tags || '[]')
    }));

    return {
      memos: processedMemos,
      total: parseInt(count as string, 10)
    };
  }

  static async update(id: string, userId: string, data: {
    content?: string;
    timestamp_seconds?: number | null;
    is_task?: boolean;
    is_important?: boolean;
  }): Promise<Memo> {
    const [memo] = await db('memos')
      .where({ id, user_id: userId })
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');

    if (!memo) {
      const error = new Error('Memo not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    return memo;
  }

  static async delete(id: string, userId: string): Promise<void> {
    const deletedRows = await db('memos')
      .where({ id, user_id: userId })
      .del();

    if (deletedRows === 0) {
      const error = new Error('Memo not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
  }

  static async addTags(memoId: string, userId: string, tagIds: string[]): Promise<void> {
    // Verify memo belongs to user
    const memo = await db('memos')
      .where({ id: memoId, user_id: userId })
      .first();

    if (!memo) {
      const error = new Error('Memo not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }

    // Remove existing tags
    await db('memo_tags')
      .where({ memo_id: memoId })
      .del();

    // Add new tags
    if (tagIds.length > 0) {
      const insertData = tagIds.map(tagId => ({
        memo_id: memoId,
        tag_id: tagId
      }));

      await db('memo_tags').insert(insertData);
    }
  }

  static async getByVideoWithTimestamps(videoId: string, userId: string): Promise<Memo[]> {
    return db('memos')
      .where({
        video_id: videoId,
        user_id: userId
      })
      .whereNotNull('timestamp_seconds')
      .orderBy('timestamp_seconds', 'asc');
  }
}
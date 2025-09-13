import { MemoRepository, Memo, MemoWithVideo, CreateMemoData, UpdateMemoData } from '../memoRepository';
import { ListResponse, QueryOptions } from '../baseRepository';
import { mockDb } from '../../mockDatabase';

export class MockMemoRepository implements MemoRepository {
  async create(data: CreateMemoData): Promise<Memo> {
    const memo = mockDb.createMemo(data);
    return memo;
  }

  async findById(id: string): Promise<Memo | null> {
    const memo = mockDb.getMemoById(id);
    return memo || null;
  }

  async findByUserId(userId: string, options?: QueryOptions): Promise<ListResponse<Memo>> {
    let memos = mockDb.getMemosByUserId(userId);
    
    // Apply pagination if specified
    const total = memos.length;
    if (options?.offset) {
      memos = memos.slice(options.offset);
    }
    if (options?.limit) {
      memos = memos.slice(0, options.limit);
    }

    return {
      data: memos,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByVideoId(videoId: string, options?: QueryOptions): Promise<ListResponse<Memo>> {
    let memos = mockDb.getMemosByVideoId(videoId);
    
    // Apply pagination if specified
    const total = memos.length;
    if (options?.offset) {
      memos = memos.slice(options.offset);
    }
    if (options?.limit) {
      memos = memos.slice(0, options.limit);
    }

    return {
      data: memos,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByUserIdAndVideoId(userId: string, videoId: string, options?: QueryOptions): Promise<ListResponse<Memo>> {
    let allMemos = mockDb.getMemosByVideoId(videoId);
    let memos = allMemos.filter(memo => memo.user_id === userId);
    
    // Apply pagination if specified
    const total = memos.length;
    if (options?.offset) {
      memos = memos.slice(options.offset);
    }
    if (options?.limit) {
      memos = memos.slice(0, options.limit);
    }

    return {
      data: memos,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async searchByContent(userId: string, query: string, options?: QueryOptions): Promise<ListResponse<Memo>> {
    let userMemos = mockDb.getMemosByUserId(userId);
    
    // Simple text search in memo content
    const searchResults = userMemos.filter(memo => 
      memo.content.toLowerCase().includes(query.toLowerCase())
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

  async update(id: string, data: UpdateMemoData): Promise<Memo | null> {
    const memo = mockDb.updateMemo(id, data);
    return memo || null;
  }

  async delete(id: string): Promise<boolean> {
    return mockDb.deleteMemo(id);
  }

  async findByUserIdWithVideo(userId: string, options?: QueryOptions): Promise<ListResponse<MemoWithVideo>> {
    let memos = mockDb.getMemosByUserId(userId);

    // Add video information to each memo
    const memosWithVideo = memos.map(memo => {
      const video = mockDb.getVideoById(memo.video_id);
      return {
        ...memo,
        video: video ? {
          id: video.id,
          title: video.title,
          youtube_id: video.youtube_id,
          thumbnail_url: video.thumbnail_url
        } : undefined
      };
    });

    // Apply pagination if specified
    const total = memosWithVideo.length;
    let result = memosWithVideo;
    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return {
      data: result,
      total,
      limit: options?.limit,
      offset: options?.offset
    };
  }

  async findByIdWithVideo(id: string): Promise<MemoWithVideo | null> {
    const memo = mockDb.getMemoById(id);
    if (!memo) return null;

    const video = mockDb.getVideoById(memo.video_id);
    return {
      ...memo,
      video: video ? {
        id: video.id,
        title: video.title,
        youtube_id: video.youtube_id,
        thumbnail_url: video.thumbnail_url
      } : undefined
    };
  }
}
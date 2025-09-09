import db from '../database/connection';
import { Tag } from '../types/database';

export class TagModel {
  static async create(userId: string, name: string): Promise<Tag> {
    const [tag] = await db('tags')
      .insert({
        user_id: userId,
        name: name.trim(),
        usage_count: 1
      })
      .returning('*');

    return tag;
  }

  static async findByName(userId: string, name: string): Promise<Tag | null> {
    return db('tags')
      .where({
        user_id: userId,
        name: name.trim()
      })
      .first();
  }

  static async findById(id: string, userId: string): Promise<Tag | null> {
    return db('tags')
      .where({ id, user_id: userId })
      .first();
  }

  static async findByUser(userId: string, options: {
    search?: string;
    limit?: number;
  } = {}): Promise<Tag[]> {
    const { search, limit = 100 } = options;

    let query = db('tags')
      .where('user_id', userId)
      .orderBy('usage_count', 'desc')
      .orderBy('name', 'asc')
      .limit(limit);

    if (search) {
      query = query.whereILike('name', `%${search}%`);
    }

    return query;
  }

  static async findOrCreate(userId: string, name: string): Promise<Tag> {
    const trimmedName = name.trim();
    
    // Try to find existing tag
    let tag = await this.findByName(userId, trimmedName);
    
    if (tag) {
      // Increment usage count
      await db('tags')
        .where({ id: tag.id })
        .increment('usage_count', 1);
      
      tag.usage_count += 1;
      return tag;
    }

    // Create new tag
    return this.create(userId, trimmedName);
  }

  static async incrementUsage(id: string): Promise<void> {
    await db('tags')
      .where({ id })
      .increment('usage_count', 1);
  }

  static async decrementUsage(id: string): Promise<void> {
    await db('tags')
      .where({ id })
      .where('usage_count', '>', 0)
      .decrement('usage_count', 1);
  }

  static async getPopularTags(userId: string, limit: number = 20): Promise<Tag[]> {
    return db('tags')
      .where('user_id', userId)
      .where('usage_count', '>', 0)
      .orderBy('usage_count', 'desc')
      .orderBy('name', 'asc')
      .limit(limit);
  }

  static async delete(id: string, userId: string): Promise<void> {
    const deletedRows = await db('tags')
      .where({ id, user_id: userId })
      .del();

    if (deletedRows === 0) {
      const error = new Error('Tag not found') as any;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      throw error;
    }
  }

  static async cleanupUnused(userId: string): Promise<number> {
    // Delete tags with 0 usage count
    return db('tags')
      .where({
        user_id: userId,
        usage_count: 0
      })
      .del();
  }
}
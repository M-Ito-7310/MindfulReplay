import db from '../database/connection';
import { User } from '../types/database';

export class UserModel {
  static async create(userData: {
    email: string;
    username: string;
    password_hash: string;
    display_name?: string;
  }): Promise<User> {
    const [user] = await db('users')
      .insert({
        ...userData,
        notification_settings: JSON.stringify({
          email: true,
          push: true,
          reminder: true
        })
      })
      .returning('*');

    return {
      ...user,
      notification_settings: JSON.parse(user.notification_settings)
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    if (!user) return null;

    return {
      ...user,
      notification_settings: JSON.parse(user.notification_settings)
    };
  }

  static async findByUsername(username: string): Promise<User | null> {
    const user = await db('users')
      .where({ username, is_active: true })
      .first();

    if (!user) return null;

    return {
      ...user,
      notification_settings: JSON.parse(user.notification_settings)
    };
  }

  static async findById(id: string): Promise<User | null> {
    const user = await db('users')
      .where({ id, is_active: true })
      .first();

    if (!user) return null;

    return {
      ...user,
      notification_settings: JSON.parse(user.notification_settings)
    };
  }

  static async updateLastLogin(id: string): Promise<void> {
    await db('users')
      .where({ id })
      .update({ last_login_at: new Date() });
  }

  static async updateProfile(id: string, data: {
    display_name?: string;
    avatar_url?: string;
    notification_settings?: any;
  }): Promise<User> {
    const updateData: any = { ...data };
    
    if (updateData.notification_settings) {
      updateData.notification_settings = JSON.stringify(updateData.notification_settings);
    }

    const [user] = await db('users')
      .where({ id })
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');

    return {
      ...user,
      notification_settings: JSON.parse(user.notification_settings)
    };
  }

  static async verifyEmail(id: string): Promise<void> {
    await db('users')
      .where({ id })
      .update({
        email_verified: true,
        email_verified_at: new Date(),
        updated_at: new Date()
      });
  }

  static async deactivate(id: string): Promise<void> {
    await db('users')
      .where({ id })
      .update({
        is_active: false,
        updated_at: new Date()
      });
  }
}
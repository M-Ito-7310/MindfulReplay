import { UserRepository, User, CreateUserData, UpdateUserData } from '../userRepository';
import { QueryOptions } from '../baseRepository';
import { mockDb } from '../../mockDatabase';

export class MockUserRepository implements UserRepository {
  async create(data: CreateUserData): Promise<User> {
    const user = mockDb.createUser(data);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = mockDb.getUserById(id);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = mockDb.getUserByEmail(email);
    return user || null;
  }

  async findAll(_options?: QueryOptions): Promise<User[]> {
    // In a real implementation, this would apply pagination and ordering
    // For mock, we'll return all users (not realistic for production)
    return Array.from((mockDb as any).users.values());
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const user = mockDb.updateUser(id, data);
    return user || null;
  }

  async delete(_id: string): Promise<boolean> {
    // For now, we won't implement user deletion in mock
    // This would be a complex operation affecting all related data
    return false;
  }
}
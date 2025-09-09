import { BaseRepository, QueryOptions } from './baseRepository';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  password_hash: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password_hash?: string;
}

export interface UserRepository extends BaseRepository<User, CreateUserData, UpdateUserData> {
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: QueryOptions): Promise<User[]>;
}
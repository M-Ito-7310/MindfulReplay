import { UserRepository } from './userRepository';
import { VideoRepository } from './videoRepository';
import { MemoRepository } from './memoRepository';
import { TaskRepository } from './taskRepository';
import { MockUserRepository } from './mock/mockUserRepository';
import { MockVideoRepository } from './mock/mockVideoRepository';
import { MockMemoRepository } from './mock/mockMemoRepository';
import { MockTaskRepository } from './mock/mockTaskRepository';

// Repository factory for dependency injection
export interface Repositories {
  userRepository: UserRepository;
  videoRepository: VideoRepository;
  memoRepository: MemoRepository;
  taskRepository: TaskRepository;
  // TODO: Add other repositories as they're implemented
  // reminderRepository: ReminderRepository;
}

// Database adapter type
export type DatabaseAdapter = 'mock' | 'postgresql';

// Factory function to create repositories based on environment
export function createRepositories(adapter: DatabaseAdapter = 'mock'): Repositories {
  switch (adapter) {
    case 'mock':
      return {
        userRepository: new MockUserRepository(),
        videoRepository: new MockVideoRepository(),
        memoRepository: new MockMemoRepository(),
        taskRepository: new MockTaskRepository(),
      };
    
    case 'postgresql':
      // TODO: Implement PostgreSQL repositories
      throw new Error('PostgreSQL repositories not yet implemented');
      // return {
      //   userRepository: new PostgreSQLUserRepository(),
      //   videoRepository: new PostgreSQLVideoRepository(),
      // };
    
    default:
      throw new Error(`Unsupported database adapter: ${adapter}`);
  }
}

// Global repository instance
let repositories: Repositories;

export function initRepositories(adapter?: DatabaseAdapter): void {
  const selectedAdapter = adapter || (process.env.DATABASE_ADAPTER as DatabaseAdapter) || 'mock';
  repositories = createRepositories(selectedAdapter);
  console.log(`📦 Repositories initialized with ${selectedAdapter} adapter`);
}

export function getRepositories(): Repositories {
  if (!repositories) {
    initRepositories();
  }
  return repositories;
}

// Export individual repository getters for convenience
export const getUserRepository = (): UserRepository => getRepositories().userRepository;
export const getVideoRepository = (): VideoRepository => getRepositories().videoRepository;
export const getMemoRepository = (): MemoRepository => getRepositories().memoRepository;
export const getTaskRepository = (): TaskRepository => getRepositories().taskRepository;
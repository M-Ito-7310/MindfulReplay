import bcrypt from 'bcryptjs';
import { mockDb } from './mockDatabase';

export async function seedMockData() {
  // Clear existing data
  mockDb.clear();

  // Create test users
  const testPassword = await bcrypt.hash('password123', 12);
  
  mockDb.createUser({
    email: 'test@example.com',
    name: 'テストユーザー',
    password_hash: testPassword
  });

  mockDb.createUser({
    email: 'demo@mindfulreplay.com',
    name: 'デモユーザー',
    password_hash: testPassword
  });

  console.log('Mock data seeded successfully!');
  console.log('Created 2 test users');
  console.log('Videos, memos, and tasks will be created through the application');
}
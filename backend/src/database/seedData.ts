import bcrypt from 'bcryptjs';
import { mockDb } from './mockDatabase';

export async function seedMockData() {
  // Clear existing data
  mockDb.clear();

  // Create test users
  const testPassword = await bcrypt.hash('password123', 12);
  
  const user1 = mockDb.createUser({
    email: 'test@example.com',
    name: 'テストユーザー',
    password_hash: testPassword
  });

  const user2 = mockDb.createUser({
    email: 'demo@mindfulreplay.com',
    name: 'デモユーザー',
    password_hash: testPassword
  });

  // Create test tags
  const learningTag = mockDb.createTag({
    name: 'プログラミング学習',
    color: '#4A90E2'
  });

  const businessTag = mockDb.createTag({
    name: 'ビジネススキル',
    color: '#50C878'
  });

  const mindsetTag = mockDb.createTag({
    name: 'マインドセット',
    color: '#FF6B6B'
  });

  // Create test videos for user1
  const video1 = mockDb.createVideo({
    user_id: user1.id,
    youtube_id: 'dQw4w9WgXcQ',
    title: 'TypeScript入門 - 基本的な型の使い方',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: 'TypeScriptの基本的な型システムについて学ぶ動画です。',
    duration: 900, // 15 minutes
    metadata: {
      channel: 'プログラミング学習チャンネル',
      published_at: '2024-01-15',
      view_count: 125000
    }
  });

  const video2 = mockDb.createVideo({
    user_id: user1.id,
    youtube_id: 'abc123def456',
    title: 'React Nativeでモバイルアプリ開発',
    thumbnail_url: 'https://img.youtube.com/vi/abc123def456/maxresdefault.jpg',
    description: 'React Nativeを使ったクロスプラットフォーム開発の解説',
    duration: 1200, // 20 minutes
    metadata: {
      channel: 'モバイル開発者',
      published_at: '2024-02-01',
      view_count: 89000
    }
  });

  const video3 = mockDb.createVideo({
    user_id: user1.id,
    youtube_id: 'xyz789uvw012',
    title: '効果的な学習方法 - スペースドリピティション',
    thumbnail_url: 'https://img.youtube.com/vi/xyz789uvw012/maxresdefault.jpg',
    description: '記憶を定着させる効果的な復習方法について',
    duration: 720, // 12 minutes
    metadata: {
      channel: '学習効率化チャンネル',
      published_at: '2024-01-28',
      view_count: 156000
    }
  });

  // Create test memos for video1
  const memo1 = mockDb.createMemo({
    user_id: user1.id,
    video_id: video1.id,
    content: 'TypeScriptの型注釈は変数の後にコロンをつけて指定する。例: let name: string = "太郎"',
    timestamp_sec: 120
  });

  const memo2 = mockDb.createMemo({
    user_id: user1.id,
    video_id: video1.id,
    content: 'interfaceを使って複雑な型を定義できる。オブジェクトの型を明確にするために重要。',
    timestamp_sec: 300
  });

  const memo3 = mockDb.createMemo({
    user_id: user1.id,
    video_id: video1.id,
    content: 'ユニオン型（|）を使って複数の型を指定可能。例: string | number',
    timestamp_sec: 480
  });

  // Create test memos for video2
  const memo4 = mockDb.createMemo({
    user_id: user1.id,
    video_id: video2.id,
    content: 'Expo CLIを使うとReact Nativeの開発環境構築が簡単になる',
    timestamp_sec: 60
  });

  const memo5 = mockDb.createMemo({
    user_id: user1.id,
    video_id: video2.id,
    content: 'StyleSheetを使ってスタイリング。CSSに似ているがcamelCase記法を使用',
    timestamp_sec: 420
  });

  // Create test memos for video3
  const memo6 = mockDb.createMemo({
    user_id: user1.id,
    video_id: video3.id,
    content: '復習の間隔: 1日→3日→7日→14日→30日と徐々に延ばしていく',
    timestamp_sec: 180
  });

  const memo7 = mockDb.createMemo({
    user_id: user1.id,
    video_id: video3.id,
    content: '忘却曲線を考慮して、忘れる前に復習することが重要',
    timestamp_sec: 360
  });

  // Create test tasks
  const task1 = mockDb.createTask({
    user_id: user1.id,
    memo_id: memo1.id,
    title: 'TypeScript型注釈の練習',
    description: '変数の型注釈を実際にコードで書いて練習する',
    status: 'pending',
    priority: 'high',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
  });

  const task2 = mockDb.createTask({
    user_id: user1.id,
    memo_id: memo2.id,
    title: 'interfaceを使った型定義の実装',
    description: 'ユーザー情報を表すinterfaceを定義してみる',
    status: 'in_progress',
    priority: 'medium',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
  });

  const task3 = mockDb.createTask({
    user_id: user1.id,
    memo_id: memo4.id,
    title: 'Expo CLIでサンプルアプリ作成',
    description: 'React NativeとExpoを使って簡単なTodoアプリを作成',
    status: 'completed',
    priority: 'medium'
  });

  const task4 = mockDb.createTask({
    user_id: user1.id,
    memo_id: memo6.id,
    title: 'スペースドリピティションの実践',
    description: '学習した内容を間隔を空けて復習するスケジュールを立てる',
    status: 'pending',
    priority: 'high',
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
  });

  const task5 = mockDb.createTask({
    user_id: user1.id,
    title: 'MindfulReplayアプリのUI改善',
    description: '学習したデザインパターンをアプリに適用する',
    status: 'pending',
    priority: 'low',
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks from now
  });

  // Create test reminders
  const reminder1 = mockDb.createReminder({
    user_id: user1.id,
    memo_id: memo1.id,
    title: 'TypeScript型注釈の復習',
    scheduled_for: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    interval_days: 3,
    is_active: true
  });

  const reminder2 = mockDb.createReminder({
    user_id: user1.id,
    memo_id: memo6.id,
    title: 'スペースドリピティションの実践確認',
    scheduled_for: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    interval_days: 7,
    is_active: true
  });

  const reminder3 = mockDb.createReminder({
    user_id: user1.id,
    task_id: task1.id,
    title: 'TypeScript練習の締切リマインダー',
    scheduled_for: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    is_active: true
  });

  // Create some data for user2 (demo user)
  const demoVideo = mockDb.createVideo({
    user_id: user2.id,
    youtube_id: 'demo123video',
    title: 'ビジネス効率化のテクニック',
    thumbnail_url: 'https://img.youtube.com/vi/demo123video/maxresdefault.jpg',
    description: '日々の業務を効率化するための実践的なテクニック',
    duration: 1080, // 18 minutes
    metadata: {
      channel: 'ビジネス効率化ラボ',
      published_at: '2024-02-10',
      view_count: 67000
    }
  });

  const demoMemo = mockDb.createMemo({
    user_id: user2.id,
    video_id: demoVideo.id,
    content: 'ポモドーロテクニック: 25分集中→5分休憩のサイクルを繰り返す',
    timestamp_sec: 240
  });

  const demoTask = mockDb.createTask({
    user_id: user2.id,
    memo_id: demoMemo.id,
    title: 'ポモドーロテクニックの実践',
    description: '今日の作業でポモドーロテクニックを試してみる',
    status: 'pending',
    priority: 'medium',
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
  });

  console.log('✅ Mock database seeded successfully!');
  console.log(`Created ${mockDb.getCounts(user1.id).videos} videos, ${mockDb.getCounts(user1.id).memos} memos, ${mockDb.getCounts(user1.id).tasks} tasks for test user`);
  
  return {
    testUser: user1,
    demoUser: user2,
    sampleVideo: video1,
    sampleMemo: memo1,
    sampleTask: task1
  };
}
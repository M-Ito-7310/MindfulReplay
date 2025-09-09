# MindfulReplay コンポーネント構造設計

## 📋 概要

React Native（Expo）フロントエンドのコンポーネント構造とフォルダ構成の詳細設計書です。

## 🏗️ プロジェクト構造

```
frontend/src/
├── components/          # 共通UIコンポーネント
│   ├── ui/             # 基本UIコンポーネント
│   ├── forms/          # フォーム関連
│   ├── layout/         # レイアウトコンポーネント
│   └── media/          # メディア関連コンポーネント
├── screens/            # 画面コンポーネント
│   ├── auth/           # 認証画面
│   ├── video/          # 動画関連画面
│   ├── memo/           # メモ関連画面
│   ├── task/           # タスク関連画面
│   └── settings/       # 設定画面
├── navigation/         # ナビゲーション設定
├── hooks/              # カスタムフック
├── services/           # API通信・外部サービス
├── store/              # 状態管理（Zustand）
├── utils/              # ユーティリティ関数
├── types/              # TypeScript型定義
└── constants/          # 定数定義
```

## 🧩 基本UIコンポーネント

### 1. components/ui/基本コンポーネント

#### Button
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string; // @expo/vector-icons name
  fullWidth?: boolean;
}

// 使用例
<Button
  title="ログイン"
  variant="primary"
  size="large"
  onPress={handleLogin}
  loading={isLoading}
  fullWidth
/>
```

#### Input
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: 'text' | 'email' | 'password' | 'url';
  error?: string;
  helperText?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}
```

#### Card
```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  pressable?: boolean;
  onPress?: () => void;
}
```

#### Loading
```typescript
interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean; // 全画面オーバーレイ
}
```

### 2. components/forms/フォーム関連

#### AuthForm
```typescript
interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: AuthFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

interface AuthFormData {
  email: string;
  password: string;
  username?: string; // register時のみ
  displayName?: string; // register時のみ
}
```

#### VideoImportForm
```typescript
interface VideoImportFormProps {
  onSubmit: (url: string, themes: string[]) => Promise<void>;
  themes: Theme[];
  loading?: boolean;
}
```

#### MemoForm
```typescript
interface MemoFormProps {
  initialData?: Partial<Memo>;
  videoId: string;
  currentTimestamp?: number;
  onSubmit: (memo: MemoFormData) => Promise<void>;
  onCancel: () => void;
}

interface MemoFormData {
  content: string;
  timestampSeconds?: number;
  isTask: boolean;
  isImportant: boolean;
  tags: string[];
}
```

### 3. components/layout/レイアウト

#### SafeScreen
```typescript
interface SafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark';
  header?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}
```

#### Header
```typescript
interface HeaderProps {
  title: string;
  leftButton?: {
    icon: string;
    onPress: () => void;
  };
  rightButton?: {
    icon: string;
    onPress: () => void;
  };
  subtitle?: string;
  searchable?: boolean;
  onSearch?: (query: string) => void;
}
```

#### TabBar
```typescript
interface TabBarProps {
  activeTab: string;
  tabs: TabConfig[];
  onTabChange: (tabId: string) => void;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}
```

## 📱 画面コンポーネント

### 1. screens/auth/認証画面

#### LoginScreen
```typescript
const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const navigation = useNavigation();
  
  const handleLogin = async (data: AuthFormData) => {
    await login(data.email, data.password);
    navigation.navigate('Home');
  };

  return (
    <SafeScreen>
      <AuthForm
        mode="login"
        onSubmit={handleLogin}
      />
    </SafeScreen>
  );
};
```

#### RegisterScreen
Similar structure with registration logic

### 2. screens/video/動画関連画面

#### VideoListScreen
```typescript
interface VideoListScreenProps {
  route: RouteProp<VideoStackParams, 'VideoList'>;
}

const VideoListScreen: React.FC<VideoListScreenProps> = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VideoFilters>({});
  
  // 動画一覧取得、フィルタリング、検索機能
};
```

#### VideoDetailScreen
```typescript
interface VideoDetailScreenProps {
  route: RouteProp<VideoStackParams, 'VideoDetail'>;
}

const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({ route }) => {
  const { videoId } = route.params;
  const [video, setVideo] = useState<VideoWithDetails | null>(null);
  
  return (
    <SafeScreen scrollable>
      <VideoPlayer video={video} />
      <VideoInfo video={video} />
      <MemoList videoId={videoId} />
      <TaskList videoId={videoId} />
    </SafeScreen>
  );
};
```

### 3. screens/memo/メモ関連画面

#### MemoListScreen
メモ一覧表示、検索、フィルタリング機能

#### MemoDetailScreen
メモ詳細表示・編集機能

### 4. screens/task/タスク関連画面

#### TaskListScreen
```typescript
const TaskListScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortBy, setSortBy] = useState<TaskSortBy>('dueDate');
  
  return (
    <SafeScreen>
      <TaskStats tasks={tasks} />
      <TaskFilters
        activeFilter={filter}
        onFilterChange={setFilter}
      />
      <TaskList
        tasks={filteredTasks}
        onTaskUpdate={handleTaskUpdate}
      />
    </SafeScreen>
  );
};
```

## 🎯 専用UIコンポーネント

### 1. components/media/メディア関連

#### VideoPlayer
```typescript
interface VideoPlayerProps {
  video: Video;
  onTimeUpdate?: (seconds: number) => void;
  initialTime?: number;
  memos?: Memo[]; // タイムスタンプマーカー表示用
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onTimeUpdate, memos }) => {
  return (
    <WebView
      source={{ uri: `https://www.youtube.com/embed/${video.youtubeId}` }}
      style={{ height: 240 }}
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'timeupdate') {
          onTimeUpdate?.(data.currentTime);
        }
      }}
    />
  );
};
```

#### VideoCard
```typescript
interface VideoCardProps {
  video: Video;
  onPress: (video: Video) => void;
  onLongPress?: (video: Video) => void;
  showMemoCount?: boolean;
  showWatchProgress?: boolean;
}
```

#### VideoThumbnail
```typescript
interface VideoThumbnailProps {
  thumbnailUrl: string;
  duration?: number;
  size?: 'small' | 'medium' | 'large';
  aspectRatio?: number;
  playIcon?: boolean;
}
```

### 2. components/memo/メモ関連

#### MemoCard
```typescript
interface MemoCardProps {
  memo: Memo;
  onPress?: (memo: Memo) => void;
  onEdit?: (memo: Memo) => void;
  onDelete?: (memo: Memo) => void;
  onCreateTask?: (memo: Memo) => void;
  showVideo?: boolean;
  showTimestamp?: boolean;
}
```

#### MemoTimeline
```typescript
interface MemoTimelineProps {
  memos: Memo[];
  videoDuration?: number;
  onMemoPress: (memo: Memo) => void;
  onTimestampPress: (seconds: number) => void;
}
```

#### TimestampPicker
```typescript
interface TimestampPickerProps {
  videoDuration: number;
  currentTime?: number;
  onTimeSelect: (seconds: number) => void;
  memos?: Memo[]; // 既存メモのタイムスタンプ表示
}
```

### 3. components/task/タスク関連

#### TaskCard
```typescript
interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onPriorityChange?: (task: Task, priority: TaskPriority) => void;
  showVideo?: boolean;
  showMemo?: boolean;
}
```

#### TaskStats
```typescript
interface TaskStatsProps {
  tasks: Task[];
  period?: 'week' | 'month' | 'all';
}

const TaskStats: React.FC<TaskStatsProps> = ({ tasks, period = 'week' }) => {
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
  }), [tasks]);
  
  return (
    <Card>
      <StatsRow stats={stats} />
      <ProgressBar
        completed={stats.completed}
        total={stats.total}
      />
    </Card>
  );
};
```

## 🔧 カスタムフック

### 1. hooks/useAuth.ts
```typescript
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const useAuth = (): UseAuthReturn => {
  // 認証状態管理、トークン管理
};
```

### 2. hooks/useVideo.ts
```typescript
interface UseVideoReturn {
  videos: Video[];
  loading: boolean;
  error: string | null;
  fetchVideos: (filters?: VideoFilters) => Promise<void>;
  saveVideo: (url: string, themes?: string[]) => Promise<Video>;
  updateVideo: (id: string, data: Partial<Video>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
}
```

### 3. hooks/useMemo.ts
```typescript
interface UseMemoReturn {
  memos: Memo[];
  loading: boolean;
  createMemo: (data: CreateMemoData) => Promise<Memo>;
  updateMemo: (id: string, data: Partial<Memo>) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  searchMemos: (query: string) => Promise<Memo[]>;
}
```

## 🎨 スタイル設計

### 1. Design System

#### Colors
```typescript
const colors = {
  primary: '#3B82F6',
  primaryLight: '#93C5FD',
  primaryDark: '#1E40AF',
  secondary: '#10B981',
  accent: '#F59E0B',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  
  // Neutral colors
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
};
```

#### Typography
```typescript
const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
};
```

#### Spacing
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### 2. Styled Components利用パターン
```typescript
const StyledButton = styled.TouchableOpacity<{ variant: ButtonVariant }>`
  padding: ${spacing.md}px ${spacing.lg}px;
  border-radius: 8px;
  background-color: ${({ variant }) =>
    variant === 'primary' ? colors.primary : colors.gray200};
`;

const ButtonText = styled.Text<{ variant: ButtonVariant }>`
  font-size: ${typography.body1.fontSize}px;
  font-weight: ${typography.body1.fontWeight};
  color: ${({ variant }) =>
    variant === 'primary' ? colors.background : colors.textPrimary};
  text-align: center;
`;
```

## 📊 状態管理設計

### Zustand Store構造
```typescript
// store/authStore.ts
interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// store/videoStore.ts
interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  filters: VideoFilters;
  setVideos: (videos: Video[]) => void;
  addVideo: (video: Video) => void;
  updateVideo: (id: string, data: Partial<Video>) => void;
  setCurrentVideo: (video: Video | null) => void;
  setFilters: (filters: VideoFilters) => void;
}
```

## 🧪 テスト戦略

### Component Testing
```typescript
// __tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  test('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
```

---

*この設計書は実装の進捗に応じて継続的に更新され、詳細化されます*
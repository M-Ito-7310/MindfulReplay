# MindfulReplay データベース設計書

## 📋 概要

PostgreSQL 14+を使用したMindfulReplayのデータベース設計の詳細説明と設計思想を記載します。

## 🎯 設計思想・原則

### 1. 設計原則

| 原則 | 説明 | 実装方法 |
|------|------|----------|
| **正規化** | データの整合性と冗長性排除 | 第3正規形まで正規化 |
| **拡張性** | 将来的な機能追加に対応 | JSONBカラム、抽象テーブル設計 |
| **パフォーマンス** | 高速なクエリ実行 | 戦略的インデックス配置 |
| **整合性** | データの品質保証 | 外部キー制約、CHECK制約 |
| **監査可能性** | データの変更履歴追跡 | created_at/updated_atカラム |
| **国際化対応** | 多言語データの管理 | UTF-8エンコーディング |

### 2. 技術選択の理由

#### PostgreSQL選択理由
- **ACID特性**: トランザクションの一貫性保証
- **JSON/JSONB型**: 柔軟なメタデータ管理
- **全文検索**: 高速なコンテンツ検索機能
- **拡張性**: 水平・垂直スケーリング対応
- **オープンソース**: ライセンス費用なし
- **豊富な機能**: 配列型、UUID型、トリガー等

#### UUID主キー採用理由
- **分散環境対応**: 複数サーバーでの一意性保証
- **セキュリティ**: シーケンシャルIDによる推測攻撃回避
- **結合テーブル**: 自然キーとしての利用
- **スケーラビリティ**: シャーディング時の衝突回避

## 📊 データモデル詳細

### 1. ユーザー管理

#### users テーブル
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "reminder": true}'::jsonb
);
```

**設計ポイント:**
- `email`: 一意制約でソーシャルログイン対応
- `username`: 表示用の一意ユーザー名
- `password_hash`: bcryptハッシュ化、平文保存回避
- `notification_settings`: JSONB型で柔軟な設定管理
- `email_verified`: セキュリティ強化のためのメール検証
- `is_active`: 論理削除による完全削除回避

### 2. コンテンツ管理

#### videos テーブル
```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    youtube_id VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    channel_name VARCHAR(255),
    channel_id VARCHAR(100),
    thumbnail_url TEXT,
    duration INTEGER, -- seconds
    published_at TIMESTAMP WITH TIME ZONE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_watched_at TIMESTAMP WITH TIME ZONE,
    watch_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, youtube_id)
);
```

**設計ポイント:**
- `youtube_id`: YouTube動画の一意識別子（11文字）
- `duration`: 秒単位での動画長（タイムスタンプ計算用）
- `metadata`: YouTube APIの追加情報（再生数、いいね数等）
- `UNIQUE(user_id, youtube_id)`: 同一ユーザーの重複保存防止
- `CASCADE削除`: ユーザー削除時の整合性保持

#### themes テーブル
```sql
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color code
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, name)
);
```

**設計ポイント:**
- `color`: HEXカラーコード（#RRGGBB形式）
- `icon`: アイコン識別子（将来的にアイコンライブラリ対応）
- `UNIQUE(user_id, name)`: ユーザー内でのテーマ名重複防止

### 3. 学習コンテンツ

#### memos テーブル
```sql
CREATE TABLE memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp_seconds INTEGER, -- position in video
    is_task BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**設計ポイント:**
- `timestamp_seconds`: 動画内の位置（秒）、NULLは動画全体へのメモ
- `is_task`: タスク化フラグ（UI表示・フィルタリング用）
- `is_important`: 重要度フラグ（復習優先度決定用）
- `content`: 制限なしのテキスト（Markdown対応予定）

#### tasks テーブル
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memo_id UUID REFERENCES memos(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**設計ポイント:**
- `memo_id`: SET NULLで参照メモ削除時もタスク保持
- `priority/status`: CHECK制約で値の整合性保証
- `completed_at`: 完了日時の正確な記録（分析用）
- `due_date`: タイムゾーン考慮の期限管理

### 4. 多対多関係テーブル

#### video_themes (動画-テーマ関連)
```sql
CREATE TABLE video_themes (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id, theme_id)
);
```

#### memo_tags (メモ-タグ関連)
```sql
CREATE TABLE memo_tags (
    memo_id UUID NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (memo_id, tag_id)
);
```

**設計ポイント:**
- 複合主キーでの関連管理
- CASCADE削除で整合性保持
- `assigned_at`: 関連付け履歴の記録

### 5. 学習支援システム

#### reminders テーブル
```sql
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memo_id UUID REFERENCES memos(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('spaced_repetition', 'scheduled', 'recurring')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    repetition_number INTEGER DEFAULT 1,
    next_interval_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**設計ポイント:**
- 複数リソースへの関連（memo, task, video）
- スペースドリピティション対応設計
- 送信・既読状態の追跡
- `next_interval_days`: 忘却曲線に基づく間隔計算

## 🚀 パフォーマンス最適化

### 1. インデックス戦略

#### プライマリインデックス
全テーブルにUUID主キーのクラスタインデックス

#### セカンダリインデックス
```sql
-- 頻繁な検索クエリ最適化
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_videos_saved_at ON videos(saved_at DESC);

-- 時系列クエリ最適化
CREATE INDEX idx_memos_created_at ON memos(created_at DESC);
CREATE INDEX idx_memos_video_id ON memos(video_id);

-- タスク管理最適化
CREATE INDEX idx_tasks_user_id_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- リマインダーシステム最適化
CREATE INDEX idx_reminders_scheduled_for ON reminders(scheduled_for) WHERE is_sent = false;
CREATE INDEX idx_reminders_user_id_sent ON reminders(user_id, is_sent);
```

#### 複合インデックス戦略
```sql
-- ユーザー別の効率的なフィルタリング
CREATE INDEX idx_videos_user_archived_saved ON videos(user_id, is_archived, saved_at DESC);
CREATE INDEX idx_memos_user_video_timestamp ON memos(user_id, video_id, timestamp_seconds);
CREATE INDEX idx_tasks_user_status_priority ON tasks(user_id, status, priority);
```

### 2. クエリ最適化パターン

#### 動画一覧取得（ページネーション）
```sql
-- 効率的なページネーション（OFFSET回避）
SELECT v.*, COUNT(m.id) as memo_count
FROM videos v
LEFT JOIN memos m ON v.id = m.video_id
WHERE v.user_id = $1 
  AND v.is_archived = false
  AND v.saved_at < $2  -- カーソルベースページネーション
GROUP BY v.id
ORDER BY v.saved_at DESC
LIMIT $3;
```

#### メモ付き動画詳細
```sql
-- N+1問題回避のJOIN戦略
SELECT 
    v.*,
    json_agg(
        DISTINCT jsonb_build_object(
            'id', m.id,
            'content', m.content,
            'timestamp_seconds', m.timestamp_seconds,
            'is_important', m.is_important,
            'created_at', m.created_at
        ) ORDER BY m.timestamp_seconds
    ) FILTER (WHERE m.id IS NOT NULL) as memos,
    json_agg(
        DISTINCT jsonb_build_object(
            'id', th.id,
            'name', th.name,
            'color', th.color
        )
    ) FILTER (WHERE th.id IS NOT NULL) as themes
FROM videos v
LEFT JOIN memos m ON v.id = m.video_id
LEFT JOIN video_themes vt ON v.id = vt.video_id
LEFT JOIN themes th ON vt.theme_id = th.id
WHERE v.id = $1 AND v.user_id = $2
GROUP BY v.id;
```

## 🔒 セキュリティ設計

### 1. アクセス制御

#### Row Level Security (RLS)
```sql
-- ユーザーデータの行レベルセキュリティ
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY videos_user_policy ON videos 
  FOR ALL TO app_user 
  USING (user_id = current_setting('app.current_user_id')::uuid);

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
CREATE POLICY memos_user_policy ON memos 
  FOR ALL TO app_user 
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

#### アプリケーションレベル制御
- JWT トークンでのユーザー識別
- APIレイヤーでのuser_idフィルタリング必須化
- 管理者権限の分離

### 2. データ保護

#### 機密情報の暗号化
- パスワード: bcrypt (cost=12)
- 個人情報: アプリケーション層での暗号化検討

#### 監査ログ
```sql
-- 変更履歴の記録
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT/UPDATE/DELETE
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 📈 拡張性設計

### 1. 水平分割（シャーディング）準備

#### シャーディングキー設計
- `user_id` をシャーディングキーとして採用
- 全テーブルに `user_id` を含める設計
- シャード間の結合クエリを最小化

#### パーティショニング戦略
```sql
-- 時系列データのパーティショニング（将来実装）
CREATE TABLE learning_sessions_y2025m01 PARTITION OF learning_sessions
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 2. 読み取り専用レプリカ対応

#### 読み書き分離設計
- 書き込み: マスターDB
- 読み取り: レプリカDB（分析クエリ、検索クエリ）
- アプリケーション層での接続先切り替え

### 3. キャッシュ戦略

#### Redis活用パターン
```yaml
# ユーザーセッション
user:sessions:{user_id}: JSON # TTL: 30日

# 動画メタデータキャッシュ  
youtube:metadata:{youtube_id}: JSON # TTL: 24時間

# APIレスポンスキャッシュ
api:videos:{user_id}:{hash}: JSON # TTL: 5分

# 検索結果キャッシュ
search:{query_hash}: JSON # TTL: 1時間
```

## 🔄 データライフサイクル

### 1. アーカイブ戦略

#### データ保持ポリシー
| データタイプ | 保持期間 | アーカイブ方法 |
|-------------|---------|---------------|
| ユーザーデータ | 永続 | - |
| 動画・メモ | 永続 | ユーザー削除時のみ |
| 学習セッション | 2年 | 月次パーティション |
| 監査ログ | 90日 | 日次ログローテーション |
| リマインダー | 1年 | 送信済み削除 |

### 2. バックアップ戦略

#### バックアップ設計
```sql
-- Point-in-Time Recovery有効化
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'
wal_level = replica

-- 継続的アーカイブ
SELECT pg_start_backup('daily_backup');
-- ファイルシステムレベルバックアップ実行
SELECT pg_stop_backup();
```

### 3. データマイグレーション

#### バージョン管理
```sql
CREATE TABLE schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 📊 分析・レポート用設計

### 1. 分析テーブル設計

#### learning_sessions
```sql
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    memos_created INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    session_type VARCHAR(50) DEFAULT 'watching' 
        CHECK (session_type IN ('watching', 'reviewing', 'task_working'))
);
```

### 2. 分析クエリ最適化

#### マテリアライズドビュー活用
```sql
-- ユーザー統計の事前計算
CREATE MATERIALIZED VIEW user_statistics AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT v.id) as total_videos,
    COUNT(DISTINCT m.id) as total_memos,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    MAX(ls.started_at) as last_activity_at
FROM users u
LEFT JOIN videos v ON u.id = v.user_id
LEFT JOIN memos m ON u.id = m.user_id
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN learning_sessions ls ON u.id = ls.user_id
GROUP BY u.id;

-- 日次更新
REFRESH MATERIALIZED VIEW user_statistics;
```

## 🚨 制約・制限事項

### 1. 技術的制限
- PostgreSQLの最大行サイズ: 1.6TB（実用上問題なし）
- JSON/JSONBのネスト深度: 実質無制限
- インデックス数制限: なし（パフォーマンス考慮要）
- 同時接続数: 設定による（デフォルト100）

### 2. ビジネス制約
- 1ユーザーあたり動画数上限: 10,000本（UI パフォーマンス考慮）
- メモ文字数上限: 65,535文字（TEXT型制限）
- タグ数上限: ユーザーあたり1,000個
- 同時ログインセッション: 5セッション

---

*このデータベース設計書は、実装の進捗と要件変更に応じて継続的に更新されます*
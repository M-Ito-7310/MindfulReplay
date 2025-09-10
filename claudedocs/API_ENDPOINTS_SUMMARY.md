# MindfulReplay API エンドポイント一覧

## 📋 サーバー情報
- **バックエンドURL**: `http://localhost:3000`
- **フロントエンドURL**: `http://localhost:8000`
- **認証方式**: JWT Bearer Token
- **レスポンス形式**: JSON

## 🏥 システムエンドポイント

### GET /health
ヘルスチェックエンドポイント

**レスポンス例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-09T12:52:30.007Z",
  "environment": "development"
}
```

## 🔐 認証エンドポイント (`/api/auth`)

### POST /api/auth/register
ユーザー登録

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!",
  "display_name": "Display Name"
}
```

**パスワード要件:**
- 8文字以上
- 大文字を1文字以上含む
- 小文字を1文字以上含む
- 数字を1文字以上含む
- 特殊文字を1文字以上含む

### POST /api/auth/login
ユーザーログイン

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**成功レスポンス:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "display_name": "Display Name"
    }
  }
}
```

### POST /api/auth/refresh
トークン更新

**リクエストボディ:**
```json
{
  "refreshToken": "eyJ..."
}
```

### POST /api/auth/logout
ログアウト

**Headers:** `Authorization: Bearer <token>`

## 📺 動画管理エンドポイント (`/api/videos`)

**認証必須**: すべてのエンドポイントで Bearer Token 必要

### GET /api/videos
動画リスト取得

**クエリパラメータ:**
- `page`: ページ番号 (default: 1)
- `limit`: 1ページあたりの件数 (default: 10)
- `theme_id`: テーマID（フィルタ）

### POST /api/videos
動画保存 (✅ YouTube API統合完了)

**リクエストボディ:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**サポートURL形式:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

**成功レスポンス:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "uuid",
      "user_id": "uuid",
      "youtube_id": "VIDEO_ID",
      "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
      "title": "動画タイトル",
      "description": "動画説明",
      "duration": 300,
      "thumbnail_url": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
      "channel_name": "チャンネル名",
      "published_at": "2023-01-01T00:00:00Z",
      "view_count": 1000000,
      "created_at": "2025-09-10T12:00:00Z",
      "updated_at": "2025-09-10T12:00:00Z"
    }
  }
}
```

**Mock機能:**
- 環境変数 `YOUTUBE_USE_MOCK=true` または `YOUTUBE_API_KEY` が未設定時にMockデータを返却
- 有名動画の場合は実際のメタデータを模擬
- その他の動画は汎用モックデータを生成

### GET /api/videos/:id
動画詳細取得

### PUT /api/videos/:id
動画情報更新

**リクエストボディ:**
```json
{
  "theme_id": "uuid",
  "notes": "My notes about this video"
}
```

### DELETE /api/videos/:id
動画削除

## 📝 メモ管理エンドポイント (`/api/memos`)

**認証必須**: すべてのエンドポイントで Bearer Token 必要

### GET /api/memos
メモリスト取得

**クエリパラメータ:**
- `video_id`: 動画ID（フィルタ）
- `tag_id`: タグID（フィルタ）
- `page`, `limit`: ページネーション

### POST /api/memos
メモ作成

**リクエストボディ:**
```json
{
  "video_id": "uuid",
  "content": "メモの内容",
  "timestamp": 120,
  "tag_ids": ["uuid1", "uuid2"]
}
```

### GET /api/memos/:id
メモ詳細取得

### PUT /api/memos/:id
メモ更新

**リクエストボディ:**
```json
{
  "content": "更新されたメモ内容",
  "timestamp": 180,
  "tag_ids": ["uuid1", "uuid3"]
}
```

### DELETE /api/memos/:id
メモ削除

## ✅ タスク管理エンドポイント (`/api/tasks`)

**認証必須**: すべてのエンドポイントで Bearer Token 必要

### GET /api/tasks
タスクリスト取得

**クエリパラメータ:**
- `status`: pending|in_progress|completed
- `priority`: low|medium|high
- `memo_id`: メモID（フィルタ）

### POST /api/tasks
タスク作成

**リクエストボディ:**
```json
{
  "memo_id": "uuid",
  "title": "タスクのタイトル",
  "description": "タスクの詳細説明",
  "priority": "medium",
  "due_date": "2025-12-31T23:59:59Z"
}
```

### GET /api/tasks/:id
タスク詳細取得

### PUT /api/tasks/:id
タスク更新

**リクエストボディ:**
```json
{
  "title": "更新されたタイトル",
  "status": "completed",
  "priority": "high",
  "due_date": "2025-12-31T23:59:59Z"
}
```

### DELETE /api/tasks/:id
タスク削除

## 🔔 リマインダー管理エンドポイント (`/api/reminders`)

**認証必須**: すべてのエンドポイントで Bearer Token 必要

### GET /api/reminders
リマインダーリスト取得

### POST /api/reminders
リマインダー作成

**リクエストボディ:**
```json
{
  "task_id": "uuid",
  "scheduled_at": "2025-12-31T10:00:00Z",
  "reminder_type": "spaced_repetition"
}
```

### PUT /api/reminders/:id
リマインダー更新

### DELETE /api/reminders/:id
リマインダー削除

## 🚫 エラーレスポンス形式

すべてのAPIで統一されたエラー形式:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": ["詳細情報"]
  },
  "meta": {
    "timestamp": "2025-09-09T12:52:30.007Z",
    "request_id": "uuid"
  }
}
```

### 主要エラーコード
- `VALIDATION_ERROR`: 入力検証エラー
- `AUTHENTICATION_FAILED`: 認証失敗
- `AUTHORIZATION_FAILED`: 権限なし
- `RESOURCE_NOT_FOUND`: リソースが見つからない
- `INTERNAL_SERVER_ERROR`: サーバー内部エラー

## 📊 認証・権限

### トークン仕様
- **アクセストークン**: 15分有効
- **リフレッシュトークン**: 30日有効
- **形式**: `Authorization: Bearer <token>`

### 保護されたエンドポイント
- `/api/videos/*` (すべて)
- `/api/memos/*` (すべて)
- `/api/tasks/*` (すべて)
- `/api/reminders/*` (すべて)
- `/api/auth/logout`

## 🆕 新機能: YouTube API統合

### YouTube Data API v3 統合状況
- ✅ **Mock機能**: 開発環境でのAPIキー不要のテスト機能
- ✅ **URLバリデーション**: 複数のYouTube URL形式サポート
- ✅ **メタデータ取得**: タイトル、説明、サムネイル等の自動取得
- ✅ **エラーハンドリング**: 不正URL、APIエラーに対する適切なレスポンス

### ログアウト機能
- ✅ **確認ダイアログ**: ブラウザとモバイルでの適切な確認表示
- ✅ **認証状態クリア**: トークン削除とログイン画面への遷移
- ✅ **エラーリカバリ**: API呼び出し失敗時でも強制ログアウト

---

*更新日: 2025-09-10*  
*バージョン: MVP v1.1 - YouTube API統合完了*
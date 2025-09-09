# MindfulReplay API仕様書

## 📋 概要

MindfulReplay RESTful APIの詳細仕様です。全てのエンドポイントはJSON形式でリクエスト・レスポンスを処理します。

## 🔐 認証

### 認証方式
- **Bearer Token** (JWT)
- **Access Token**: 15分有効
- **Refresh Token**: 30日有効

### 認証ヘッダー
```http
Authorization: Bearer <access_token>
```

## 🌐 ベースURL・共通仕様

### 環境
| 環境 | ベースURL |
|------|----------|
| 開発 | `http://localhost:3000/api` |
| 本番 | `https://api.mindfulreplay.com/api` |

### 共通レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-09T10:30:00Z",
    "version": "1.0.0"
  }
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-09T10:30:00Z",
    "request_id": "req_12345"
  }
}
```

### HTTPステータスコード

| コード | 意味 | 使用場面 |
|--------|------|---------|
| 200 | OK | 成功 |
| 201 | Created | リソース作成成功 |
| 204 | No Content | 削除成功 |
| 400 | Bad Request | リクエストエラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 認可エラー |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | リソース競合 |
| 422 | Unprocessable Entity | バリデーションエラー |
| 429 | Too Many Requests | レート制限 |
| 500 | Internal Server Error | サーバーエラー |

## 🔑 認証エンドポイント

### POST /auth/register
新規ユーザー登録

#### リクエスト
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "username": "johndoe",
      "displayName": "John Doe",
      "createdAt": "2025-01-09T10:30:00Z"
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 900
    }
  }
}
```

### POST /auth/login
ログイン

#### リクエスト
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

### POST /auth/refresh
トークン更新

#### リクエスト
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### POST /auth/logout
ログアウト（トークン無効化）

#### リクエスト
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

## 📹 動画管理エンドポイント

### GET /videos
動画一覧取得

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 | デフォルト |
|----------|---|------|------|-----------|
| `page` | number | × | ページ番号 | 1 |
| `limit` | number | × | 1ページあたりの件数 | 20 |
| `sort` | string | × | ソート順 (`savedAt`, `publishedAt`) | savedAt |
| `order` | string | × | ソート順序 (`asc`, `desc`) | desc |
| `theme` | uuid | × | テーマでフィルタ | - |
| `search` | string | × | タイトル・説明文検索 | - |
| `archived` | boolean | × | アーカイブ済み含む | false |

#### レスポンス
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid-v4",
        "youtubeId": "dQw4w9WgXcQ",
        "title": "YouTube Video Title",
        "description": "Video description...",
        "channelName": "Channel Name",
        "channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
        "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        "duration": 3600,
        "publishedAt": "2025-01-01T00:00:00Z",
        "savedAt": "2025-01-09T10:30:00Z",
        "watchCount": 3,
        "lastWatchedAt": "2025-01-08T15:00:00Z",
        "isArchived": false,
        "themes": [
          {
            "id": "theme-uuid",
            "name": "プログラミング",
            "color": "#3B82F6"
          }
        ],
        "memoCount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### POST /videos
動画保存（YouTube URLから）

#### リクエスト
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "themes": ["theme-uuid-1", "theme-uuid-2"]
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "uuid-v4",
      "youtubeId": "dQw4w9WgXcQ",
      "title": "Never Gonna Give You Up",
      "description": "The official video for Rick Astley...",
      "channelName": "Rick Astley",
      "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "duration": 212,
      "publishedAt": "2009-10-25T06:57:33Z",
      "savedAt": "2025-01-09T10:30:00Z",
      "themes": [...]
    }
  }
}
```

### GET /videos/{videoId}
動画詳細取得

#### レスポンス
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "uuid-v4",
      "youtubeId": "dQw4w9WgXcQ",
      // ... video fields
      "memos": [
        {
          "id": "memo-uuid",
          "content": "重要なポイント",
          "timestampSeconds": 120,
          "isTask": false,
          "isImportant": true,
          "createdAt": "2025-01-09T10:30:00Z",
          "tags": [
            { "id": "tag-uuid", "name": "重要" }
          ]
        }
      ],
      "tasks": [
        {
          "id": "task-uuid",
          "title": "学習内容を実践する",
          "status": "pending",
          "priority": "high",
          "dueDate": "2025-01-15T00:00:00Z",
          "createdAt": "2025-01-09T10:30:00Z"
        }
      ]
    }
  }
}
```

### PUT /videos/{videoId}
動画情報更新

#### リクエスト
```json
{
  "themes": ["theme-uuid-1"],
  "isArchived": false
}
```

### DELETE /videos/{videoId}
動画削除

## 📝 メモ管理エンドポイント

### GET /memos
メモ一覧取得

#### クエリパラメータ
| パラメータ | 型 | 説明 |
|----------|---|------|
| `videoId` | uuid | 特定動画のメモのみ |
| `isTask` | boolean | タスク化されたメモのみ |
| `isImportant` | boolean | 重要マークされたメモのみ |
| `tags` | string[] | タグでフィルタ |
| `search` | string | メモ内容検索 |

### POST /memos
メモ作成

#### リクエスト
```json
{
  "videoId": "video-uuid",
  "content": "これは重要なメモです",
  "timestampSeconds": 120,
  "isTask": false,
  "isImportant": true,
  "tags": ["tag1", "tag2"]
}
```

### PUT /memos/{memoId}
メモ更新

### DELETE /memos/{memoId}
メモ削除

## ✅ タスク管理エンドポイント

### GET /tasks
タスク一覧取得

#### クエリパラメータ
| パラメータ | 型 | 説明 |
|----------|---|------|
| `status` | string | ステータスフィルタ |
| `priority` | string | 優先度フィルタ |
| `dueDate` | string | 期限でフィルタ |
| `videoId` | uuid | 特定動画関連タスク |

#### レスポンス
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-uuid",
        "title": "React Hooksを学習する",
        "description": "useEffect, useState, useContextを重点的に",
        "priority": "high",
        "status": "pending",
        "dueDate": "2025-01-15T00:00:00Z",
        "completedAt": null,
        "createdAt": "2025-01-09T10:30:00Z",
        "updatedAt": "2025-01-09T10:30:00Z",
        "memo": {
          "id": "memo-uuid",
          "content": "Hooksの使い方が分からない",
          "timestampSeconds": 300
        },
        "video": {
          "id": "video-uuid",
          "title": "React完全攻略",
          "thumbnailUrl": "https://..."
        }
      }
    ],
    "stats": {
      "total": 25,
      "pending": 15,
      "inProgress": 3,
      "completed": 7,
      "overdue": 2
    }
  }
}
```

### POST /tasks
タスク作成

#### リクエスト
```json
{
  "title": "新しいタスク",
  "description": "タスクの詳細説明",
  "priority": "medium",
  "dueDate": "2025-01-20T00:00:00Z",
  "memoId": "memo-uuid",
  "videoId": "video-uuid"
}
```

### PUT /tasks/{taskId}
タスク更新

#### リクエスト
```json
{
  "status": "completed",
  "completedAt": "2025-01-09T15:00:00Z"
}
```

## 🔔 リマインダーエンドポイント

### GET /reminders
リマインダー一覧取得

### POST /reminders
リマインダー作成

#### リクエスト
```json
{
  "type": "spaced_repetition",
  "memoId": "memo-uuid",
  "taskId": "task-uuid",
  "scheduledFor": "2025-01-10T09:00:00Z",
  "title": "復習の時間です",
  "message": "React Hooksについて復習しましょう"
}
```

### PUT /reminders/{reminderId}/acknowledge
リマインダー既読

## 🏷️ タグ・テーマ管理

### GET /tags
タグ一覧取得

### POST /tags
タグ作成

### GET /themes
テーマ一覧取得

### POST /themes
テーマ作成

#### リクエスト
```json
{
  "name": "Machine Learning",
  "description": "機械学習関連のコンテンツ",
  "color": "#10B981",
  "icon": "brain"
}
```

## 👤 ユーザー管理

### GET /users/profile
プロフィール取得

### PUT /users/profile
プロフィール更新

### PUT /users/settings
設定更新

#### リクエスト
```json
{
  "notificationSettings": {
    "email": true,
    "push": true,
    "reminder": true,
    "digestFrequency": "weekly"
  },
  "privacySettings": {
    "profilePublic": false,
    "analyticsOptOut": false
  }
}
```

## 📊 分析エンドポイント

### GET /analytics/dashboard
ダッシュボードデータ

#### レスポンス
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalVideos": 150,
      "totalMemos": 450,
      "totalTasks": 75,
      "completedTasks": 45,
      "weeklyStats": {
        "videosWatched": 8,
        "memosCreated": 25,
        "tasksCompleted": 12
      }
    },
    "recentActivity": [
      {
        "type": "memo_created",
        "timestamp": "2025-01-09T14:30:00Z",
        "data": {
          "videoTitle": "React Tutorial",
          "memoContent": "useState使い方"
        }
      }
    ],
    "topThemes": [
      {
        "name": "プログラミング",
        "videoCount": 45,
        "memoCount": 120
      }
    ]
  }
}
```

### GET /analytics/learning-progress
学習進捗分析

## 🔍 検索エンドポイント

### GET /search
全文検索

#### クエリパラメータ
| パラメータ | 型 | 説明 |
|----------|---|------|
| `q` | string | 検索クエリ |
| `type` | string[] | 検索対象 (`videos`, `memos`, `tasks`) |
| `theme` | uuid | テーマフィルタ |
| `dateFrom` | string | 開始日 |
| `dateTo` | string | 終了日 |

#### レスポンス
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "video",
        "id": "video-uuid",
        "title": "React Hook Tutorial",
        "snippet": "...useState を使って...",
        "relevanceScore": 0.95
      },
      {
        "type": "memo",
        "id": "memo-uuid",
        "content": "useStateの使い方について",
        "videoTitle": "React Hook Tutorial",
        "timestamp": 120,
        "relevanceScore": 0.87
      }
    ],
    "facets": {
      "types": {
        "videos": 15,
        "memos": 32,
        "tasks": 8
      },
      "themes": {
        "プログラミング": 25,
        "React": 20
      }
    }
  }
}
```

## 🚨 エラーコード一覧

| コード | HTTPステータス | 説明 |
|-------|----------------|------|
| `VALIDATION_ERROR` | 422 | 入力データバリデーションエラー |
| `AUTHENTICATION_FAILED` | 401 | 認証失敗 |
| `TOKEN_EXPIRED` | 401 | トークン期限切れ |
| `INSUFFICIENT_PERMISSIONS` | 403 | 権限不足 |
| `RESOURCE_NOT_FOUND` | 404 | リソースが見つからない |
| `DUPLICATE_RESOURCE` | 409 | 重複リソース |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限超過 |
| `YOUTUBE_API_ERROR` | 502 | YouTube API連携エラー |
| `DATABASE_ERROR` | 500 | データベースエラー |
| `INTERNAL_ERROR` | 500 | 内部サーバーエラー |

## 🔄 レート制限

| エンドポイント | 制限 | ウィンドウ |
|---------------|------|----------|
| 認証系 | 10回 | 15分 |
| 動画保存 | 30回 | 15分 |
| 一般API | 100回 | 15分 |
| 検索 | 50回 | 15分 |

## 📝 その他仕様

### ページネーション
全ての一覧系APIはページネーション対応

### 国際化
- 日本語（デフォルト）
- 英語（将来対応予定）

### タイムゾーン
全ての日時はUTCで管理、クライアント側で変換

---

*この仕様書は実装の進捗に応じて継続的に更新されます*
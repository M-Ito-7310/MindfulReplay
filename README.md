# MindfulReplay

YouTubeの視聴体験を「受動的な消費」から「能動的な学習」へと変革するモバイルWebアプリケーション

## 概要

MindfulReplayは、YouTube動画から得た知識を実際の行動に結びつけるための学習管理プラットフォームです。動画の保存、タイムスタンプ付きメモ、タスク管理、スペースドリピティション型リマインダーを通じて、効果的な学習サイクルを構築します。

## 主な機能

- 📹 **動画管理**: YouTube動画の保存とメタデータ自動取得
- 📝 **タイムスタンプメモ**: 動画の特定箇所にメモを紐付け
- ✅ **タスク変換**: 学んだ内容を実行可能なタスクに変換
- 🔔 **スマートリマインダー**: スペースドリピティションによる効果的な復習
- 🏷️ **タグ・テーマ管理**: コンテンツの体系的な整理
- 🔍 **高度な検索**: 動画、メモ、タグを横断的に検索

## 技術スタック

### フロントエンド
- React Native (Expo)
- TypeScript
- React Navigation
- React Query (TanStack Query)
- Zustand (状態管理)
- React Hook Form

### バックエンド
- Node.js
- Express
- PostgreSQL
- Knex.js (Query Builder)
- JWT認証
- YouTube Data API v3

### インフラ
- Google Cloud Platform
- Cloud Run
- Cloud SQL
- Firebase (Push通知)

## 開発環境のセットアップ

### 必要な環境

- Node.js 18.0.0以上
- PostgreSQL 14以上
- Git

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/mindful-replay.git
cd mindful-replay
```

2. 依存関係のインストール

フロントエンド:
```bash
cd frontend
npm install
```

バックエンド:
```bash
cd ../backend
npm install
```

3. 環境変数の設定

バックエンドの環境変数:
```bash
cd backend
cp .env.example .env
# .envファイルを編集して必要な情報を設定
```

主な設定項目:
- `DATABASE_URL`: PostgreSQL接続文字列
- `JWT_SECRET`: JWT署名用の秘密鍵
- `YOUTUBE_API_KEY`: YouTube Data API v3のAPIキー

4. データベースのセットアップ

PostgreSQLデータベースを作成:
```bash
createdb mindful_replay
```

スキーマの適用:
```bash
cd database
psql -U postgres -d mindful_replay -f schema.sql
```

5. 開発サーバーの起動

バックエンド:
```bash
cd backend
npm run dev
```

フロントエンド:
```bash
cd frontend
npm start
```

## 開発コマンド

### フロントエンド

```bash
npm start        # Expo開発サーバー起動
npm run android  # Androidエミュレータで起動
npm run ios      # iOSシミュレータで起動 (macOSのみ)
npm run web      # Webブラウザで起動
npm run lint     # ESLintチェック
npm run typecheck # TypeScriptチェック
npm test         # テスト実行
```

### バックエンド

```bash
npm run dev      # 開発サーバー起動 (ホットリロード付き)
npm run build    # TypeScriptビルド
npm start        # 本番サーバー起動
npm run lint     # ESLintチェック
npm run typecheck # TypeScriptチェック
npm test         # テスト実行
npm run db:migrate # データベースマイグレーション
npm run db:seed  # テストデータ投入
```

## プロジェクト構造

```
mindful-replay/
├── frontend/           # React Native (Expo) アプリ
│   ├── src/
│   │   ├── components/ # 共通UIコンポーネント
│   │   ├── screens/    # 画面コンポーネント
│   │   ├── navigation/ # ナビゲーション設定
│   │   ├── services/   # API通信
│   │   ├── hooks/      # カスタムフック
│   │   ├── store/      # 状態管理 (Zustand)
│   │   ├── utils/      # ユーティリティ関数
│   │   └── types/      # TypeScript型定義
│   └── assets/         # 画像、フォントなど
│
├── backend/            # Node.js/Express API
│   ├── src/
│   │   ├── controllers/ # リクエストハンドラ
│   │   ├── routes/     # APIルート定義
│   │   ├── services/   # ビジネスロジック
│   │   ├── models/     # データモデル
│   │   ├── middleware/ # Express ミドルウェア
│   │   ├── database/   # DB接続、マイグレーション
│   │   ├── utils/      # ユーティリティ関数
│   │   └── types/      # TypeScript型定義
│   └── dist/           # ビルド済みファイル
│
├── database/           # データベース関連
│   └── schema.sql      # PostgreSQLスキーマ定義
│
├── docs/               # プロジェクトドキュメント
│   ├── personas.md     # ユーザーペルソナ
│   ├── architecture.md # システム設計
│   ├── ideas.md        # アイデア・機能案
│   └── roadmap.md      # 開発ロードマップ
│
└── scripts/            # 開発・デプロイ用スクリプト
```

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/refresh` - トークン更新
- `POST /api/auth/logout` - ログアウト

### 動画
- `GET /api/videos` - 動画一覧取得
- `POST /api/videos` - 動画保存
- `GET /api/videos/:id` - 動画詳細取得
- `PUT /api/videos/:id` - 動画情報更新
- `DELETE /api/videos/:id` - 動画削除

### メモ
- `GET /api/memos` - メモ一覧取得
- `POST /api/memos` - メモ作成
- `GET /api/memos/:id` - メモ詳細取得
- `PUT /api/memos/:id` - メモ更新
- `DELETE /api/memos/:id` - メモ削除

### タスク
- `GET /api/tasks` - タスク一覧取得
- `POST /api/tasks` - タスク作成
- `PUT /api/tasks/:id` - タスク更新
- `DELETE /api/tasks/:id` - タスク削除

### リマインダー
- `GET /api/reminders` - リマインダー一覧取得
- `POST /api/reminders` - リマインダー作成
- `PUT /api/reminders/:id` - リマインダー更新
- `DELETE /api/reminders/:id` - リマインダー削除

## テスト

```bash
# フロントエンドのテスト
cd frontend
npm test

# バックエンドのテスト
cd backend
npm test

# E2Eテスト (準備中)
npm run test:e2e
```

## デプロイ

### Google Cloud Platform へのデプロイ

1. GCPプロジェクトの作成
2. Cloud SQL インスタンスの作成
3. Cloud Run サービスのデプロイ
4. Firebase Hosting の設定

詳細は [deployment.md](docs/deployment.md) を参照してください。

## コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

1. フォーク
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## ライセンス

[MIT](LICENSE)

## 開発チーム

- プロダクトオーナー
- リードエンジニア
- UIデザイナー

## お問い合わせ

- GitHub Issues: [https://github.com/yourusername/mindful-replay/issues](https://github.com/yourusername/mindful-replay/issues)
- Email: contact@mindfulreplay.com
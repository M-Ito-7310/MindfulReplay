# MindfulReplay

YouTubeの視聴体験を「受動的な消費」から「能動的な学習」へと変革するモバイルWebアプリケーション

## 概要

MindfulReplayは、YouTube動画から得た知識を実際の行動に結びつけるための学習管理プラットフォームです。動画の保存、タイムスタンプ付きメモ、タスク管理、スペースドリピティション型リマインダーを通じて、効果的な学習サイクルを構築します。

## 現在の開発状況 (2025年9月)

### ✅ 完了済み
- バックエンドAPI実装（認証、CRUD操作）
- フロントエンド・バックエンド統合（完全動作確認済み）
- JWT認証システム（トークン管理・自動リフレッシュ）
- **YouTube API統合**（YouTube Data API v3 + Mock機能）
- **動画追加機能**（URLバリデーション・エラーハンドリング完備）
- **ログアウト機能**（確認ダイアログ・認証状態リセット）
- TaskService API統合（全CRUD操作対応）
- React Native Web対応（ブラウザでのテスト実行可能）
- Expo開発環境セットアップ（Metro bundler最適化済み）
- ポート設定統一（バックエンド:3000、フロントエンド:8000）
- 型安全なAPI通信（TypeScript完全対応）

### 🚧 作業中
- PostgreSQLデータベース接続（現在はMockDB使用）
- TypeScriptエラーの解消（バックエンド）

### 📋 今後の実装予定
- 実YouTube APIキー設定（本番環境用）
- プッシュ通知（Firebase）
- E2Eテスト
- 本番環境デプロイ

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

## 🚀 開発環境のセットアップ（動作確認済み）

### 必要な環境

- Node.js 18.0.0以上
- Git
- （PostgreSQL 14以上 - 将来の本格運用時）

### ✅ クイックスタート手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/M-Ito-7310/MindfulReplay.git
cd MindfulReplay
```

2. **依存関係のインストール**

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

3. **バックエンドサーバーの起動** (ポート: 3000)
```bash
cd backend
npm run dev
# ✅ サーバーが http://localhost:3000 で起動
# ✅ MockDBでテストデータ自動生成
```

4. **フロントエンドサーバーの起動** (ポート: 8000)
```bash
cd frontend
npm start
# ✅ Expo開発サーバーが http://localhost:8000 で起動
# ✅ Web版: w キーを押すかブラウザでアクセス
```

## 📱 動作確認とテスト

### 🌐 Webブラウザでのテスト
```bash
# バックエンドヘルスチェック
curl http://localhost:3000/health

# フロントエンドアクセス
# ブラウザで http://localhost:8000 にアクセス
```

### 👤 デモアカウント情報
**テストアカウント1:**
- メール: `test@example.com`
- パスワード: `password123`

**テストアカウント2:**
- メール: `demo@mindfulreplay.com`
- パスワード: `password123`

### 📊 利用可能なテストデータ
ログイン後、以下のサンプルデータが利用できます：
- **動画**: 3つのサンプル動画
- **メモ**: 7つのサンプルメモ
- **タスク**: 5つのサンプルタスク
- **タグ**: プログラミング学習、ビジネススキルなど

### 📋 現在の機能状況
- ✅ **認証**: ログイン/サインアップ/ログアウト（完全動作）
- ✅ **API統合**: すべてのCRUD操作（完全動作）
- ✅ **動画管理**: YouTube動画追加・一覧表示（完全動作）
- ✅ **タスク管理**: 作成・編集・削除（完全動作）
- ✅ **メモ管理**: 基本機能（完全動作）
- ✅ **YouTube API**: Mock機能付きで開発・テスト可能

### 🔧 トラブルシューティング

**ポート競合エラーの場合:**
```bash
# 使用中のポートを確認
netstat -an | grep -E "(3000|8000)"

# プロセスを停止してから再起動
```

**TypeScriptエラーの場合:**
```bash
# フロントエンドで型チェック
cd frontend && npm run typecheck

# バックエンドで型チェック
cd backend && npm run typecheck
```

**Expoキャッシュクリア:**
```bash
cd frontend
npx expo start -c
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
MindfulReplay/
├── frontend/           # React Native (Expo) アプリ
│   ├── src/
│   │   ├── components/ # 共通UIコンポーネント
│   │   │   └── common/ # Button, Input等の基本コンポーネント
│   │   ├── screens/    # 画面コンポーネント
│   │   │   ├── auth/   # ログイン、サインアップ画面
│   │   │   └── video/  # 動画リスト、プレーヤー画面
│   │   ├── services/   # API通信
│   │   ├── constants/  # 定数定義（API設定、テーマ）
│   │   └── types/      # TypeScript型定義
│   ├── App.tsx         # アプリケーションエントリーポイント
│   └── package.json    # フロントエンド依存関係
│
├── backend/            # Node.js/Express API
│   ├── src/
│   │   ├── controllers/ # リクエストハンドラ
│   │   ├── routes/     # APIルート定義
│   │   ├── services/   # ビジネスロジック
│   │   ├── models/     # データモデル
│   │   ├── middleware/ # Express ミドルウェア
│   │   ├── database/   # DB接続設定
│   │   ├── utils/      # ユーティリティ関数
│   │   └── types/      # TypeScript型定義
│   └── .env            # 環境変数設定
│
├── database/           # データベース関連
│   ├── schema.sql      # PostgreSQLスキーマ定義
│   └── postgres_setup_guide.md # DB設定ガイド
│
├── docs/               # プロジェクトドキュメント（日本語）
│   ├── personas.md     # ユーザーペルソナ
│   ├── architecture.md # システム設計
│   ├── ideas.md        # アイデア・機能案
│   └── roadmap.md      # 開発ロードマップ
│
└── claudedocs/         # 開発進捗ドキュメント
    ├── PROJECT_STATUS.md    # プロジェクトステータス
    ├── API_TEST_REPORT.md   # APIテストレポート
    └── API_ENDPOINTS_SUMMARY.md # APIエンドポイント一覧
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

### デプロイ準備状況

現在、開発環境での動作確認を進めています。本番環境へのデプロイは以下の手順で実施予定：

1. PostgreSQLデータベースの本番環境設定
2. 環境変数の本番用設定
3. ビルドとデプロイの自動化（GitHub Actions）
4. ホスティングサービスの選定（Vercel、Netlify、Google Cloud Platform等）

## コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

1. フォーク
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## ライセンス

MIT License - 詳細は後日追加予定

## 開発チーム

- プロダクトオーナー
- リードエンジニア
- UIデザイナー

## お問い合わせ

- GitHub Issues: [https://github.com/M-Ito-7310/MindfulReplay/issues](https://github.com/M-Ito-7310/MindfulReplay/issues)
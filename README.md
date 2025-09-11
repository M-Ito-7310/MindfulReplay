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

## 📱 スマートフォンでのテスト（Expo Go）

### 📋 事前準備

**1. スマートフォンにExpo Goアプリをインストール**
- iPhone: [App Store](https://apps.apple.com/jp/app/expo-go/id982107779) 
- Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

**2. 同一ネットワーク接続の確認**
- 開発PCとスマートフォンが同じWi-Fiネットワークに接続されていることを確認

### 🚀 IPアドレス指定での起動手順

**1. 開発PCのIPアドレスを確認**
```bash
# Windows
ipconfig

# macOS/Linux  
ifconfig
# または
ip addr show
```

**2. バックエンドサーバーをIPアドレス指定で起動**
```bash
cd backend
npm run dev
# サーバーが http://0.0.0.0:3000 で起動（全IPからアクセス可能）
```

**3. フロントエンドの設定を変更**
`frontend/src/constants/api.ts` を編集：
```typescript
// 開発環境用のIPアドレス設定
const DEV_IP = '192.168.1.100'; // 👈 実際のIPアドレスに変更

export const API_CONFIG = {
  BASE_URL: `http://${DEV_IP}:3000/api`,
  // ... 他の設定
};
```

**4. フロントエンドをIPアドレス指定で起動**
```bash
cd frontend

# 基本の起動（推奨）
npm start

# Windows環境での場合
npx expo start --port 8000

# キャッシュクリアして起動
npx expo start -c

# 起動後、ターミナルに表示されるQRコードまたはURLを使用
```

### 📱 スマートフォンでのアクセス方法

**方法1: QRコードスキャン**
1. フロントエンド起動後に表示されるQRコードをExpo Goアプリでスキャン
2. アプリが自動的に読み込まれる

**方法2: 手動URL入力**
1. Expo Goアプリの「Enter URL manually」を選択
2. 表示されたURL（例: `exp://192.168.1.100:8000`）を入力

**方法3: 同じネットワーク上での自動検出**
1. Expo Goアプリを開く
2. 「Recently in Development」セクションで開発中のアプリを確認
3. プロジェクト名をタップして起動

### 🔧 トラブルシューティング（スマートフォン接続）

**アプリが見つからない場合:**
```bash
# Expoキャッシュをクリア
cd frontend
npx expo start -c

# IPアドレスを明示的に指定（あなたのIPアドレスに変更）
npx expo start --host 192.168.1.100

# Windows環境での推奨起動方法
npx expo start --port 8000 --clear
```

**接続エラーの場合:**
1. **ファイアウォール設定の確認**
   - Windows: ポート3000と8000を許可
   - macOS: システム環境設定 > セキュリティ > ファイアウォール

2. **ネットワーク設定の確認**
   - 同じWi-Fiネットワークに接続されているか確認
   - VPN接続を無効化

3. **IPアドレスの再確認**
   ```bash
   # 現在のIPアドレスを確認
   ping $(hostname -I | awk '{print $1}')  # Linux/macOS
   ping %COMPUTERNAME%                      # Windows
   ```

**API接続エラーの場合:**
```bash
# スマートフォンからバックエンドAPIへの接続確認
# ブラウザで http://[あなたのIP]:3000/health にアクセス
# 例: http://192.168.1.100:3000/health
```

**Windows環境での特有の問題:**

**1. 環境変数エラーの対処:**
```bash
# PowerShellの場合
$env:EXPO_USE_FAST_REFRESH="false"; npm start

# Command Promptの場合
set EXPO_USE_FAST_REFRESH=false && npm start

# または、直接npx expoコマンドを使用（推奨）
npx expo start --port 8000
```

**2. @expo/ngrokエラーの対処:**
```bash
# ngrokパッケージを明示的にインストール（必要に応じて）
npm install -g @expo/ngrok

# または、トンネルを使わずに起動
npx expo start --no-tunnel
```

**3. Expo SDK互換性エラーの対処:**
```bash
# SDK更新（Expo Go互換性確保）
npx expo install expo@latest

# 依存関係の自動修正
npx expo install --fix

# 依存関係競合の強制解決（必要に応じて）
npm install --legacy-peer-deps
```

**4. app.jsonでのホスト設定:**
```json
{
  "expo": {
    // ... 他の設定
    "packagerOpts": {
      "host": "192.168.1.10"
    }
  }
}
```

**5. metro.config.jsでのサーバー設定:**
```javascript
config.server = {
  ...config.server,
  host: '192.168.1.10', // 実際のIPアドレスに変更
  port: 8000
};
```

**6. IPアドレスの確認方法（Windows）:**
```bash
# コマンドプロンプトで
ipconfig | findstr "IPv4"

# PowerShellで
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
```

**⚠️ 重要な注意事項（SDK互換性）:**
- Expo Goアプリのバージョンとプロジェクトで使用しているExpo SDKのバージョンが一致している必要があります
- 互換性エラーが発生した場合は、上記の「Expo SDK互換性エラーの対処」を実行してください
- 現在のプロジェクト: Expo SDK 54対応
- 最新のExpo Goアプリを使用することを推奨します

### 📝 開発時の推奨設定

**frontend/src/constants/api.ts の設定例:**
```typescript
// 開発環境での推奨設定
const isDevelopment = __DEV__;
const DEV_IP = '192.168.1.100'; // 👈 あなたのIPアドレスに変更

export const API_CONFIG = {
  BASE_URL: isDevelopment 
    ? `http://${DEV_IP}:3000/api`  // スマートフォン用
    : 'http://localhost:3000/api', // Web用
  TIMEOUT: 10000,
  // ... 他の設定
};
```

この設定により、WebブラウザとExpo Goアプリの両方で開発・テストが可能になります。

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
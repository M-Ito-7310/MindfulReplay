# MindfulReplay 起動手順ガイド

## 📋 概要

MindfulReplayプロジェクトをローカル環境で起動するための詳細な手順書です。このガイドに従うことで、フロントエンド・バックエンド統合環境を確実にセットアップできます。

## 🔧 事前準備

### 必要な環境
- **Node.js**: 18.0.0以上
- **npm**: 9.0.0以上  
- **Git**: 最新版
- **ブラウザ**: Chrome, Firefox, Safari等（React Native Web対応）

### 環境確認コマンド
```bash
# バージョン確認
node --version    # v18.0.0以上であることを確認
npm --version     # v9.0.0以上であることを確認
git --version     # Git が利用可能であることを確認
```

## 🚀 起動手順（動作確認済み）

### ステップ1: リポジトリのクローン
```bash
git clone https://github.com/M-Ito-7310/MindfulReplay.git
cd MindfulReplay
```

### ステップ2: 依存関係のインストール

#### バックエンド
```bash
cd backend
npm install
```

#### フロントエンド
```bash
cd ../frontend
npm install
```

### ステップ3: バックエンドサーバーの起動

```bash
cd backend
npm run dev
```

**期待される結果:**
```
✅ サーバーが http://localhost:3000 で起動
✅ MockDBでテストデータ自動生成
✅ JWT認証システム初期化完了
✅ 5件のサンプルタスク、3件のサンプル動画、7件のサンプルメモ生成
```

### ステップ4: フロントエンドサーバーの起動

```bash
# 新しいターミナルを開いて
cd frontend
npm start
```

**期待される結果:**
```
✅ Expo開発サーバーが http://localhost:8000 で起動
✅ Metro bundler起動完了
✅ Web版: w キーを押すかブラウザでアクセス可能
✅ React Native Web環境準備完了
```

### ステップ5: アプリケーションアクセス

```bash
# ブラウザでアクセス
open http://localhost:8000
```

**または:**
- フロントエンドターミナルで `w` キーを押してWeb版を起動

## 🔐 デモアカウント情報

### テストアカウント1
- **メール**: `test@example.com`
- **パスワード**: `password123`

### テストアカウント2  
- **メール**: `demo@mindfulreplay.com`
- **パスワード**: `password123`

## 📊 利用可能なテストデータ

ログイン後、以下のサンプルデータが利用できます：

### 動画（3件）
- プログラミング学習関連動画
- ビジネススキル関連動画  
- チュートリアル動画

### メモ（7件）
- タイムスタンプ付きメモ
- タグ・テーマ管理機能
- 動画連携メモ

### タスク（5件）
- 優先度別タスク（低/中/高/緊急）
- ステータス管理（未着手/進行中/完了/キャンセル）
- 期限設定機能
- メモからタスク変換機能

## 🧪 動作確認手順

### 1. バックエンドヘルスチェック
```bash
curl http://localhost:3000/health
```

**期待されるレスポンス:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-10T...",
  "environment": "development"
}
```

### 2. 認証フロー確認
1. ブラウザで http://localhost:8000 にアクセス
2. デモアカウントでログイン
3. JWT トークンが正常に発行・保存されることを確認

### 3. 主要機能確認
- **タスク管理**: タスク作成・編集・削除・ステータス更新
- **動画管理**: 動画一覧表示・メタデータ確認
- **メモ管理**: メモ一覧表示・タグフィルタ
- **ナビゲーション**: タブ切り替え・画面遷移

## 🔄 開発ワークフロー

### 日常の開発開始手順
```bash
# 1. 最新コードを取得
git pull origin main

# 2. バックエンド起動（ターミナル1）
cd backend && npm run dev

# 3. フロントエンド起動（ターミナル2）
cd frontend && npm start
```

### コード変更時の確認手順
```bash
# TypeScript型チェック
cd frontend && npm run typecheck
cd backend && npm run typecheck

# Lint チェック
cd frontend && npm run lint
cd backend && npm run lint

# テスト実行
cd frontend && npm test
cd backend && npm test
```

## 📱 プラットフォーム別起動

### Web（推奨）
```bash
cd frontend
npm start
# ブラウザで http://localhost:8000 または 'w' キーでWeb版起動
```

### Android（開発中）
```bash
cd frontend
npm run android
# Android エミュレータまたは実機で起動
```

### iOS（開発中・macOSのみ）
```bash
cd frontend
npm run ios
# iOS シミュレータで起動
```

## 🔧 ポート設定

| サービス | ポート | URL | 用途 |
|---------|--------|-----|------|
| **バックエンド** | 3000 | http://localhost:3000 | API サーバー |
| **フロントエンド** | 8000 | http://localhost:8000 | Expo開発サーバー |

## 📂 プロジェクト構造理解

```
MindfulReplay/
├── backend/             # Node.js/Express API
│   ├── src/
│   │   ├── controllers/ # API エンドポイント
│   │   ├── services/    # ビジネスロジック
│   │   ├── repositories/# データアクセス層
│   │   └── database/    # MockDB実装
│   └── package.json
│
├── frontend/            # React Native (Expo)
│   ├── src/
│   │   ├── screens/     # 画面コンポーネント
│   │   ├── components/  # UIコンポーネント
│   │   ├── services/    # API通信
│   │   └── types/       # TypeScript型定義
│   └── package.json
│
└── claudedocs/          # 開発ドキュメント
```

## 🎯 次のステップ

起動確認が完了したら：

1. **YouTube API統合**: 動画追加機能の実装
2. **機能拡張**: リマインダーシステムの追加
3. **UI/UX改善**: デザインシステムの強化
4. **テスト強化**: E2Eテストの追加

## 📞 サポート

### 問題が発生した場合
1. [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md) を確認
2. GitHub Issues で問題を報告
3. プロジェクトドキュメント [README.md](../README.md) を参照

### 関連ドキュメント
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - プロジェクト進捗
- [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - 開発フロー
- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - API仕様

---

*最終更新: 2025-09-10*  
*このガイドは動作確認済みの手順に基づいて作成されています*
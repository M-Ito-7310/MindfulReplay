# MindfulReplay トラブルシューティングガイド

## 📋 概要

MindfulReplayプロジェクトの開発・実行時に発生する可能性のある問題と解決方法をまとめたガイドです。

## 🚨 緊急対応

### サーバーが起動しない
```bash
# プロセス確認
netstat -an | findstr "3000"
netstat -an | findstr "8000"

# プロセス強制終了
taskkill /F /IM node.exe
```

### アプリケーションが表示されない
1. ブラウザのキャッシュクリア（Ctrl+Shift+R）
2. 別のブラウザで確認
3. プライベートモード/シークレットモードで確認

## 🛠️ よくある問題と解決方法

### 1. ポート競合エラー

#### 症状
```
Error: listen EADDRINUSE: address already in use :::3000
Error: listen EADDRINUSE: address already in use :::8000
```

#### 解決方法
```bash
# 使用中のポートを確認
netstat -ano | findstr "3000"
netstat -ano | findstr "8000"

# プロセスを確認して終了
tasklist /FI "PID eq [PID番号]"
taskkill /F /PID [PID番号]

# または、Node.jsプロセスを全て終了
taskkill /F /IM node.exe
```

### 2. npm install エラー

#### 症状
```
npm ERR! network request failed
npm ERR! peer dep missing
npm ERR! ERESOLVE unable to resolve dependency tree
```

#### 解決方法
```bash
# 1. npm キャッシュクリア
npm cache clean --force

# 2. node_modules と package-lock.json 削除
rm -rf node_modules package-lock.json

# 3. 再インストール
npm install

# 4. それでも解決しない場合
npm install --legacy-peer-deps
```

### 3. TypeScript エラー

#### 症状
```
Type 'string' is not assignable to type 'never'
Property 'xxx' does not exist on type 'yyy'
```

#### 解決方法
```bash
# フロントエンドで型チェック
cd frontend
npm run typecheck

# バックエンドで型チェック
cd backend  
npm run typecheck

# TypeScript キャッシュクリア
npx tsc --build --clean
```

### 4. Expo/React Native エラー

#### 症状
```
Metro bundler failed to start
Unable to resolve module
Expo CLI not found
```

#### 解決方法
```bash
# Expo キャッシュクリア
cd frontend
npx expo start -c

# Metro キャッシュクリア  
npx react-native start --reset-cache

# Expo CLI 再インストール
npm install -g @expo/cli@latest
```

### 5. API接続エラー

#### 症状
```
Network Error
API request failed
CORS error
```

#### 解決方法
```bash
# 1. バックエンドサーバー確認
curl http://localhost:3000/health

# 2. API設定確認
# frontend/src/constants/api.ts でAPIのURLを確認

# 3. CORS設定確認
# backend/src/server.ts でCORS設定を確認
```

### 6. 認証エラー

#### 症状
```
Unauthorized
Token expired
Invalid token
```

#### 解決方法
```bash
# 1. ローカルストレージクリア（ブラウザの開発者ツール）
# Application > Local Storage > Clear All

# 2. 認証状態リセット
# アプリでログアウト後、再ログイン

# 3. JWT設定確認
# backend/.env のJWT_SECRETを確認
```

## 🔧 プラットフォーム別問題

### Windows固有の問題

#### パス区切り文字エラー
```bash
# 症状: パス区切り文字のエラー
# 解決: WSL使用またはパス修正
```

#### 権限エラー
```bash
# 管理者権限でターミナル起動
# PowerShell を管理者として実行
```

### macOS固有の問題

#### Xcode関連エラー（iOS開発時）
```bash
# Xcode Command Line Tools インストール
xcode-select --install

# iOS Simulator 確認
xcrun simctl list devices
```

## 📊 デバッグ方法

### 1. ログ確認

#### バックエンドログ
```bash
cd backend
npm run dev
# コンソールでログを確認
```

#### フロントエンドログ  
```bash
# ブラウザの開発者ツール > Console
# Network タブでAPI通信を確認
```

### 2. データベース状態確認

#### MockDB状態確認
```bash
# バックエンドサーバー起動時に自動出力される
# ユーザー、動画、メモ、タスクの件数を確認
```

### 3. API動作確認

#### 手動API確認
```bash
# ヘルスチェック
curl http://localhost:3000/health

# ログイン確認
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# タスク一覧確認（要認証）
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:3000/api/tasks
```

## 🧪 環境別テスト

### 開発環境
```bash
# 1. 依存関係確認
npm list

# 2. ビルドテスト
npm run build

# 3. テスト実行
npm test
```

### ブラウザ環境
```bash
# 1. 対応ブラウザ確認
# - Chrome: ✅ 対応
# - Firefox: ✅ 対応  
# - Safari: ✅ 対応
# - Edge: ✅ 対応

# 2. ブラウザキャッシュクリア
# Ctrl+Shift+R または Cmd+Shift+R
```

## 📋 システム要件確認

### 最小要件チェック
```bash
# Node.js バージョン確認
node --version  # v18.0.0以上

# メモリ確認（推奨8GB以上）
# Windows: wmic memorychip get size
# macOS: system_profiler SPHardwareDataType

# ディスク容量確認（推奨5GB以上の空き容量）
# Windows: dir /-c
# macOS: df -h
```

## 🔄 リセット手順

### 完全リセット（最終手段）
```bash
# 1. プロセス全終了
taskkill /F /IM node.exe

# 2. 依存関係削除・再インストール
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

cd backend && npm install
cd frontend && npm install

# 3. キャッシュクリア
npm cache clean --force
cd frontend && npx expo start -c

# 4. 再起動
cd backend && npm run dev
cd frontend && npm start
```

## 📞 サポートリソース

### プロジェクト内ドキュメント
- [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) - 起動手順
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - プロジェクト状況
- [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) - 開発ワークフロー

### 外部リソース
- [React Native トラブルシューティング](https://reactnative.dev/docs/troubleshooting)
- [Expo トラブルシューティング](https://docs.expo.dev/troubleshooting/)
- [Node.js トラブルシューティング](https://nodejs.org/en/docs/guides/debugging-getting-started/)

### コミュニティサポート
- GitHub Issues: プロジェクト固有の問題報告
- Stack Overflow: 技術的な質問
- React Native Community: フレームワーク関連

## 📝 問題報告テンプレート

```markdown
## 問題の概要
[問題の簡潔な説明]

## 環境情報
- OS: [Windows 11 / macOS 13.0 / etc]
- Node.js: [バージョン]
- ブラウザ: [Chrome 118.0 / etc]

## 再現手順
1. [手順1]
2. [手順2]
3. [手順3]

## 期待される動作
[期待していた結果]

## 実際の動作
[実際に起こった結果]

## エラーメッセージ
```
[エラーメッセージやスクリーンショット]
```

## 試行した解決方法
- [試した方法1]
- [試した方法2]
```

## 📈 パフォーマンス監視

### メトリクス確認
```bash
# メモリ使用量
# Windows: tasklist /FI "IMAGENAME eq node.exe"
# macOS: ps aux | grep node

# CPU使用率確認
# タスクマネージャー または Activity Monitor

# ネットワーク確認
# ブラウザ開発者ツール > Network タブ
```

---

*最終更新: 2025-09-10*  
*問題が解決しない場合は、GitHub Issuesで詳細情報と共に報告してください*
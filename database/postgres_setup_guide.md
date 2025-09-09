# PostgreSQL セットアップガイド

## 現在の問題
PostgreSQLサーバーは動作中ですが、`postgres`ユーザーでの認証に失敗しています。

## 確認済み情報
- ✅ PostgreSQL 17.4 インストール済み
- ✅ サービス `postgresql-x64-17` 実行中
- ❌ 認証エラー（Code: 28P01）

## 解決方法オプション

### Option 1: pgAdmin を使用（推奨）
1. pgAdmin 4 を起動
2. localhost:5432 に接続
3. 正しいパスワードでpostgresユーザーに接続
4. 新しいデータベース `mindful_replay` を作成

### Option 2: コマンドライン設定の修正
PostgreSQL設定ファイルの場所を確認：
```
C:\Program Files\PostgreSQL\17\data\pg_hba.conf
C:\Program Files\PostgreSQL\17\data\postgresql.conf
```

### Option 3: 新しいユーザーとデータベースの作成
1. pgAdminまたは別の管理ツールを使用
2. 新しいユーザー `mindful_user` を作成
3. パスワードを `mindful_password` に設定
4. データベース `mindful_replay` を作成
5. 適切な権限を付与

### Option 4: 認証方法の変更
`pg_hba.conf` で以下を確認：
- `local` connections の認証方法
- `host` connections の認証方法
- IPv4/IPv6 ローカル接続の設定

## 推奨設定（新しいユーザーの場合）

`.env` ファイル更新:
```env
DB_USER=mindful_user
DB_PASSWORD=mindful_password
DB_NAME=mindful_replay
```

## 次のステップ
1. pgAdminでデータベース接続を確認
2. 正しい認証情報で `.env` を更新
3. データベース接続テストを再実行
4. マイグレーション実行
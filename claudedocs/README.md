# MindfulReplay 開発ドキュメント

## 📋 ドキュメント索引

このディレクトリには、MindfulReplayプロジェクトの詳細な開発ドキュメントが格納されています。

## 📚 ドキュメント一覧

### 1. プロジェクト管理
| ドキュメント | 説明 | 最終更新 |
|-------------|------|---------|
| **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** | プロジェクトの現状、進捗、次のステップ | 2025-01-09 |
| **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** | 開発フロー、Git戦略、品質管理 | 2025-01-09 |

### 2. 技術設計
| ドキュメント | 説明 | 最終更新 |
|-------------|------|---------|
| **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** | システム全体のアーキテクチャ設計 | 2025-01-09 |
| **[DATABASE_DESIGN.md](./DATABASE_DESIGN.md)** | データベース設計と最適化戦略 | 2025-01-09 |
| **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** | REST API仕様の詳細定義 | 2025-01-09 |

### 3. フロントエンド設計
| ドキュメント | 説明 | 最終更新 |
|-------------|------|---------|
| **[COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md)** | React Nativeコンポーネント設計 | 2025-01-09 |

## 🎯 プロジェクト概要

**MindfulReplay**は、YouTube動画の視聴体験を「受動的な消費」から「能動的な学習」へと変革するモバイルWebアプリケーションです。

### 主要機能
- 📹 YouTube動画の保存・管理
- 📝 タイムスタンプ付きメモ作成
- ✅ 学習内容のタスク化
- 🔔 スペースドリピティション型リマインダー
- 🏷️ テーマ・タグによる体系的整理
- 🔍 横断的な全文検索

### 技術スタック
- **Frontend**: React Native (Expo) + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 14+
- **Infrastructure**: Google Cloud Platform

## 📊 現在のステータス

| カテゴリ | 完了度 | 状況 |
|---------|--------|------|
| **プロジェクト設計** | 100% | ✅ 完了 |
| **環境構築** | 100% | ✅ 完了 |
| **データベース設計** | 100% | ✅ 完了 |
| **API設計** | 100% | ✅ 完了 |
| **コンポーネント設計** | 100% | ✅ 完了 |
| **バックエンド実装** | 10% | 🔄 基盤のみ |
| **フロントエンド実装** | 0% | ⏳ 未着手 |

## 🚀 次のステップ

### Phase 1: バックエンドコア実装（Week 1-2）
1. 認証システム実装
2. 基本CRUD API開発
3. YouTube API統合

### Phase 2: フロントエンド基本実装（Week 3-4）
1. 認証フロー実装
2. 主要画面開発
3. ナビゲーション構築

### Phase 3: MVP機能完成（Week 5-6）
1. リマインダーシステム
2. 検索・フィルタ機能
3. パフォーマンス最適化

## 📖 ドキュメントの読み方

### 初めての方
1. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - プロジェクト全体の把握
2. **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** - 技術的な全体像
3. **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** - 開発の進め方

### 開発者向け
- **バックエンド開発**: [API_SPECIFICATION.md](./API_SPECIFICATION.md) + [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)
- **フロントエンド開発**: [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md)

### プロジェクトマネージャー向け
- **進捗管理**: [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- **品質管理**: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)

## 🔄 ドキュメント更新ポリシー

### 更新タイミング
- 新機能追加時
- アーキテクチャ変更時
- マイルストーン完了時
- 週次レビュー時

### 更新責任者
- **技術系**: リードエンジニア
- **仕様系**: プロダクトオーナー
- **進捗系**: プロジェクトマネージャー

## 📞 問い合わせ

### ドキュメントに関する質問
- GitHub Issues で「documentation」ラベルを付けて起票
- 技術的質問は対応するドキュメントにコメント

### ドキュメント改善提案
1. 該当ドキュメントのIssue作成
2. 改善内容の具体的な説明
3. 優先度の明記

## 🔗 関連リソース

### プロジェクトリソース
- **メインREADME**: [../README.md](../README.md)
- **元設計ドキュメント**: [../docs/](../docs/)
- **データベーススキーマ**: [../database/schema.sql](../database/schema.sql)

### 外部リソース
- [React Native ドキュメント](https://reactnative.dev/docs/getting-started)
- [Expo ドキュメント](https://docs.expo.dev/)
- [PostgreSQL ドキュメント](https://www.postgresql.org/docs/14/)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)

---

*最終更新: 2025-01-09*  
*この索引は新しいドキュメントの追加に応じて更新されます*
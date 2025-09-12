# YouTube動画視聴問題 - デバッグテストプラン

## 実装した機能

### 1. 包括的デバッグログ
- **YouTubePlayer.tsx**: 動画ID、プラットフォーム、WebView設定の詳細ログ
- **VideoPlayer.tsx**: 視聴状態とプレイヤーイベントログ
- YouTube IFrame APIのロード状況とエラーログ

### 2. エラーハンドリング強化
- YouTubeエラーコード別の詳細メッセージ（日本語対応）
- 埋め込み制限動画の自動判定
- ユーザー向けの解決方法提示

### 3. WebView設定最適化
- プラットフォーム別ユーザーエージェント設定
- Cookie有効化とサードパーティCookie許可
- 最適化されたmixedContentMode設定

## テストケース

### A. 正常再生動画
- **dQw4w9WgXcQ** (Rick Astley - Never Gonna Give You Up)
- 期待結果: Web/Mobileともに正常再生

### B. 埋め込み制限動画（疑似）
- エラーコード101/150が発生する可能性のある動画
- 期待結果: 詳細なエラーメッセージとYouTube開く選択肢表示

### C. 削除/非公開動画
- 無効なID (例: "invalidVideoId123")
- 期待結果: エラーコード100で適切なエラーメッセージ

## デバッグログ確認項目

### WebView実装時
```
[YouTubePlayer] Mobile WebView implementation:
  - videoId: 動画ID
  - platform: ios/android
  - userAgent: 最適化されたUA
  - webViewSettings: 設定値一覧

[YouTubePlayer] Loading YouTube IFrame API for: 動画ID
[YouTubePlayer] YouTube IFrame API loaded successfully
[YouTubePlayer] Player ready for video: 動画ID
```

### エラー発生時
```
[YouTubePlayer] Video error:
  - errorCode: エラーコード
  - errorMessage: エラー内容
  - isEmbeddingRestricted: 埋め込み制限フラグ
```

## 実測結果記録

### Web vs Mobile 比較結果
| 動画ID | Web結果 | Mobile結果 | エラーコード | 原因分析 |
|--------|---------|------------|-------------|----------|
| [記録予定] | [結果] | [結果] | [コード] | [分析] |

## 期待される効果
1. Web/Mobile間の動画視聴問題の根本原因特定
2. 埋め込み制限動画の事前判定
3. ユーザーフレンドリーなエラーメッセージ
4. 問題動画のフォールバック機能
import { Alert, Platform } from 'react-native';

/**
 * クロスプラットフォーム対応のダイアログサービス
 * Web環境とNative環境で統一されたインターフェースを提供
 */
class DialogService {
  /**
   * 確認ダイアログを表示
   * @param message 確認メッセージ
   * @param title タイトル（オプション）
   * @returns Promise<boolean> ユーザーの選択結果
   */
  async confirm(message: string, title?: string): Promise<boolean> {
    const isWebEnv = this.isWeb();
    console.log('[DialogService] confirm() - Platform detection:', {
      isWeb: isWebEnv,
      platformOS: Platform.OS,
      hasWindow: typeof window !== 'undefined',
      hasWindowAlert: typeof window !== 'undefined' && !!window.alert
    });

    return new Promise((resolve) => {
      if (isWebEnv) {
        console.log('[DialogService] Using window.confirm for Web environment');
        // Web環境: window.confirmを使用
        const result = window.confirm(title ? `${title}\n\n${message}` : message);
        resolve(result);
      } else {
        console.log('[DialogService] Using Alert.alert for Native environment');
        console.log('[DialogService] Alert object availability:', !!Alert, typeof Alert);
        
        // Native環境: Alert.alertを使用
        try {
          Alert.alert(
            title || '確認',
            message,
            [
              {
                text: 'キャンセル',
                style: 'cancel',
                onPress: () => {
                  console.log('[DialogService] User selected: Cancel');
                  resolve(false);
                },
              },
              {
                text: 'OK',
                style: 'default',
                onPress: () => {
                  console.log('[DialogService] User selected: OK');
                  resolve(true);
                },
              },
            ],
            { 
              cancelable: true, 
              onDismiss: () => {
                console.log('[DialogService] Dialog dismissed');
                resolve(false);
              }
            }
          );
          console.log('[DialogService] Alert.alert called successfully');
        } catch (error) {
          console.error('[DialogService] Error calling Alert.alert:', error);
          // フォールバック: 簡単な確認
          const fallbackResult = confirm ? confirm(title ? `${title}\n\n${message}` : message) : true;
          console.log('[DialogService] Using fallback confirmation:', fallbackResult);
          resolve(fallbackResult);
        }
      }
    });
  }

  /**
   * アラートダイアログを表示
   * @param message アラートメッセージ
   * @param title タイトル（オプション）
   * @returns Promise<void>
   */
  async alert(message: string, title?: string): Promise<void> {
    const isWebEnv = this.isWeb();
    console.log('[DialogService] alert() - Platform detection:', {
      isWeb: isWebEnv,
      platformOS: Platform.OS,
      message,
      title
    });

    return new Promise((resolve) => {
      if (isWebEnv) {
        console.log('[DialogService] Using window.alert for Web environment');
        // Web環境: window.alertを使用
        window.alert(title ? `${title}\n\n${message}` : message);
        resolve();
      } else {
        console.log('[DialogService] Using Alert.alert for Native environment');
        console.log('[DialogService] Alert object availability:', !!Alert, typeof Alert);
        
        // Native環境: Alert.alertを使用
        try {
          Alert.alert(
            title || 'お知らせ',
            message,
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('[DialogService] Alert dismissed');
                  resolve();
                },
              },
            ]
          );
          console.log('[DialogService] Alert.alert called successfully');
        } catch (error) {
          console.error('[DialogService] Error calling Alert.alert:', error);
          // フォールバック: コンソールログとして出力
          console.log('[DialogService] Fallback alert:', title, message);
          resolve();
        }
      }
    });
  }

  /**
   * 削除確認ダイアログを表示
   * @param itemName 削除対象のアイテム名
   * @param itemType アイテムの種類（メモ、タスクなど）
   * @returns Promise<boolean> ユーザーの選択結果
   */
  async confirmDelete(itemName: string, itemType: string = 'アイテム'): Promise<boolean> {
    const message = `「${itemName}」を削除しますか？\n\nこの操作は取り消せません。`;
    const title = `${itemType}を削除`;
    
    return this.confirm(message, title);
  }

  /**
   * 成功メッセージを表示
   * @param message 成功メッセージ
   * @param title タイトル（オプション）
   */
  async showSuccess(message: string, title: string = '成功'): Promise<void> {
    return this.alert(message, title);
  }

  /**
   * エラーメッセージを表示
   * @param message エラーメッセージ
   * @param title タイトル（オプション）
   */
  async showError(message: string, title: string = 'エラー'): Promise<void> {
    return this.alert(message, title);
  }

  /**
   * ログアウト確認ダイアログを表示
   * @returns Promise<boolean> ユーザーの選択結果
   */
  async confirmLogout(): Promise<boolean> {
    return this.confirm('ログアウトしますか？', 'ログアウト');
  }

  /**
   * Web環境かどうかを判定
   * @returns boolean
   */
  private isWeb(): boolean {
    // React Nativeのバンドラーが存在する場合はネイティブ環境
    if (typeof __DEV__ !== 'undefined') {
      console.log('[DialogService] React Native environment detected via __DEV__');
      return Platform.OS === 'web';
    }
    
    // Platform.OSが利用可能な場合は、それを信頼する
    if (Platform && Platform.OS) {
      const isWebPlatform = Platform.OS === 'web';
      console.log('[DialogService] Platform.OS detected:', Platform.OS, 'isWeb:', isWebPlatform);
      return isWebPlatform;
    }
    
    // フォールバック: windowオブジェクトの存在とlocationプロパティで判定
    const hasWebWindow = typeof window !== 'undefined' && 
                        window.location && 
                        window.document &&
                        typeof window.document.createElement === 'function';
    
    console.log('[DialogService] Fallback web detection:', hasWebWindow);
    return hasWebWindow;
  }
}

// シングルトンインスタンスをエクスポート
export const dialogService = new DialogService();

// 便利な関数をエクスポート
export const showDialog = dialogService;
export const confirmDialog = (message: string, title?: string) => dialogService.confirm(message, title);
export const alertDialog = (message: string, title?: string) => dialogService.alert(message, title);
export const confirmDeleteDialog = (itemName: string, itemType?: string) => 
  dialogService.confirmDelete(itemName, itemType);
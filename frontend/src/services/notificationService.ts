import { Alert } from 'react-native';
import { Task, Memo, Video } from '@/types';

export interface NotificationSettings {
  taskReminders: boolean;
  reviewReminders: boolean;
  suggestionNotifications: boolean;
  reminderHour: number; // 0-23
}

export interface ReminderData {
  id: string;
  type: 'task_due' | 'memo_review' | 'video_suggestion';
  title: string;
  message: string;
  scheduledAt: Date;
  data?: any;
}

class NotificationService {
  private settings: NotificationSettings = {
    taskReminders: true,
    reviewReminders: true,
    suggestionNotifications: true,
    reminderHour: 9, // 午前9時
  };

  private reminders: ReminderData[] = [];

  // 設定の管理
  updateSettings(settings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...settings };
    // 実際のアプリでは AsyncStorage に保存
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  // タスク期限リマインダーを設定
  scheduleTaskReminder(task: Task) {
    if (!this.settings.taskReminders || !task.due_date) return;

    const dueDate = new Date(task.due_date);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(dueDate.getDate() - 1); // 1日前にリマインド

    if (reminderDate <= new Date()) return; // 過去の日付はスキップ

    const reminder: ReminderData = {
      id: `task_${task.id}`,
      type: 'task_due',
      title: 'タスクの期限が近づいています',
      message: `「${task.title}」の期限は明日です`,
      scheduledAt: reminderDate,
      data: { taskId: task.id },
    };

    this.addReminder(reminder);
  }

  // メモ復習リマインダーを設定
  scheduleMemoReview(memo: Memo, video?: Video) {
    if (!this.settings.reviewReminders) return;

    const createdDate = new Date(memo.created_at);
    const reviewDates = this.calculateReviewSchedule(createdDate, memo.importance || 3);

    reviewDates.forEach((reviewDate, index) => {
      if (reviewDate <= new Date()) return; // 過去の日付はスキップ

      const reminder: ReminderData = {
        id: `memo_review_${memo.id}_${index}`,
        type: 'memo_review',
        title: '復習のお時間です',
        message: this.getMemoReviewMessage(memo, video),
        scheduledAt: reviewDate,
        data: { memoId: memo.id, videoId: memo.video_id },
      };

      this.addReminder(reminder);
    });
  }

  // 動画再視聴提案を設定
  scheduleVideoSuggestion(video: Video, lastViewedAt: Date) {
    if (!this.settings.suggestionNotifications) return;

    const suggestionDate = new Date(lastViewedAt);
    suggestionDate.setDate(suggestionDate.getDate() + 7); // 1週間後に提案

    if (suggestionDate <= new Date()) return;

    const reminder: ReminderData = {
      id: `video_suggestion_${video.id}`,
      type: 'video_suggestion',
      title: '再視聴はいかがですか？',
      message: `「${video.title}」をもう一度見て、新しい発見があるかもしれません`,
      scheduledAt: suggestionDate,
      data: { videoId: video.id },
    };

    this.addReminder(reminder);
  }

  // エビングハウスの忘却曲線を参考にした復習スケジュール計算
  private calculateReviewSchedule(createdDate: Date, importance: number): Date[] {
    const schedule = [];
    const baseIntervals = [1, 3, 7, 14, 30]; // 日数

    // 重要度が高いほど頻繁に復習
    const importanceMultiplier = importance >= 4 ? 0.7 : importance >= 3 ? 1 : 1.5;

    baseIntervals.forEach(interval => {
      const adjustedInterval = Math.round(interval * importanceMultiplier);
      const reviewDate = new Date(createdDate);
      reviewDate.setDate(createdDate.getDate() + adjustedInterval);
      
      // リマインド時刻を設定（午前9時など）
      reviewDate.setHours(this.settings.reminderHour, 0, 0, 0);
      
      schedule.push(reviewDate);
    });

    return schedule;
  }

  private getMemoReviewMessage(memo: Memo, video?: Video): string {
    const videoTitle = video?.title || '動画';
    const memoPreview = memo.content.length > 50 
      ? memo.content.substring(0, 50) + '...' 
      : memo.content;

    return `${videoTitle}について作成したメモ「${memoPreview}」を復習しませんか？`;
  }

  private addReminder(reminder: ReminderData) {
    this.reminders.push(reminder);
    // 実際のアプリでは React Native の通知ライブラリを使用
    console.log('Reminder scheduled:', reminder);
  }

  // 即座に表示する通知（アプリ内通知）
  showInAppNotification(title: string, message: string, onPress?: () => void) {
    Alert.alert(
      title,
      message,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '確認', 
          onPress: onPress || (() => {}),
        }
      ]
    );
  }

  // 期限が近いタスクをチェック
  checkUpcomingTasks(tasks: Task[]): Task[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      const dueDate = new Date(task.due_date);
      return dueDate <= tomorrow && dueDate >= new Date();
    });
  }

  // 復習すべきメモをチェック
  checkMemosForReview(memos: Memo[]): Memo[] {
    const today = new Date();
    
    return memos.filter(memo => {
      const createdDate = new Date(memo.created_at);
      const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // 重要度に基づいて復習タイミングを判定
      const reviewIntervals = memo.importance >= 4 ? [1, 2, 5, 10, 21] : [1, 3, 7, 14, 30];
      
      return reviewIntervals.includes(daysSinceCreated);
    });
  }

  // 関連動画を提案すべき動画をチェック
  checkVideosForSuggestion(videos: { video: Video; lastViewedAt: Date }[]): Video[] {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return videos
      .filter(({ lastViewedAt }) => {
        const viewedDate = new Date(lastViewedAt);
        return viewedDate <= oneWeekAgo;
      })
      .map(({ video }) => video);
  }

  // 今日のリマインダーを取得
  getTodaysReminders(): ReminderData[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return this.reminders.filter(reminder => {
      const reminderDate = new Date(reminder.scheduledAt);
      return reminderDate >= today && reminderDate < tomorrow;
    });
  }

  // リマインダーを削除
  removeReminder(id: string) {
    this.reminders = this.reminders.filter(reminder => reminder.id !== id);
  }

  // すべてのリマインダーを取得（デバッグ用）
  getAllReminders(): ReminderData[] {
    return [...this.reminders];
  }
}

export const notificationService = new NotificationService();
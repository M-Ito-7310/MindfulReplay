import { Video, Memo, Task, ViewingSession } from '@/types';
import { notificationService } from './notificationService';
import { recommendationService, RecommendationResult } from './recommendationService';

export interface CycleProgress {
  stage: 'viewing' | 'memo_creation' | 'task_creation' | 'action' | 'review';
  completionPercentage: number;
  nextSteps: string[];
  achievements: string[];
}

export interface ViewingCycleStats {
  totalCycles: number;
  completedCycles: number;
  averageCycleTime: number;
  mostActiveStage: string;
  improvementAreas: string[];
}

class ViewingCycleService {
  
  // 視聴サイクルを開始
  startViewingCycle(video: Video): ViewingSession {
    const session: ViewingSession = {
      id: `session_${Date.now()}`,
      user_id: 'user_1', // 実際のアプリでは認証されたユーザーID
      video_id: video.id,
      watch_duration: 0,
      pause_count: 0,
      rewind_count: 0,
      engagement_level: 3,
      created_at: new Date().toISOString(),
    };

    // 視聴開始の通知設定
    notificationService.showInAppNotification(
      '視聴開始',
      `「${video.title}」の視聴を開始しました。気づいたことがあればメモを残しましょう！`
    );

    return session;
  }

  // 視聴完了時の処理
  completeViewing(session: ViewingSession, video: Video): {
    session: ViewingSession;
    recommendations: RecommendationResult;
    memoSuggestion: string;
  } {
    const completedSession = {
      ...session,
      completed_at: new Date().toISOString(),
    };

    // メモ作成を促す通知
    const memoSuggestion = this.generateMemoSuggestion(video, session);
    
    // 関連コンテンツの推薦
    const recommendations = recommendationService.suggestNextStepsFromTask(
      { id: 'temp', user_id: session.user_id, title: `${video.title}の視聴`, description: '', status: 'completed', priority: 'medium', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      []
    );

    // リマインダーの設定
    this.scheduleViewingReminders(video, session);

    return {
      session: completedSession,
      recommendations,
      memoSuggestion,
    };
  }

  // メモ作成時のサイクル進行
  progressWithMemo(memo: Memo, video: Video): {
    taskSuggestions: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high'; reason: string }>;
    nextSteps: string[];
  } {
    // タスク提案の生成
    const taskSuggestions = recommendationService.suggestTasksFromMemo(memo);
    
    // メモベースのリマインダー設定
    notificationService.scheduleMemoReview(memo, video);

    const nextSteps = [
      'メモからアクションプランを作成する',
      '関連する他の動画を探す',
      '学んだことを実践に移す',
    ];

    return {
      taskSuggestions,
      nextSteps,
    };
  }

  // タスク作成時のサイクル進行
  progressWithTask(task: Task, memo: Memo, video: Video): {
    actionPlan: string[];
    reminders: string[];
  } {
    // タスクリマインダーの設定
    notificationService.scheduleTaskReminder(task);

    const actionPlan = [
      'タスクを具体的なステップに分解する',
      '実行スケジュールを決める',
      '必要なリソースを準備する',
      '進捗を定期的に確認する',
    ];

    const reminders = [
      '期限前日にリマインド通知',
      '完了後の振り返りメモ作成',
      '次のステップの計画立案',
    ];

    return {
      actionPlan,
      reminders,
    };
  }

  // タスク完了時のサイクル完成
  completeTask(task: Task, relatedMemos: Memo[]): {
    cycleComplete: boolean;
    nextCycleSuggestions: RecommendationResult;
    achievements: string[];
  } {
    const nextCycleSuggestions = recommendationService.suggestNextStepsFromTask(task, relatedMemos);
    
    const achievements = [
      `タスク「${task.title}」を完了しました！`,
      '新しいスキルを身につけました',
      '継続的な成長サイクルを実践中です',
    ];

    // 成功通知
    notificationService.showInAppNotification(
      'サイクル完了！',
      `おめでとうございます！視聴から実践までの成長サイクルを完了しました。`,
      () => {
        // 次のサイクルへの誘導処理
      }
    );

    return {
      cycleComplete: true,
      nextCycleSuggestions,
      achievements,
    };
  }

  // 現在のサイクル進捗を分析
  analyzeCycleProgress(
    sessions: ViewingSession[],
    memos: Memo[],
    tasks: Task[]
  ): CycleProgress {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const totalItems = sessions.length + memos.length + tasks.length;
    const completedItems = sessions.filter(s => s.completed_at).length + memos.length + completedTasks.length;
    
    const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    let stage: CycleProgress['stage'] = 'viewing';
    if (tasks.length > 0) stage = 'task_creation';
    if (completedTasks.length > 0) stage = 'action';
    if (memos.length > 0) stage = 'memo_creation';
    if (completionPercentage >= 80) stage = 'review';

    const nextSteps = this.generateNextSteps(stage, {
      sessions: sessions.length,
      memos: memos.length,
      tasks: tasks.length,
      completedTasks: completedTasks.length,
    });

    const achievements = this.generateAchievements(completedTasks.length, memos.length, sessions.length);

    return {
      stage,
      completionPercentage,
      nextSteps,
      achievements,
    };
  }

  // 視聴サイクルの統計を取得
  getCycleStats(
    allSessions: ViewingSession[],
    allMemos: Memo[],
    allTasks: Task[]
  ): ViewingCycleStats {
    const completedSessions = allSessions.filter(s => s.completed_at);
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    
    // 完了サイクル数の計算（簡易版）
    const completedCycles = Math.min(completedSessions.length, allMemos.length, completedTasks.length);
    
    // 平均サイクル時間の計算（仮実装）
    const averageCycleTime = completedSessions.length > 0 
      ? completedSessions.reduce((acc, session) => {
          if (session.completed_at) {
            const duration = new Date(session.completed_at).getTime() - new Date(session.created_at).getTime();
            return acc + duration / (1000 * 60 * 60 * 24); // 日数
          }
          return acc;
        }, 0) / completedSessions.length
      : 0;

    const mostActiveStage = this.determineMostActiveStage(allSessions, allMemos, allTasks);
    const improvementAreas = this.identifyImprovementAreas(allSessions, allMemos, allTasks);

    return {
      totalCycles: Math.max(completedSessions.length, allMemos.length, allTasks.length),
      completedCycles,
      averageCycleTime,
      mostActiveStage,
      improvementAreas,
    };
  }

  // プライベートヘルパーメソッド
  private generateMemoSuggestion(video: Video, session: ViewingSession): string {
    const engagementLevel = session.engagement_level || 3;
    
    if (engagementLevel >= 4) {
      return `「${video.title}」から得た重要な気づきを記録しましょう！特に印象に残った部分はありましたか？`;
    } else if (engagementLevel >= 3) {
      return `「${video.title}」を視聴お疲れさまでした。参考になったポイントをメモに残しませんか？`;
    } else {
      return `視聴内容を振り返って、簡単なメモを作成してみましょう。`;
    }
  }

  private scheduleViewingReminders(video: Video, session: ViewingSession): void {
    // 1週間後に再視聴を提案
    const lastViewedAt = new Date(session.completed_at || session.created_at);
    notificationService.scheduleVideoSuggestion(video, lastViewedAt);
  }

  private generateNextSteps(stage: CycleProgress['stage'], counts: any): string[] {
    switch (stage) {
      case 'viewing':
        return [
          '動画を視聴して新しい知識を得る',
          '重要なポイントに注意を払う',
          '疑問点があれば一時停止して考える',
        ];
      case 'memo_creation':
        return [
          '視聴内容の重要ポイントをメモする',
          '気づきや学びを言語化する',
          'アクションプランを考える',
        ];
      case 'task_creation':
        return [
          'メモからタスクを作成する',
          '具体的で実行可能な目標を設定する',
          '期限とプライオリティを決める',
        ];
      case 'action':
        return [
          'タスクを実行に移す',
          '進捗を記録する',
          '必要に応じて調整する',
        ];
      case 'review':
        return [
          'サイクル全体を振り返る',
          '学びと成果を評価する',
          '次のサイクルを計画する',
        ];
      default:
        return ['次のステップを計画する'];
    }
  }

  private generateAchievements(completedTasks: number, memos: number, sessions: number): string[] {
    const achievements = [];
    
    if (sessions >= 5) achievements.push('🎬 5本以上の動画を視聴');
    if (sessions >= 10) achievements.push('🏆 10本の動画視聴達成');
    if (memos >= 3) achievements.push('📝 3つ以上のメモを作成');
    if (memos >= 10) achievements.push('✍️ 10個のメモ作成マスター');
    if (completedTasks >= 1) achievements.push('✅ 初回タスク完了');
    if (completedTasks >= 5) achievements.push('🎯 5つのタスクを完了');
    if (completedTasks >= 10) achievements.push('💪 10タスク完了の実行者');

    return achievements.slice(0, 3); // 最大3つまで表示
  }

  private determineMostActiveStage(sessions: ViewingSession[], memos: Memo[], tasks: Task[]): string {
    const stageActivity = {
      viewing: sessions.length,
      memo_creation: memos.length,
      task_creation: tasks.length,
    };

    const mostActive = Object.entries(stageActivity).reduce((a, b) => 
      stageActivity[a[0] as keyof typeof stageActivity] > stageActivity[b[0] as keyof typeof stageActivity] ? a : b
    );

    return mostActive[0];
  }

  private identifyImprovementAreas(sessions: ViewingSession[], memos: Memo[], tasks: Task[]): string[] {
    const improvements = [];
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (sessions.length > memos.length * 2) {
      improvements.push('視聴後のメモ作成を増やす');
    }
    if (memos.length > tasks.length * 2) {
      improvements.push('メモからタスクへの変換を増やす');
    }
    if (tasks.length > completedTasks.length * 2) {
      improvements.push('タスクの完了率を上げる');
    }
    if (sessions.length > 0 && !sessions.some(s => s.engagement_level && s.engagement_level >= 4)) {
      improvements.push('より深い視聴体験を心がける');
    }

    return improvements.slice(0, 2); // 最大2つまで
  }
}

export const viewingCycleService = new ViewingCycleService();
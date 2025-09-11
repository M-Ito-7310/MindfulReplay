import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Button } from '@/components/common';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { Video, Memo, Task, ViewingSession } from '@/types';
import { notificationService, ReminderData } from '@/services/notificationService';
import { ProgressTracking } from '@/components/progress/ProgressTracking';
import { recommendationService } from '@/services/recommendationService';
import { viewingCycleService, CycleProgress } from '@/services/viewingCycleService';

interface DashboardScreenProps {
  navigation?: any;
}

interface ViewingStats {
  todayWatchTime: number;
  todayMemoCount: number;
  todayTaskCompleted: number;
  weeklyProgress: number;
  streak: number;
}

interface ProgressData {
  totalVideos: number;
  totalMemos: number;
  totalTasks: number;
  completedTasks: number;
  streakDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [stats, setStats] = useState<ViewingStats>({
    todayWatchTime: 0,
    todayMemoCount: 0,
    todayTaskCompleted: 0,
    weeklyProgress: 0,
    streak: 0,
  });
  const [recentMemos, setRecentMemos] = useState<Memo[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [suggestedVideos, setSuggestedVideos] = useState<Video[]>([]);
  const [todaysReminders, setTodaysReminders] = useState<ReminderData[]>([]);
  const [progressData, setProgressData] = useState<ProgressData>({
    totalVideos: 0,
    totalMemos: 0,
    totalTasks: 0,
    completedTasks: 0,
    streakDays: 0,
    weeklyGoal: 10,
    weeklyProgress: 0,
  });
  const [showProgressTracking, setShowProgressTracking] = useState(false);
  const [cycleProgress, setCycleProgress] = useState<CycleProgress>({
    stage: 'viewing',
    completionPercentage: 0,
    nextSteps: [],
    achievements: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 今日のリマインダーを取得
      const reminders = notificationService.getTodaysReminders();
      setTodaysReminders(reminders);
      
      // TODO: 実際のAPIからデータを取得する実装
      // const videosResponse = await apiService.get('/videos');
      // const memosResponse = await apiService.get('/memos');
      // const tasksResponse = await apiService.get('/tasks');
      
      // 現在は空のデータでサイクル進捗を初期化
      const emptySessions: ViewingSession[] = [];
      const emptyMemos: Memo[] = [];
      const emptyTasks: Task[] = [];
      
      const cycleAnalysis = viewingCycleService.analyzeCycleProgress(emptySessions, emptyMemos, emptyTasks);
      setCycleProgress(cycleAnalysis);
      
      console.log('[Dashboard] Data loaded - no sample data used');
    } catch (error) {
      console.error('[Dashboard] Failed to load dashboard data:', error);
    }
  };

  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
  };

  const viewAllTasks = () => {
    if (navigation) {
      navigation.navigate('TaskList');
    }
  };

  const viewProgressTracking = () => {
    setShowProgressTracking(true);
  };

  const closeProgressTracking = () => {
    setShowProgressTracking(false);
  };

  const getStageName = (stage: CycleProgress['stage']): string => {
    switch (stage) {
      case 'viewing': return '動画視聴中';
      case 'memo_creation': return 'メモ作成中';
      case 'task_creation': return 'タスク作成中';
      case 'action': return '実践中';
      case 'review': return '振り返り中';
      default: return '進行中';
    }
  };

  const getStageIndex = (stage: CycleProgress['stage']): number => {
    switch (stage) {
      case 'viewing': return 0;
      case 'memo_creation': return 1;
      case 'task_creation': return 2;
      case 'action': return 3;
      case 'review': return 4;
      default: return 0;
    }
  };

  const handleReminderPress = (reminder: ReminderData) => {
    switch (reminder.type) {
      case 'task_due':
        if (navigation && reminder.data?.taskId) {
          navigation.navigate('TaskEdit', { taskId: reminder.data.taskId });
        }
        break;
      case 'memo_review':
        if (navigation && reminder.data?.videoId) {
          navigation.navigate('VideoPlayer', { videoId: reminder.data.videoId });
        }
        break;
      case 'video_suggestion':
        if (navigation && reminder.data?.videoId) {
          navigation.navigate('VideoPlayer', { videoId: reminder.data.videoId });
        }
        break;
    }
    notificationService.removeReminder(reminder.id);
    setTodaysReminders(prev => prev.filter(r => r.id !== reminder.id));
  };

  const getReminderIcon = (type: ReminderData['type']): string => {
    switch (type) {
      case 'task_due': return '⏰';
      case 'memo_review': return '📚';
      case 'video_suggestion': return '🎬';
      default: return '💡';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.greeting}>今日も新しい発見を始めましょう！</Text>
        <Text style={styles.streak}>🔥 {stats.streak}日連続視聴中</Text>
      </View>


      {/* 今日の統計 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日の視聴</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatWatchTime(stats.todayWatchTime)}</Text>
            <Text style={styles.statLabel}>視聴時間</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.todayMemoCount}</Text>
            <Text style={styles.statLabel}>作成メモ</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.todayTaskCompleted}</Text>
            <Text style={styles.statLabel}>完了タスク</Text>
          </View>
        </View>
      </View>

      {/* 週次進捗 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>週次進捗</Text>
          <TouchableOpacity onPress={viewProgressTracking}>
            <Text style={styles.sectionLink}>詳細を見る</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>今週の目標達成率</Text>
            <Text style={styles.progressValue}>{stats.weeklyProgress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${stats.weeklyProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressHint}>
            目標まであと{100 - stats.weeklyProgress}%です！
          </Text>
        </View>
      </View>

      {/* 今日のリマインダー */}
      {todaysReminders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日のリマインダー</Text>
          {todaysReminders.map((reminder) => (
            <TouchableOpacity
              key={reminder.id}
              style={styles.reminderCard}
              onPress={() => handleReminderPress(reminder)}
            >
              <Text style={styles.reminderIcon}>
                {getReminderIcon(reminder.type)}
              </Text>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <Text style={styles.reminderText}>{reminder.message}</Text>
              </View>
              <View style={styles.reminderArrow}>
                <Text style={styles.reminderArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 成長サイクル進捗 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>あなたの成長サイクル</Text>
        <View style={styles.cycleCard}>
          <View style={styles.cycleHeader}>
            <Text style={styles.cycleStage}>
              {getStageName(cycleProgress.stage)}
            </Text>
            <Text style={styles.cyclePercentage}>
              {Math.round(cycleProgress.completionPercentage)}%
            </Text>
          </View>
          <View style={styles.cycleProgress}>
            <View style={styles.cycleSteps}>
              {['視聴', 'メモ', 'タスク', '実践', '振返'].map((step, index) => (
                <View key={step} style={styles.cycleStep}>
                  <View style={[
                    styles.cycleStepCircle,
                    index <= getStageIndex(cycleProgress.stage) && styles.cycleStepActive
                  ]}>
                    <Text style={[
                      styles.cycleStepText,
                      index <= getStageIndex(cycleProgress.stage) && styles.cycleStepTextActive
                    ]}>
                      {step}
                    </Text>
                  </View>
                  {index < 4 && <View style={[
                    styles.cycleStepLine,
                    index < getStageIndex(cycleProgress.stage) && styles.cycleStepLineActive
                  ]} />}
                </View>
              ))}
            </View>
          </View>
          {cycleProgress.nextSteps.length > 0 && (
            <View style={styles.nextStepsContainer}>
              <Text style={styles.nextStepsTitle}>次のステップ：</Text>
              <Text style={styles.nextStepText}>
                {cycleProgress.nextSteps[0]}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 今日のおすすめ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日のおすすめ</Text>
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationIcon}>💡</Text>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>継続的な振り返り</Text>
            <Text style={styles.recommendationText}>
              過去の動画を再視聴して、新しい気づきを見つけませんか？
            </Text>
          </View>
          <TouchableOpacity style={styles.recommendationButton}>
            <Text style={styles.recommendationButtonText}>動画を見る</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 本日のタスク */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>本日のタスク</Text>
          <TouchableOpacity onPress={viewAllTasks}>
            <Text style={styles.sectionLink}>すべて見る</Text>
          </TouchableOpacity>
        </View>
        {pendingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>今日のタスクはありません</Text>
            <Text style={styles.emptyStateSubtext}>新しいタスクを追加しましょう</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {/* タスクリストの実装 */}
          </View>
        )}
      </View>

      {/* 最近のメモ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近のメモ</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('MemoList')}>
            <Text style={styles.sectionLink}>すべて見る</Text>
          </TouchableOpacity>
        </View>
        {recentMemos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>メモがありません</Text>
            <Text style={styles.emptyStateSubtext}>視聴の気づきを記録しましょう</Text>
          </View>
        ) : (
          <View style={styles.memoList}>
            {/* メモリストの実装 */}
          </View>
        )}
      </View>

      {/* 進捗トラッキング詳細モーダル */}
      {showProgressTracking && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>成長記録</Text>
              <TouchableOpacity onPress={closeProgressTracking} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <ProgressTracking
                totalVideos={progressData.totalVideos}
                totalMemos={progressData.totalMemos}
                totalTasks={progressData.totalTasks}
                completedTasks={progressData.completedTasks}
                streakDays={progressData.streakDays}
                weeklyGoal={progressData.weeklyGoal}
                weeklyProgress={progressData.weeklyProgress}
              />
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    padding: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
  },
  greeting: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  streak: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.SUCCESS,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  section: {
    marginBottom: SPACING.LG,
    paddingHorizontal: SPACING.MD,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  sectionLink: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.XS,
    ...SHADOWS.SMALL,
  },
  statValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  progressCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  progressValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.SUCCESS,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 4,
    marginBottom: SPACING.SM,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  recommendationIcon: {
    fontSize: 32,
    marginRight: SPACING.MD,
  },
  recommendationContent: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  recommendationTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  recommendationText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  recommendationButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.SM,
  },
  recommendationButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  emptyState: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.XL,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
  },
  taskList: {
    // タスクリストのスタイル
  },
  memoList: {
    // メモリストのスタイル
  },
  reminderCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.WARNING,
    ...SHADOWS.SMALL,
  },
  reminderIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
  },
  reminderContent: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  reminderTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  reminderText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  reminderArrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderArrowText: {
    fontSize: 18,
    color: COLORS.TEXT_MUTED,
  },
  
  // モーダル関連のスタイル
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    maxHeight: '90%',
    width: '95%',
    maxWidth: 500,
    ...SHADOWS.MEDIUM,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
  modalContent: {
    maxHeight: 600,
  },

  // サイクル進捗関連スタイル
  cycleCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  cycleStage: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
  },
  cyclePercentage: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.SUCCESS,
  },
  cycleProgress: {
    marginBottom: SPACING.MD,
  },
  cycleSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cycleStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cycleStepCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.GRAY_300,
  },
  cycleStepActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  cycleStepText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  cycleStepTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
  cycleStepLine: {
    height: 2,
    flex: 1,
    backgroundColor: COLORS.GRAY_300,
    marginHorizontal: SPACING.XS,
  },
  cycleStepLineActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  nextStepsContainer: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.SM,
  },
  nextStepsTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  nextStepText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18,
  },
});
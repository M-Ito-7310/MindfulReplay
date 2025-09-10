import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface ProgressTrackingProps {
  totalVideos: number;
  totalMemos: number;
  totalTasks: number;
  completedTasks: number;
  streakDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

const { width } = Dimensions.get('window');
const chartWidth = width - (SPACING.MD * 4);

export const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  totalVideos,
  totalMemos,
  totalTasks,
  completedTasks,
  streakDays,
  weeklyGoal,
  weeklyProgress,
}) => {
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getStreakMessage = (): string => {
    if (streakDays >= 30) return '素晴らしい継続力です！🏆';
    if (streakDays >= 14) return '2週間連続達成！👏';
    if (streakDays >= 7) return '1週間継続中！🔥';
    if (streakDays >= 3) return '良いペースです！💪';
    return '継続していきましょう！';
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return COLORS.SUCCESS;
    if (progress >= 60) return COLORS.WARNING;
    return COLORS.ERROR;
  };

  const renderProgressBar = (progress: number, maxWidth: number) => (
    <View style={[styles.progressBar, { width: maxWidth }]}>
      <View 
        style={[
          styles.progressFill, 
          { 
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: getProgressColor(progress)
          }
        ]} 
      />
    </View>
  );

  const renderCircularProgress = (progress: number, size: number) => {
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // React NativeではSVGが直接使えないため、簡易版を作成
    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <Text style={styles.circularProgressText}>{Math.round(progress)}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 全体統計 */}
      <View style={styles.statsOverview}>
        <Text style={styles.sectionTitle}>あなたの成長</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalVideos}</Text>
            <Text style={styles.statLabel}>視聴動画数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalMemos}</Text>
            <Text style={styles.statLabel}>作成メモ数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>完了タスク</Text>
          </View>
        </View>
      </View>

      {/* 継続ストリーク */}
      <View style={styles.streakSection}>
        <Text style={styles.sectionTitle}>継続記録</Text>
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{streakDays}</Text>
          <Text style={styles.streakLabel}>日連続</Text>
          <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
        </View>
      </View>

      {/* 週次進捗 */}
      <View style={styles.weeklySection}>
        <Text style={styles.sectionTitle}>今週の進捗</Text>
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyLabel}>目標達成率</Text>
            <Text style={styles.weeklyPercent}>{Math.round(weeklyProgress)}%</Text>
          </View>
          {renderProgressBar(weeklyProgress, chartWidth)}
          <Text style={styles.weeklyGoal}>
            目標: 週{weeklyGoal}時間の視聴
          </Text>
        </View>
      </View>

      {/* タスク完了率 */}
      <View style={styles.taskSection}>
        <Text style={styles.sectionTitle}>タスク完了率</Text>
        <View style={styles.taskCard}>
          <View style={styles.taskProgress}>
            {renderCircularProgress(completionRate, 80)}
            <View style={styles.taskStats}>
              <Text style={styles.taskCompleted}>{completedTasks} / {totalTasks}</Text>
              <Text style={styles.taskLabel}>完了済み</Text>
            </View>
          </View>
          
          {completionRate >= 80 ? (
            <Text style={styles.taskEncouragement}>
              🎉 素晴らしい完了率です！
            </Text>
          ) : completionRate >= 60 ? (
            <Text style={styles.taskEncouragement}>
              💪 良いペースで進んでいます！
            </Text>
          ) : (
            <Text style={styles.taskEncouragement}>
              🔥 もう少しです、頑張りましょう！
            </Text>
          )}
        </View>
      </View>

      {/* 成長への励まし */}
      <View style={styles.encouragementSection}>
        <Text style={styles.encouragementTitle}>🌱 成長のポイント</Text>
        <View style={styles.encouragementList}>
          <Text style={styles.encouragementItem}>
            • 毎日少しずつでも続けることが大切
          </Text>
          <Text style={styles.encouragementItem}>
            • メモから具体的なアクションを起こす
          </Text>
          <Text style={styles.encouragementItem}>
            • 過去の動画を振り返って新しい気づきを得る
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  
  // 全体統計
  statsOverview: {
    marginBottom: SPACING.LG,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },

  // 継続ストリーク
  streakSection: {
    marginBottom: SPACING.LG,
  },
  streakCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.WARNING,
    marginBottom: SPACING.XS,
  },
  streakLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  streakMessage: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },

  // 週次進捗
  weeklySection: {
    marginBottom: SPACING.LG,
  },
  weeklyCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  weeklyLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  weeklyPercent: {
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
    borderRadius: 4,
  },
  weeklyGoal: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },

  // タスク完了率
  taskSection: {
    marginBottom: SPACING.LG,
  },
  taskCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  circularProgress: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  circularProgressText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  taskStats: {
    alignItems: 'flex-start',
  },
  taskCompleted: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  taskLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  taskEncouragement: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },

  // 励まし
  encouragementSection: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  encouragementTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  encouragementList: {
    paddingLeft: SPACING.SM,
  },
  encouragementItem: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
    marginBottom: SPACING.XS,
  },
});
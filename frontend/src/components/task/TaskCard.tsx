import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onEdit,
  onDelete,
  onComplete,
  showActions = true,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDueDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `期限切れ (${Math.abs(diffDays)}日)`;
    } else if (diffDays === 0) {
      return '今日期限';
    } else if (diffDays === 1) {
      return '明日期限';
    } else {
      return `${diffDays}日後期限`;
    }
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'urgent':
        return COLORS.ERROR;
      case 'high':
        return COLORS.WARNING;
      case 'medium':
        return COLORS.PRIMARY;
      case 'low':
        return COLORS.TEXT_MUTED;
      default:
        return COLORS.TEXT_MUTED;
    }
  };

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'completed':
        return COLORS.SUCCESS;
      case 'in_progress':
        return COLORS.PRIMARY;
      case 'pending':
        return COLORS.WARNING;
      default:
        return COLORS.TEXT_MUTED;
    }
  };

  const getPriorityLabel = (priority: Task['priority']): string => {
    switch (priority) {
      case 'urgent':
        return '緊急';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '中';
    }
  };

  const getStatusLabel = (status: Task['status']): string => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'in_progress':
        return '進行中';
      case 'pending':
        return '未着手';
      default:
        return '未着手';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        task.status === 'completed' && styles.completedContainer,
        isOverdue && styles.overdueContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.badges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.badgeText}>
              {getPriorityLabel(task.priority)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.badgeText}>
              {getStatusLabel(task.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {formatDate(task.created_at)}
        </Text>
      </View>

      <Text style={[
        styles.title,
        task.status === 'completed' && styles.completedText
      ]}>
        {task.title}
      </Text>

      {task.description && (
        <Text style={[
          styles.description,
          task.status === 'completed' && styles.completedText
        ]} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      {task.due_date && (
        <View style={styles.dueDateContainer}>
          <Text style={[
            styles.dueDateText,
            isOverdue && styles.overdueText
          ]}>
            {formatDueDate(task.due_date)}
          </Text>
        </View>
      )}

      {showActions && (onEdit || onDelete || onComplete) && (
        <View style={styles.actions}>
          {onComplete && task.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={onComplete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.actionText, styles.completeText]}>完了</Text>
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionText}>編集</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.actionText, styles.deleteText]}>削除</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  completedContainer: {
    opacity: 0.7,
    backgroundColor: COLORS.GRAY_50,
  },
  overdueContainer: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ERROR,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  dateText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    lineHeight: 24,
    marginBottom: SPACING.SM,
  },
  description: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.TEXT_MUTED,
  },
  dueDateContainer: {
    marginBottom: SPACING.SM,
  },
  dueDateText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  overdueText: {
    color: COLORS.ERROR,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  actionButton: {
    marginLeft: SPACING.MD,
  },
  actionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  completeButton: {},
  completeText: {
    color: COLORS.SUCCESS,
  },
  deleteButton: {},
  deleteText: {
    color: COLORS.ERROR,
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { Memo } from '@/types';

interface MemoCardProps {
  memo: Memo;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onConvertToTask?: () => void;
  showActions?: boolean;
}

export const MemoCard: React.FC<MemoCardProps> = ({
  memo,
  onPress,
  onEdit,
  onDelete,
  onConvertToTask,
  showActions = true,
}) => {
  const formatTimestamp = (seconds?: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMemoTypeIcon = (type?: 'insight' | 'action' | 'question' | 'summary'): string => {
    switch (type) {
      case 'insight': return '💡';
      case 'action': return '🎯';
      case 'question': return '❓';
      case 'summary': return '📝';
      default: return '📝';
    }
  };

  const getImportanceStars = (importance?: 1 | 2 | 3 | 4 | 5): string => {
    if (!importance) return '';
    return '⭐'.repeat(importance);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.memoTypeIcon}>
            {getMemoTypeIcon(memo.memo_type)}
          </Text>
          {memo.timestamp_sec && (
            <View style={styles.timestampBadge}>
              <Text style={styles.timestampText}>
                {formatTimestamp(memo.timestamp_sec)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {memo.importance && (
            <Text style={styles.importanceText}>
              {getImportanceStars(memo.importance)}
            </Text>
          )}
          <Text style={styles.dateText}>
            {formatDate(memo.created_at)}
          </Text>
        </View>
      </View>

      <Text style={styles.content} numberOfLines={4}>
        {memo.content}
      </Text>

      {memo.tags && memo.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {memo.tags.slice(0, 3).map((tag) => (
            <View key={tag.id} style={styles.tag}>
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
          {memo.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{memo.tags.length - 3}</Text>
          )}
        </View>
      )}

      {showActions && (onEdit || onDelete || onConvertToTask) && (
        <View style={styles.actions}>
          {onConvertToTask && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onConvertToTask}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.convertTaskText}>タスク化</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  memoTypeIcon: {
    fontSize: 16,
    marginRight: SPACING.SM,
  },
  timestampBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  timestampText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  importanceText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    marginBottom: SPACING.XS,
  },
  dateText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
  },
  content: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: SPACING.SM,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  tag: {
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginRight: SPACING.XS,
    marginBottom: SPACING.XS,
  },
  tagText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  moreTagsText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
    marginLeft: SPACING.XS,
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
  deleteButton: {},
  deleteText: {
    color: COLORS.ERROR,
  },
  convertTaskText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.SUCCESS,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
});
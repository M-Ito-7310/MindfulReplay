import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TimestampText } from '@/components/common';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { Memo } from '@/types';

interface MemoDetailScreenProps {
  navigation?: any;
  route?: {
    params?: {
      memoId: string;
    };
  };
}

export const MemoDetailScreen: React.FC<MemoDetailScreenProps> = ({ navigation, route }) => {
  const [memo, setMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const memoId = route?.params?.memoId;

  useEffect(() => {
    if (memoId) {
      loadMemo();
    }
  }, [memoId]);

  const loadMemo = async () => {
    if (!memoId) return;

    setIsLoading(true);
    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.MEMOS}/${memoId}`);

      if (response.success && response.data) {
        // Check if the data has a memo property (backend response format)
        const memoData = response.data.memo || response.data;
        setMemo(memoData);
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        'メモの読み込みに失敗しました',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (navigation && memo) {
      navigation.navigate('MemoEdit', { memoId: memo.id });
    }
  };

  const handleTimestampPress = (seconds: number, videoId?: string) => {
    if (navigation && videoId) {
      navigation.navigate('VideoPlayer', { videoId, initialTime: seconds });
    }
  };

  const handleDelete = () => {
    if (!memo) return;

    Alert.alert(
      'メモを削除',
      'このメモを削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: deleteMemo,
        },
      ]
    );
  };

  const deleteMemo = async () => {
    if (!memo) return;

    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.MEMOS}/${memo.id}`;
      const response = await apiService.delete(endpoint);

      if (response.success) {
        Alert.alert(
          '成功',
          'メモを削除しました',
          [
            {
              text: 'OK',
              onPress: () => {
                if (navigation) {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('エラー', 'メモの削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete memo error:', error);
      Alert.alert('エラー', 'メモの削除に失敗しました');
    }
  };

  const formatTimestamp = (seconds?: number): string => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMemoTypeLabel = (type?: 'insight' | 'action' | 'question' | 'summary'): string => {
    switch (type) {
      case 'insight': return '💡 気づき・学び';
      case 'action': return '🎯 実践・行動';
      case 'question': return '❓ 疑問・質問';
      case 'summary': return '📝 要点・まとめ';
      default: return '📝 メモ';
    }
  };

  const getImportanceStars = (importance?: 1 | 2 | 3 | 4 | 5): string => {
    if (!importance) return '';
    return '⭐'.repeat(importance);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!memo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>メモが見つかりません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>メモ詳細</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Text style={styles.editButtonText}>編集</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>削除</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.memoCard}>
          {memo.video && (
            <View style={styles.videoInfo}>
              <View style={styles.videoIcon}>
                <Text style={styles.videoIconText}>📹</Text>
              </View>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {memo.video.title}
              </Text>
            </View>
          )}

          <View style={styles.memoHeader}>
            <View style={styles.memoHeaderLeft}>
              <Text style={styles.memoType}>
                {getMemoTypeLabel(memo.memo_type)}
              </Text>
              {memo.timestamp_sec && (
                <View style={styles.timestampBadge}>
                  <Text style={styles.timestampText}>
                    {formatTimestamp(memo.timestamp_sec)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.memoHeaderRight}>
              {memo.importance && (
                <Text style={styles.importanceText}>
                  {getImportanceStars(memo.importance)}
                </Text>
              )}
            </View>
          </View>

          <TimestampText
            content={memo.content}
            videoId={memo.video_id}
            onTimestampPress={handleTimestampPress}
            style={styles.memoContent}
          />

          {memo.tags && memo.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {memo.tags.map((tag) => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.memoFooter}>
            <Text style={styles.dateText}>
              作成日時: {formatDate(memo.created_at)}
            </Text>
            {memo.updated_at !== memo.created_at && (
              <Text style={styles.dateText}>
                更新日時: {formatDate(memo.updated_at)}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  editButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
  },
  editButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  deleteButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.ERROR,
    borderRadius: BORDER_RADIUS.SM,
  },
  deleteButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.MD,
  },
  memoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    ...SHADOWS.MEDIUM,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  memoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memoHeaderRight: {
    alignItems: 'flex-end',
  },
  memoType: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
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
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
  },
  memoContent: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 24,
    marginBottom: SPACING.MD,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.MD,
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
  memoFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    paddingTop: SPACING.SM,
  },
  dateText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
    marginBottom: SPACING.XS,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  errorText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.ERROR,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_50,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.MD,
  },
  videoIcon: {
    marginRight: SPACING.SM,
  },
  videoIconText: {
    fontSize: 16,
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    flex: 1,
  },
});
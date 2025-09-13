import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { MemoEditForm } from '@/components/memo';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { MemoForm, Memo } from '@/types';

interface MemoEditScreenProps {
  navigation?: any;
  route?: {
    params?: {
      memoId: string;
    };
  };
}

export const MemoEditScreen: React.FC<MemoEditScreenProps> = ({ navigation, route }) => {
  const [memo, setMemo] = useState<Memo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMemo, setIsLoadingMemo] = useState(true);

  const memoId = route?.params?.memoId;

  useEffect(() => {
    if (memoId) {
      loadMemo();
    }
  }, [memoId]);

  const loadMemo = async () => {
    if (!memoId) return;

    setIsLoadingMemo(true);
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
      setIsLoadingMemo(false);
    }
  };

  const handleSubmit = async (data: MemoForm) => {
    if (!memoId) return;

    setIsLoading(true);

    try {
      const response = await apiService.put(`${API_CONFIG.ENDPOINTS.MEMOS}/${memoId}`, {
        content: data.content,
        timestampSeconds: data.timestamp_sec,
      });

      if (response.success) {
        Alert.alert(
          '成功',
          'メモを更新しました',
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
      }
    } catch (error) {
      Alert.alert('エラー', 'メモの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  if (isLoadingMemo) {
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
        <Text style={styles.headerTitle}>メモを編集</Text>
      </View>

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

      <MemoEditForm
        memo={memo}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
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
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.SM,
    borderRadius: SPACING.SM,
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
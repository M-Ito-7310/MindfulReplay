import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MemoEditForm } from './MemoEditForm';
import { useLayoutTheme } from '@/contexts/LayoutThemeContext';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { Video, MemoForm, Memo } from '@/types';

type TimestampMode = 'auto' | 'manual' | 'none';

interface MemoCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onMemoCreated: (memo: Memo) => void;
  video: Video;
  timestamp?: number;
  timestampMode?: TimestampMode;
}

export const MemoCreateModal: React.FC<MemoCreateModalProps> = ({
  visible,
  onClose,
  onMemoCreated,
  video,
  timestamp,
  timestampMode = 'manual',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { getLayoutStyles } = useLayoutTheme();

  const handleSubmit = async (data: MemoForm) => {
    setIsLoading(true);

    try {
      const requestData = {
        content: data.content,
        videoId: video.id,
        timestampSeconds: data.timestamp_sec,
        memo_type: data.memo_type,
        importance: data.importance,
      };

      const response = await apiService.post(API_CONFIG.ENDPOINTS.MEMOS, requestData);

      if (response.success && response.data) {
        // Success feedback
        Alert.alert(
          '成功',
          'メモを保存しました',
          [
            {
              text: 'OK',
              onPress: () => {
                onMemoCreated(response.data);
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error('メモの保存に失敗しました');
      }
    } catch (error: any) {
      console.error('Error creating memo:', error);
      
      let errorMessage = 'メモの保存に失敗しました';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const layoutStyles = getLayoutStyles();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { padding: layoutStyles.layout.containerSpacing }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { 
          paddingTop: Platform.select({
            ios: layoutStyles.spacing.lg,
            android: 0,
            default: layoutStyles.spacing.lg,
          }),
          paddingHorizontal: layoutStyles.spacing.md,
          paddingBottom: layoutStyles.spacing.md,
        }]}>
          <View style={[styles.headerContent, { marginBottom: layoutStyles.spacing.sm }]}>
            <Text style={[styles.headerTitle, { 
              fontSize: layoutStyles.typography.fontSize.lg,
              fontWeight: layoutStyles.typography.fontWeight.SEMIBOLD,
            }]}>メモを追加</Text>
            <TouchableOpacity
              style={[styles.closeButton, {
                width: layoutStyles.layout.buttonHeight * 0.7,
                height: layoutStyles.layout.buttonHeight * 0.7,
                borderRadius: (layoutStyles.layout.buttonHeight * 0.7) / 2,
              }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { fontSize: layoutStyles.typography.fontSize.lg }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Video Info */}
          <View style={[styles.videoInfo, { paddingVertical: layoutStyles.spacing.sm }]}>
            <Text style={[styles.videoTitle, { 
              fontSize: layoutStyles.typography.fontSize.md,
              lineHeight: layoutStyles.typography.fontSize.md * layoutStyles.typography.lineHeight.normal,
              marginBottom: layoutStyles.spacing.xs,
            }]} numberOfLines={2}>
              {video.title || 'タイトル不明'}
            </Text>
          </View>

        </View>

        {/* Form Content */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MemoEditForm
            initialTimestamp={timestamp}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            showTimestamp={timestampMode !== 'none'}
            timestampMode={timestampMode}
            timestampLocked={timestampMode === 'auto'}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    paddingTop: Platform.select({
      ios: 20,
      android: 0,
      default: 20,
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: 'bold',
  },
  videoInfo: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
    backgroundColor: COLORS.GRAY_50,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
    lineHeight: 20,
  },
  timestampInfo: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    flex: 1,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button } from '@/components/common';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { Video, VideoSaveResponse } from '@/types';

interface AddVideoModalProps {
  visible: boolean;
  onClose: () => void;
  onVideoAdded: (video: Video) => void;
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
  visible,
  onClose,
  onVideoAdded,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    return patterns.some(pattern => pattern.test(url));
  };

  const handleSubmit = async () => {
    const trimmedUrl = youtubeUrl.trim();
    
    if (!trimmedUrl) {
      setError('YouTube URLを入力してください');
      return;
    }

    if (!validateYouTubeUrl(trimmedUrl)) {
      setError('有効なYouTube URLを入力してください');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await apiService.post<VideoSaveResponse>(API_CONFIG.ENDPOINTS.VIDEOS, {
        youtubeUrl: trimmedUrl,
      });

      if (response.success && response.data?.video) {
        onVideoAdded(response.data.video);
        handleClose();
        
        // Success message
        if (typeof window !== 'undefined') {
          window.alert('動画を保存しました！');
        } else {
          Alert.alert('成功', '動画を保存しました！');
        }
      } else {
        throw new Error('動画の保存に失敗しました');
      }
    } catch (error: any) {
      console.error('Error adding video:', error);
      
      let errorMessage = '動画の追加に失敗しました';
      
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setYoutubeUrl('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>YouTube動画を追加</Text>
          <Button
            title="キャンセル"
            onPress={handleClose}
            variant="ghost"
            style={styles.cancelButton}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>YouTube URL</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChangeText={(text) => {
                setYoutubeUrl(text);
                if (error) setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isLoading}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>対応するURL形式:</Text>
            <Text style={styles.helpText}>• https://www.youtube.com/watch?v=VIDEO_ID</Text>
            <Text style={styles.helpText}>• https://youtu.be/VIDEO_ID</Text>
            <Text style={styles.helpText}>• https://www.youtube.com/embed/VIDEO_ID</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? "保存中..." : "動画を保存"}
              onPress={handleSubmit}
              disabled={isLoading || !youtubeUrl.trim()}
              style={styles.submitButton}
            />
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={COLORS.PRIMARY}
                style={styles.loadingIndicator}
              />
            )}
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    backgroundColor: COLORS.WHITE,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  cancelButton: {
    minWidth: 80,
  },
  content: {
    flex: 1,
    padding: SPACING.LG,
  },
  inputContainer: {
    marginBottom: SPACING.XL,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    backgroundColor: COLORS.WHITE,
    color: COLORS.TEXT_PRIMARY,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
  },
  helpContainer: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.XL,
  },
  helpTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  helpText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  submitButton: {
    minWidth: 200,
  },
  loadingIndicator: {
    marginTop: SPACING.MD,
  },
});
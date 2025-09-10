import React, { useState } from 'react';
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
import { MemoForm } from '@/types';

interface MemoCreateScreenProps {
  navigation?: any;
  route?: {
    params?: {
      videoId?: string;
      timestamp?: number;
    };
  };
}

export const MemoCreateScreen: React.FC<MemoCreateScreenProps> = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(false);

  const videoId = route?.params?.videoId;
  const initialTimestamp = route?.params?.timestamp;

  const handleSubmit = async (data: MemoForm) => {
    setIsLoading(true);

    try {
      const requestData: any = {
        content: data.content,
      };

      // videoIdがある場合のみ追加
      if (videoId) {
        requestData.videoId = videoId;
        requestData.timestampSeconds = data.timestamp_sec;
      }

      const response = await apiService.post(API_CONFIG.ENDPOINTS.MEMOS, requestData);

      if (response.success) {
        Alert.alert(
          '成功',
          'メモを保存しました',
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
      Alert.alert('エラー', 'メモの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>新しいメモ</Text>
      </View>

      <MemoEditForm
        initialTimestamp={initialTimestamp}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        showTimestamp={!!videoId}
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
});
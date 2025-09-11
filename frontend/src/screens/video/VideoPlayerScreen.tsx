import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { VideoPlayer } from '@/components/video';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS } from '@/constants/theme';
import { Video, Memo } from '@/types';

interface VideoPlayerScreenProps {
  navigation?: any;
  route?: {
    params?: {
      videoId: string;
    };
  };
}

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({ navigation, route }) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isLoadingMemos, setIsLoadingMemos] = useState(true);
  const [isRefreshingMemos, setIsRefreshingMemos] = useState(false);

  const videoId = route?.params?.videoId;

  useEffect(() => {
    if (videoId) {
      loadVideo();
      loadMemos();
    }
  }, [videoId]);

  const loadVideo = async () => {
    if (!videoId) return;

    setIsLoadingVideo(true);
    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.VIDEOS}/${videoId}`);
      
      if (response.success && response.data) {
        setVideo(response.data);
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        '動画の読み込みに失敗しました',
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
      setIsLoadingVideo(false);
    }
  };

  const loadMemos = async (isRefresh = false) => {
    if (!videoId) return;

    if (isRefresh) {
      setIsRefreshingMemos(true);
    } else {
      setIsLoadingMemos(true);
    }

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.MEMOS, {
        params: {
          videoId,
          limit: 100, // Load all memos for this video
        },
      });
      
      if (response.success && response.data) {
        setMemos(response.data.items || []);
      }
    } catch (error) {
      if (!isRefresh) {
        Alert.alert('エラー', 'メモの読み込みに失敗しました');
      }
    } finally {
      setIsLoadingMemos(false);
      setIsRefreshingMemos(false);
    }
  };

  const handleRefreshMemos = () => {
    loadMemos(true);
  };

  const handleMemoPress = (memo: Memo) => {
    if (navigation) {
      navigation.navigate('MemoEdit', { memoId: memo.id });
    }
  };

  const handleMemoEdit = (memo: Memo) => {
    if (navigation) {
      navigation.navigate('MemoEdit', { memoId: memo.id });
    }
  };

  const handleMemoDelete = async (memo: Memo) => {
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
          onPress: () => deleteMemo(memo.id),
        },
      ]
    );
  };

  const deleteMemo = async (memoId: string) => {
    try {
      const response = await apiService.delete(`${API_CONFIG.ENDPOINTS.MEMOS}/${memoId}`);
      
      if (response.success) {
        setMemos(prev => prev.filter(memo => memo.id !== memoId));
        Alert.alert('成功', 'メモを削除しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'メモの削除に失敗しました');
    }
  };

  const handleAddMemo = (timestamp?: number) => {
    if (navigation && videoId) {
      navigation.navigate('MemoCreate', { 
        videoId,
        timestamp: timestamp 
      });
    }
  };

  const handleConvertToTask = (memo: Memo) => {
    if (navigation) {
      navigation.navigate('TaskCreate', { memoId: memo.id });
    }
  };

  // Note: In this custom navigation implementation, we don't need focus listeners
  // Memos will be refreshed when the component mounts

  if (isLoadingVideo) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          {/* You could add a loading spinner here */}
        </View>
      </SafeAreaView>
    );
  }

  if (!video) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          {/* You could add an error message here */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>動画視聴</Text>
        <View style={styles.headerSpacer} />
      </View>

      <VideoPlayer
        video={video}
        memos={memos}
        onMemoPress={handleMemoPress}
        onMemoEdit={handleMemoEdit}
        onMemoDelete={handleMemoDelete}
        onMemoConvertToTask={handleConvertToTask}
        onAddMemo={handleAddMemo}
        onRefreshMemos={handleRefreshMemos}
        isRefreshingMemos={isRefreshingMemos}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Same width as back button to center the title
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
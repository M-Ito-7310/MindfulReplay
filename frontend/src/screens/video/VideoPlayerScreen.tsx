import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { VideoPlayer } from '@/components/video';
import { MemoCreateModal } from '@/components/memo';
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
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoModalTimestamp, setMemoModalTimestamp] = useState<number | undefined>();
  const [memoModalMode, setMemoModalMode] = useState<'auto' | 'manual' | 'none'>('manual');
  const [wasPlayingBeforeMemo, setWasPlayingBeforeMemo] = useState(false);
  const [currentPlaybackState, setCurrentPlaybackState] = useState<'playing' | 'paused' | 'ended'>('paused');

  const handlePlaybackStateChange = (state: 'playing' | 'paused' | 'ended') => {
    setCurrentPlaybackState(state);
  };
  const videoPlayerRef = useRef<any>(null);
  const isLandscape = dimensions.width > dimensions.height;

  const videoId = route?.params?.videoId;

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions(Dimensions.get('window'));
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (videoId) {
      loadVideo();
      loadMemos();
    }
  }, [videoId]);

  const loadVideo = async () => {
    if (!videoId) return;

    // Simplified logging
    if (__DEV__) {
      console.log('[VideoPlayerScreen] Loading:', videoId);
    }

    setIsLoadingVideo(true);
    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.VIDEOS}/${videoId}`);
      
      if (response.success && response.data) {
        const videoData = response.data.video || response.data;
        if (__DEV__) {
          console.log('[VideoPlayerScreen] Loaded:', videoData.title?.substring(0, 30) + '...');
        }
        setVideo(videoData);
      } else {
        if (__DEV__) {
          console.warn('[VideoPlayerScreen] Load failed');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[VideoPlayerScreen] Load error:', error.message || error);
      }
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

  const handleAddMemo = (timestamp?: number, mode: 'auto' | 'manual' | 'none' = 'manual') => {
    // Remember if video was playing before memo modal
    setWasPlayingBeforeMemo(currentPlaybackState === 'playing');
    setMemoModalTimestamp(timestamp);
    setMemoModalMode(mode);
    setShowMemoModal(true);
  };

  const handleMemoModalClose = () => {
    setShowMemoModal(false);
    setMemoModalTimestamp(undefined);
    setMemoModalMode('manual');
    
    // Resume playback if it was playing before memo modal
    if (wasPlayingBeforeMemo && videoPlayerRef.current) {
      setTimeout(() => {
        videoPlayerRef.current?.play();
      }, 100); // Small delay to ensure modal is fully closed
    }
    setWasPlayingBeforeMemo(false);
  };

  const handleMemoCreated = (newMemo: Memo) => {
    // Add the new memo to the list
    setMemos(prev => [newMemo, ...prev]);
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
    <SafeAreaView style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* Header with Back Button - Hide in landscape mode for better viewing */}
      {!isLandscape && (
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
      )}

      {/* Floating back button in landscape mode */}
      {isLandscape && (
        <TouchableOpacity 
          style={styles.floatingBackButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.floatingBackButtonText}>✕</Text>
        </TouchableOpacity>
      )}

      <VideoPlayer
        ref={videoPlayerRef}
        video={video}
        memos={memos}
        onMemoPress={handleMemoPress}
        onMemoEdit={handleMemoEdit}
        onMemoDelete={handleMemoDelete}
        onMemoConvertToTask={handleConvertToTask}
        onAddMemo={handleAddMemo}
        onRefreshMemos={handleRefreshMemos}
        isRefreshingMemos={isRefreshingMemos}
        onPlaybackStateChange={handlePlaybackStateChange}
      />

      {/* Memo Creation Modal */}
      {video && (
        <MemoCreateModal
          visible={showMemoModal}
          onClose={handleMemoModalClose}
          onMemoCreated={handleMemoCreated}
          video={video}
          timestamp={memoModalTimestamp}
          timestampMode={memoModalMode}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  containerLandscape: {
    backgroundColor: COLORS.BLACK,
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
  floatingBackButton: {
    position: 'absolute',
    top: Platform.select({
      ios: 50,
      android: 30,
      default: 40
    }),
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingBackButtonText: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
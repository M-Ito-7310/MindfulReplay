import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
} from 'react-native';
import { MemoEditForm } from '@/components/memo';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { MemoForm, Video } from '@/types';

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
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<Video[]>([]);

  const videoId = route?.params?.videoId;
  const initialTimestamp = route?.params?.timestamp;

  useEffect(() => {
    if (videoId) {
      // 既に動画IDが指定されている場合（動画視聴画面から遷移）
      loadVideoById(videoId);
    } else {
      // 動画IDが未指定の場合は選択画面を表示
      loadAvailableVideos();
      setShowVideoSelector(true);
    }
  }, [videoId]);

  const loadVideoById = async (id: string) => {
    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.VIDEOS}/${id}`);
      if (response.success && response.data) {
        setSelectedVideo(response.data);
      }
    } catch (error) {
      console.error('Failed to load video:', error);
    }
  };


  const loadAvailableVideos = async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.VIDEOS);
      
      if (response.success && response.data) {
        // Handle both paginated and direct array response (same as VideoListScreen)
        const videoData = response.data.items || response.data;
        setAvailableVideos(videoData);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const handleSubmit = async (data: MemoForm) => {
    if (!selectedVideo) {
      Alert.alert('エラー', '動画を選択してください');
      return;
    }

    setIsLoading(true);

    try {
      const requestData: any = {
        content: data.content,
        videoId: selectedVideo.id,
        timestampSeconds: data.timestamp_sec,
        memo_type: data.memo_type,
        importance: data.importance,
      };

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

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoSelector(false);
  };

  const openVideoSelector = () => {
    setShowVideoSelector(true);
  };

  const handleCancel = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity style={styles.videoItem} onPress={() => handleVideoSelect(item)}>
      <View style={styles.videoItemThumbnail}>
        {item.thumbnail_url ? (
          <Image 
            source={{ uri: item.thumbnail_url }} 
            style={styles.videoItemThumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.thumbnailPlaceholder}>🎬</Text>
        )}
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoDescription} numberOfLines={5}>{item.description}</Text>
        <Text style={styles.videoDuration}>{formatDuration(item.duration || 0)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (showVideoSelector) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>動画を選択</Text>
          <Text style={styles.headerSubtitle}>メモを紐づける動画を選択してください</Text>
        </View>
        <FlatList
          data={availableVideos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          style={styles.videoList}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>新しいメモ</Text>
        {selectedVideo && (
          <View style={styles.selectedVideoCard}>
            <View style={styles.videoThumbnail}>
              {selectedVideo.thumbnail_url ? (
                <Image 
                  source={{ uri: selectedVideo.thumbnail_url }} 
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.thumbnailPlaceholder}>🎬</Text>
              )}
            </View>
            <View style={styles.selectedVideoInfo}>
              <Text style={styles.selectedVideoTitle} numberOfLines={2}>{selectedVideo.title || 'タイトルなし'}</Text>
              {!videoId && (
                <TouchableOpacity onPress={openVideoSelector}>
                  <Text style={styles.changeVideoText}>動画を変更する</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <MemoEditForm
        initialTimestamp={initialTimestamp}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        showTimestamp={true}
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
    marginBottom: SPACING.SM,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  videoList: {
    flex: 1,
    padding: SPACING.MD,
  },
  videoItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoItemThumbnail: {
    width: 80,
    height: 60,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  videoItemThumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.SM,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  videoDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  videoDuration: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  selectedVideoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginTop: SPACING.SM,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  videoThumbnail: {
    width: 60,
    height: 45,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.SM,
  },
  thumbnailPlaceholder: {
    fontSize: 24,
  },
  selectedVideoInfo: {
    flex: 1,
  },
  selectedVideoTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
    lineHeight: 20,
  },
  changeVideoText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    textDecorationLine: 'underline',
  },
});
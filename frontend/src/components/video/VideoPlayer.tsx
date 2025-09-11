import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { YouTubePlayer } from './YouTubePlayer';
import { MemoList } from '@/components/memo';
import { Button } from '@/components/common';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { Video, Memo } from '@/types';

interface VideoPlayerProps {
  video: Video;
  memos: Memo[];
  onMemoPress?: (memo: Memo) => void;
  onMemoEdit?: (memo: Memo) => void;
  onMemoDelete?: (memo: Memo) => void;
  onMemoConvertToTask?: (memo: Memo) => void;
  onAddMemo?: (timestamp?: number) => void;
  onRefreshMemos?: () => void;
  isRefreshingMemos?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  memos,
  onMemoPress,
  onMemoEdit,
  onMemoDelete,
  onMemoConvertToTask,
  onAddMemo,
  onRefreshMemos,
  isRefreshingMemos = false,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackState, setPlaybackState] = useState<'playing' | 'paused' | 'ended'>('paused');
  const [showMemos, setShowMemos] = useState(true);
  const playerRef = useRef<any>(null);

  const extractVideoId = (url?: string): string => {
    if (!url) return '';
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return url;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlaybackStateChange = (state: 'playing' | 'paused' | 'ended') => {
    setPlaybackState(state);
  };

  const handleAddMemoAtCurrentTime = () => {
    onAddMemo?.(Math.floor(currentTime));
  };

  const handleMemoJump = (memo: Memo) => {
    if (memo.timestamp_sec && playerRef.current) {
      playerRef.current.seekTo(memo.timestamp_sec);
    }
    onMemoPress?.(memo);
  };

  const getVideoId = () => {
    const videoId = extractVideoId(video?.youtube_url || video?.youtube_id);
    
    if (__DEV__) {
      console.log('[VideoPlayer] Video ID extraction:', {
        youtube_url: video?.youtube_url,
        youtube_id: video?.youtube_id,
        extracted_id: videoId,
        video_title: video?.title
      });
    }
    
    return videoId;
  };

  // Filter and sort memos by timestamp
  const timestampedMemos = memos
    .filter(memo => memo.timestamp_sec !== undefined && memo.timestamp_sec !== null)
    .sort((a, b) => (a.timestamp_sec || 0) - (b.timestamp_sec || 0));

  const generalMemos = memos
    .filter(memo => memo.timestamp_sec === undefined || memo.timestamp_sec === null);

  if (__DEV__) {
    console.log('[VideoPlayer] Rendering with video data:', {
      hasVideo: !!video,
      videoId: video?.id,
      title: video?.title,
      youtube_url: video?.youtube_url,
      youtube_id: video?.youtube_id,
      channel_name: video?.channel_name,
      description_length: video?.description?.length || 0,
      thumbnail_url: video?.thumbnail_url,
      memos_count: memos.length
    });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Video Player */}
      <View style={styles.playerContainer}>
        <YouTubePlayer
          ref={playerRef}
          videoId={getVideoId()}
          onTimeUpdate={handleTimeUpdate}
          onPlaybackStateChange={handlePlaybackStateChange}
          autoplay={false}
        />
      </View>

      {/* Video Info */}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{video?.title || 'タイトル不明'}</Text>
        {video?.channel_name && (
          <Text style={styles.channelName}>{video.channel_name}</Text>
        )}
        {video?.description && (
          <Text style={styles.description} numberOfLines={3}>
            {video.description}
          </Text>
        )}
      </View>

      {/* Current Time and Controls */}
      <View style={styles.controls}>
        <View style={styles.timeInfo}>
          <Text style={styles.currentTime}>
            現在の時刻: {formatTime(currentTime)}
          </Text>
          <Text style={styles.playbackState}>
            状態: {playbackState === 'playing' ? '再生中' : playbackState === 'paused' ? '一時停止' : '終了'}
          </Text>
        </View>
        <Button
          title="この時刻にメモ追加"
          onPress={handleAddMemoAtCurrentTime}
          size="small"
          variant="outline"
        />
      </View>

      {/* Memo Section Toggle */}
      <View style={styles.memoSection}>
        <TouchableOpacity
          style={styles.memoHeader}
          onPress={() => setShowMemos(!showMemos)}
        >
          <Text style={styles.memoHeaderTitle}>
            メモ ({memos.length})
          </Text>
          <Text style={styles.toggleIcon}>
            {showMemos ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showMemos && (
          <View style={styles.memoContent}>
            {/* Timestamped Memos */}
            {timestampedMemos.length > 0 && (
              <View style={styles.memoGroup}>
                <Text style={styles.memoGroupTitle}>
                  タイムスタンプ付きメモ ({timestampedMemos.length})
                </Text>
                {timestampedMemos.map((memo) => (
                  <TouchableOpacity
                    key={memo.id}
                    style={styles.timestampedMemo}
                    onPress={() => handleMemoJump(memo)}
                  >
                    <View style={styles.timestampBadge}>
                      <Text style={styles.timestampText}>
                        {formatTime(memo.timestamp_sec || 0)}
                      </Text>
                    </View>
                    <Text style={styles.memoText} numberOfLines={2}>
                      {memo.content}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* General Memos */}
            {generalMemos.length > 0 && (
              <View style={styles.memoGroup}>
                <Text style={styles.memoGroupTitle}>
                  一般メモ ({generalMemos.length})
                </Text>
                <MemoList
                  memos={generalMemos}
                  onMemoPress={onMemoPress}
                  onMemoEdit={onMemoEdit}
                  onMemoDelete={onMemoDelete}
                  onMemoConvertToTask={onMemoConvertToTask}
                  emptyTitle="一般メモがありません"
                  emptySubtitle=""
                  showActions={true}
                />
              </View>
            )}

            {memos.length === 0 && (
              <View style={styles.emptyMemos}>
                <Text style={styles.emptyMemosText}>
                  この動画にはまだメモがありません
                </Text>
                <Button
                  title="最初のメモを追加"
                  onPress={() => onAddMemo?.()}
                  style={styles.emptyMemosButton}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  playerContainer: {
    backgroundColor: COLORS.BLACK,
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },
  videoInfo: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  channelName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  description: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  timeInfo: {
    flex: 1,
  },
  currentTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  playbackState: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.TEXT_MUTED,
    marginTop: SPACING.XS,
  },
  memoSection: {
    backgroundColor: COLORS.WHITE,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  memoHeaderTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  toggleIcon: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  memoContent: {
    padding: SPACING.MD,
  },
  memoGroup: {
    marginBottom: SPACING.LG,
  },
  memoGroupTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
  },
  timestampedMemo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_50,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  timestampBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginRight: SPACING.SM,
  },
  timestampText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  memoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyMemos: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyMemosText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  emptyMemosButton: {
    minWidth: 150,
  },
});
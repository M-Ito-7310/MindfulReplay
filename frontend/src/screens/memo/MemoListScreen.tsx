import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { MemoList } from '@/components/memo';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { dialogService } from '@/services/dialog';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { Memo } from '@/types';

interface MemoListScreenProps {
  navigation?: any;
  route?: {
    params?: {
      videoId?: string;
    };
  };
}

export const MemoListScreen: React.FC<MemoListScreenProps> = ({ navigation, route }) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const videoId = route?.params?.videoId;

  useEffect(() => {
    loadMemos();
  }, [videoId]);

  const loadMemos = async (isRefresh = false, pageNum = 1) => {
    if (isRefresh) {
      setIsRefreshing(true);
      setPage(1);
    } else if (pageNum === 1) {
      setIsLoading(true);
    }

    try {
      const params: any = {
        page: pageNum,
        limit: 20,
      };

      if (videoId) {
        params.videoId = videoId;
      }

      const response = await apiService.get(API_CONFIG.ENDPOINTS.MEMOS, { params });

      if (response.success && response.data) {
        const newMemos = response.data.items || [];

        if (isRefresh || pageNum === 1) {
          setMemos(newMemos);
        } else {
          setMemos(prev => [...prev, ...newMemos]);
        }

        setHasMore(response.data.pagination?.hasNext || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Load memos error:', error);
      await dialogService.showError('メモの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadMemos(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadMemos(false, page + 1);
    }
  };

  const handleMemoPress = (memo: Memo) => {
    if (navigation) {
      navigation.navigate('MemoDetail', { memoId: memo.id });
    }
  };

  const handleMemoEdit = (memo: Memo) => {
    if (navigation) {
      navigation.navigate('MemoEdit', { memoId: memo.id });
    }
  };

  const handleMemoDelete = async (memo: Memo) => {
    const confirmed = await dialogService.confirmDelete(memo.title || 'メモ', 'メモ');
    if (confirmed) {
      deleteMemo(memo.id);
    }
  };

  const deleteMemo = async (memoId: string) => {
    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.MEMOS}/${memoId}`;
      const response = await apiService.delete(endpoint);
      
      if (response.success) {
        setMemos(prev => prev.filter(memo => memo.id !== memoId));
        await dialogService.showSuccess('メモを削除しました');
      } else {
        await dialogService.showError('メモの削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete memo error:', error);
      await dialogService.showError('メモの削除に失敗しました');
    }
  };

  const handleAddMemo = () => {
    if (navigation) {
      const params = videoId ? { videoId } : {};
      navigation.navigate('MemoCreate', params);
    }
  };

  const handleConvertToTask = (memo: Memo) => {
    if (navigation) {
      navigation.navigate('TaskCreate', { memoId: memo.id });
    }
  };

  const handleTimestampPress = (seconds: number, videoId?: string) => {
    if (navigation && videoId) {
      navigation.navigate('VideoPlayer', { videoId, initialTime: seconds });
    }
  };

  const getTitle = () => {
    return videoId ? '動画のメモ' : 'すべてのメモ';
  };

  const getEmptyTitle = () => {
    return videoId ? 'この動画のメモがありません' : 'メモがありません';
  };

  const getEmptySubtitle = () => {
    return videoId 
      ? 'この動画に関するメモを追加して学習内容を記録しましょう'
      : 'メモを追加して学習内容を記録しましょう';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <TouchableOpacity onPress={handleAddMemo}>
          <Text style={styles.addButton}>＋</Text>
        </TouchableOpacity>
      </View>

      <MemoList
        memos={memos}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onMemoPress={handleMemoPress}
        onMemoEdit={handleMemoEdit}
        onMemoDelete={handleMemoDelete}
        onMemoConvertToTask={handleConvertToTask}
        onTimestampPress={handleTimestampPress}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        emptyTitle={getEmptyTitle()}
        emptySubtitle={getEmptySubtitle()}
        onAddMemo={handleAddMemo}
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
  addButton: {
    fontSize: 28,
    color: COLORS.PRIMARY,
  },
});
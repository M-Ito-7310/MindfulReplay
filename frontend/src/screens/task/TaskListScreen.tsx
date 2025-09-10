import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TaskList } from '@/components/task';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { Task } from '@/types';

interface TaskListScreenProps {
  navigation?: any;
  route?: {
    params?: {
      memoId?: string;
      status?: Task['status'];
      priority?: Task['priority'];
    };
  };
}

export const TaskListScreen: React.FC<TaskListScreenProps> = ({ navigation, route }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  const { memoId, status: filterStatus, priority: filterPriority } = route?.params || {};

  useEffect(() => {
    loadTasks();
  }, [memoId, filterStatus, filterPriority]);

  const loadTasks = async (isRefresh = false, pageNum = 1) => {
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

      if (memoId) {
        // If we have a memoId, fetch tasks for that specific memo
        const response = await apiService.get(`${API_CONFIG.ENDPOINTS.MEMOS}/${memoId}/tasks`);
        
        if (response.success && response.data) {
          const newTasks = response.data || [];
          
          if (isRefresh || pageNum === 1) {
            setTasks(newTasks);
          } else {
            setTasks(prev => [...prev, ...newTasks]);
          }
          setHasMore(false); // Memo tasks are usually limited
        }
      } else {
        // Fetch all user tasks with filters
        if (filterStatus) params.status = filterStatus;
        if (filterPriority) params.priority = filterPriority;

        const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS, { params });
        
        if (response.success && response.data) {
          const newTasks = response.data.items || [];
          
          if (isRefresh || pageNum === 1) {
            setTasks(newTasks);
          } else {
            setTasks(prev => [...prev, ...newTasks]);
          }

          setHasMore(response.data.pagination?.hasNext || false);
          setPage(pageNum);
        }
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        'タスクの読み込みに失敗しました'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadTasks(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore && !memoId) {
      loadTasks(false, page + 1);
    }
  };

  const handleTaskPress = (task: Task) => {
    if (navigation) {
      navigation.navigate('TaskEdit', { taskId: task.id });
    }
  };

  const handleTaskEdit = (task: Task) => {
    if (navigation) {
      navigation.navigate('TaskEdit', { taskId: task.id });
    }
  };

  const handleTaskComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const response = await apiService.put(`${API_CONFIG.ENDPOINTS.TASK_DETAIL(task.id)}`, {
        status: newStatus
      });
      
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === task.id 
            ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined }
            : t
        ));
      }
    } catch (error) {
      Alert.alert('エラー', 'タスクの更新に失敗しました');
    }
  };

  const handleTaskDelete = async (task: Task) => {
    Alert.alert(
      'タスクを削除',
      'このタスクを削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteTask(task.id),
        },
      ]
    );
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await apiService.delete(API_CONFIG.ENDPOINTS.TASK_DETAIL(taskId));
      
      if (response.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        Alert.alert('成功', 'タスクを削除しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'タスクの削除に失敗しました');
    }
  };

  const handleAddTask = () => {
    if (navigation) {
      const params = memoId ? { memoId } : {};
      navigation.navigate('TaskCreate', params);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grouped' : 'list');
  };

  const getTitle = () => {
    if (memoId) return 'メモのタスク';
    if (filterStatus) {
      const statusLabels = {
        pending: '未着手のタスク',
        in_progress: '進行中のタスク',
        completed: '完了したタスク',
        cancelled: 'キャンセルしたタスク'
      };
      return statusLabels[filterStatus];
    }
    if (filterPriority) {
      const priorityLabels = {
        low: '低優先度タスク',
        medium: '中優先度タスク',
        high: '高優先度タスク',
        urgent: '緊急タスク'
      };
      return priorityLabels[filterPriority];
    }
    return 'すべてのタスク';
  };

  const getEmptyTitle = () => {
    if (memoId) return 'このメモのタスクがありません';
    if (filterStatus || filterPriority) return '条件に一致するタスクがありません';
    return 'タスクがありません';
  };

  const getEmptySubtitle = () => {
    if (memoId) return 'このメモからタスクを作成して目標を管理しましょう';
    return 'タスクを追加して学習目標を管理しましょう';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={styles.headerActions}>
          {!memoId && (
            <TouchableOpacity onPress={toggleViewMode} style={styles.viewModeButton}>
              <Text style={styles.viewModeText}>
                {viewMode === 'list' ? 'グループ' : 'リスト'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleAddTask}>
            <Text style={styles.addButton}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onTaskPress={handleTaskPress}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        onTaskComplete={handleTaskComplete}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        emptyTitle={getEmptyTitle()}
        emptySubtitle={getEmptySubtitle()}
        onAddTask={handleAddTask}
        groupByStatus={viewMode === 'grouped' && !memoId}
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
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    marginRight: SPACING.SM,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 6,
  },
  viewModeText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  addButton: {
    fontSize: 28,
    color: COLORS.PRIMARY,
  },
});
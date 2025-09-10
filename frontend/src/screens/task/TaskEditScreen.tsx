import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { TaskEditForm } from '@/components/task';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { TaskForm, Task } from '@/types';

interface TaskEditScreenProps {
  navigation?: any;
  route?: {
    params?: {
      taskId: string;
    };
  };
}

export const TaskEditScreen: React.FC<TaskEditScreenProps> = ({ navigation, route }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTask, setIsLoadingTask] = useState(true);

  const taskId = route?.params?.taskId;

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId) return;

    setIsLoadingTask(true);
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.TASK_DETAIL(taskId));
      
      if (response.success && response.data) {
        setTask(response.data);
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        'タスクの読み込みに失敗しました',
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
      setIsLoadingTask(false);
    }
  };

  const handleSubmit = async (data: TaskForm) => {
    if (!taskId) return;

    setIsLoading(true);

    try {
      const response = await apiService.put(API_CONFIG.ENDPOINTS.TASK_DETAIL(taskId), {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.due_date,
      });

      if (response.success) {
        Alert.alert(
          '成功',
          'タスクを更新しました',
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
      Alert.alert('エラー', 'タスクの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  if (isLoadingTask) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>タスクが見つかりません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>タスクを編集</Text>
      </View>

      <TaskEditForm
        task={task}
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
});
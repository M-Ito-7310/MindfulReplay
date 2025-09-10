import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { TaskEditForm } from '@/components/task';
import { taskService } from '@/services/task';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { TaskForm, Memo, CreateTaskData } from '@/types';

interface TaskCreateScreenProps {
  navigation?: any;
  route?: {
    params?: {
      memoId?: string;
    };
  };
}

export const TaskCreateScreen: React.FC<TaskCreateScreenProps> = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loadingMemo, setLoadingMemo] = useState(false);

  const memoId = route?.params?.memoId;

  useEffect(() => {
    if (memoId) {
      loadMemoDetails();
    }
  }, [memoId]);

  const loadMemoDetails = async () => {
    setLoadingMemo(true);
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.MEMO_DETAIL(memoId!));
      if (response.success && response.data) {
        setMemo(response.data);
      }
    } catch (error) {
      Alert.alert('エラー', 'メモの詳細を取得できませんでした');
    } finally {
      setLoadingMemo(false);
    }
  };

  const handleSubmit = async (data: TaskForm) => {
    setIsLoading(true);

    try {
      const createData: CreateTaskData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.due_date,
        memoId: memoId,
      };

      let task;
      
      if (memoId) {
        // Create task from memo
        task = await taskService.createTaskFromMemo(memoId, createData);
      } else {
        // Create standalone task
        task = await taskService.createTask(createData);
      }

      Alert.alert(
        '成功',
        'タスクを作成しました',
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
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('エラー', 'タスクの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const getHeaderTitle = () => {
    if (memoId) {
      return 'メモからタスクを作成';
    }
    return '新しいタスク';
  };

  if (loadingMemo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>

      <TaskEditForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        showMemoConnection={!!memoId}
        memoContent={memo?.content}
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
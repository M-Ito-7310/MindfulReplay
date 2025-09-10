import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button, Input } from '@/components/common';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { TaskForm, Task } from '@/types';

interface TaskEditFormProps {
  task?: Task;
  onSubmit: (data: TaskForm) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showMemoConnection?: boolean;
  memoContent?: string;
}

const PRIORITY_OPTIONS: Array<{ value: Task['priority']; label: string; color: string }> = [
  { value: 'low', label: '低', color: COLORS.TEXT_MUTED },
  { value: 'medium', label: '中', color: COLORS.PRIMARY },
  { value: 'high', label: '高', color: COLORS.WARNING },
  { value: 'urgent', label: '緊急', color: COLORS.ERROR },
];

export const TaskEditForm: React.FC<TaskEditFormProps> = ({
  task,
  onSubmit,
  onCancel,
  isLoading = false,
  showMemoConnection = false,
  memoContent,
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');

  useEffect(() => {
    // If we have memo content and no title, suggest a title from memo content
    if (memoContent && !task && !title) {
      const suggestedTitle = memoContent.substring(0, 50).trim();
      setTitle(suggestedTitle);
    }
    
    // If we have memo content and no description, use memo content as description
    if (memoContent && !task && !description) {
      setDescription(memoContent);
    }
  }, [memoContent, task, title, description]);

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const formatDateFromInput = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toISOString();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タスクのタイトルを入力してください');
      return;
    }

    try {
      const formData: TaskForm = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate ? formatDateFromInput(dueDate) : undefined,
      };

      await onSubmit(formData);
    } catch (error) {
      Alert.alert('エラー', 'タスクの保存に失敗しました');
    }
  };

  const handleDateChange = (text: string) => {
    // Basic date validation (YYYY-MM-DD)
    const dateRegex = /^\d{0,4}-?\d{0,2}-?\d{0,2}$/;
    if (dateRegex.test(text) || text === '') {
      setDueDate(text);
    }
  };

  const renderPrioritySelector = () => (
    <View style={styles.priorityContainer}>
      <Text style={styles.label}>優先度 *</Text>
      <View style={styles.priorityOptions}>
        {PRIORITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.priorityOption,
              priority === option.value && styles.priorityOptionActive,
              { borderColor: option.color },
              priority === option.value && { backgroundColor: option.color },
            ]}
            onPress={() => setPriority(option.value)}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.priorityOptionText,
                priority === option.value && styles.priorityOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {showMemoConnection && memoContent && (
          <View style={styles.memoConnection}>
            <Text style={styles.memoConnectionTitle}>メモから作成</Text>
            <Text style={styles.memoConnectionContent} numberOfLines={3}>
              {memoContent}
            </Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>タスクタイトル *</Text>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="タスクの名前を入力してください"
            editable={!isLoading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>詳細説明</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="タスクの詳細や目標を記録しましょう..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {renderPrioritySelector()}

        <View style={styles.field}>
          <Text style={styles.label}>期限日</Text>
          <Input
            value={formatDateForInput(dueDate)}
            onChangeText={handleDateChange}
            placeholder="YYYY-MM-DD (例: 2024-12-31)"
            keyboardType="numeric"
            editable={!isLoading}
          />
          <Text style={styles.hint}>
            期限日を設定すると、期限が近づいた時に通知されます
          </Text>
        </View>

        <View style={styles.actions}>
          {onCancel && (
            <Button
              title="キャンセル"
              onPress={onCancel}
              variant="outline"
              style={styles.actionButton}
              disabled={isLoading}
            />
          )}
          <Button
            title={task ? "更新" : "作成"}
            onPress={handleSubmit}
            style={[styles.actionButton, styles.submitButton]}
            loading={isLoading}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  form: {
    padding: SPACING.MD,
  },
  memoConnection: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  memoConnectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  memoConnectionContent: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  field: {
    marginBottom: SPACING.LG,
  },
  label: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  textArea: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 100,
  },
  priorityContainer: {
    marginBottom: SPACING.LG,
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.MD,
    marginHorizontal: SPACING.XS,
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  priorityOptionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },
  priorityOptionTextActive: {
    color: COLORS.WHITE,
  },
  hint: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    marginTop: SPACING.SM,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.XL,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  submitButton: {},
});
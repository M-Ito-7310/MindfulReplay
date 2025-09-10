import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/common';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onTaskPress?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onTaskComplete?: (task: Task) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onAddTask?: () => void;
  showActions?: boolean;
  groupByStatus?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onTaskPress,
  onTaskEdit,
  onTaskDelete,
  onTaskComplete,
  onLoadMore,
  hasMore = false,
  emptyTitle = 'タスクがありません',
  emptySubtitle = 'タスクを追加して学習目標を管理しましょう',
  onAddTask,
  showActions = true,
  groupByStatus = false,
}) => {
  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={onTaskPress ? () => onTaskPress(item) : undefined}
      onEdit={onTaskEdit ? () => onTaskEdit(item) : undefined}
      onDelete={onTaskDelete ? () => onTaskDelete(item) : undefined}
      onComplete={onTaskComplete ? () => onTaskComplete(item) : undefined}
      showActions={showActions}
    />
  );

  const renderSectionHeader = (status: Task['status']) => {
    const getStatusLabel = (status: Task['status']): string => {
      switch (status) {
        case 'pending':
          return '未着手';
        case 'in_progress':
          return '進行中';
        case 'completed':
          return '完了';
        case 'cancelled':
          return 'キャンセル';
        default:
          return '未着手';
      }
    };

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{getStatusLabel(status)}</Text>
      </View>
    );
  };

  const renderGroupedTasks = () => {
    const groupedTasks: { [key: string]: Task[] } = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };

    tasks.forEach(task => {
      groupedTasks[task.status].push(task);
    });

    const sections = Object.entries(groupedTasks)
      .filter(([_, tasks]) => tasks.length > 0)
      .map(([status, tasks]) => ({ status: status as Task['status'], tasks }));

    return (
      <View style={styles.groupedContainer}>
        {sections.map(({ status, tasks }) => (
          <View key={status}>
            {renderSectionHeader(status)}
            {tasks.map(task => (
              <View key={task.id}>
                {renderTaskItem({ item: task })}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
      {onAddTask && (
        <Button
          title="タスクを追加"
          onPress={onAddTask}
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        <Button
          title="さらに読み込む"
          onPress={onLoadMore}
          variant="outline"
          size="small"
          loading={isLoading}
        />
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>読み込み中...</Text>
    </View>
  );

  if (isLoading && tasks.length === 0) {
    return renderLoadingState();
  }

  if (groupByStatus) {
    return (
      <View style={styles.container}>
        {tasks.length === 0 ? renderEmptyState() : renderGroupedTasks()}
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={renderTaskItem}
      contentContainerStyle={[
        styles.listContent,
        tasks.length === 0 && styles.emptyListContent,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        ) : undefined
      }
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.1}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listContent: {
    padding: SPACING.MD,
  },
  emptyListContent: {
    flex: 1,
  },
  groupedContainer: {
    padding: SPACING.MD,
  },
  sectionHeader: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
    paddingBottom: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXXL,
    paddingHorizontal: SPACING.XL,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  emptyButton: {
    minWidth: 150,
  },
  footer: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
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
});
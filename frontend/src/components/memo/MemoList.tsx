import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MemoCard } from './MemoCard';
import { Button } from '@/components/common';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { Memo } from '@/types';

interface MemoListProps {
  memos: Memo[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onMemoPress?: (memo: Memo) => void;
  onMemoEdit?: (memo: Memo) => void;
  onMemoDelete?: (memo: Memo) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onAddMemo?: () => void;
  showActions?: boolean;
}

export const MemoList: React.FC<MemoListProps> = ({
  memos,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onMemoPress,
  onMemoEdit,
  onMemoDelete,
  onLoadMore,
  hasMore = false,
  emptyTitle = 'メモがありません',
  emptySubtitle = 'メモを追加して学習内容を記録しましょう',
  onAddMemo,
  showActions = true,
}) => {
  const renderMemoItem = ({ item }: { item: Memo }) => (
    <MemoCard
      memo={item}
      onPress={onMemoPress ? () => onMemoPress(item) : undefined}
      onEdit={onMemoEdit ? () => onMemoEdit(item) : undefined}
      onDelete={onMemoDelete ? () => onMemoDelete(item) : undefined}
      showActions={showActions}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
      {onAddMemo && (
        <Button
          title="メモを追加"
          onPress={onAddMemo}
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

  if (isLoading && memos.length === 0) {
    return renderLoadingState();
  }

  return (
    <FlatList
      data={memos}
      keyExtractor={(item) => item.id}
      renderItem={renderMemoItem}
      contentContainerStyle={[
        styles.listContent,
        memos.length === 0 && styles.emptyListContent,
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
  listContent: {
    padding: SPACING.MD,
  },
  emptyListContent: {
    flex: 1,
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
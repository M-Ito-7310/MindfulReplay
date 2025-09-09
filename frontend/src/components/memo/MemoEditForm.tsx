import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Input } from '@/components/common';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { MemoForm, Memo } from '@/types';

interface MemoEditFormProps {
  memo?: Memo;
  initialTimestamp?: number;
  onSubmit: (data: MemoForm) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showTimestamp?: boolean;
}

export const MemoEditForm: React.FC<MemoEditFormProps> = ({
  memo,
  initialTimestamp,
  onSubmit,
  onCancel,
  isLoading = false,
  showTimestamp = true,
}) => {
  const [content, setContent] = useState(memo?.content || '');
  const [timestampMinutes, setTimestampMinutes] = useState('');
  const [timestampSeconds, setTimestampSeconds] = useState('');

  useEffect(() => {
    const timestamp = memo?.timestamp_sec || initialTimestamp;
    if (timestamp) {
      const minutes = Math.floor(timestamp / 60);
      const seconds = timestamp % 60;
      setTimestampMinutes(minutes.toString());
      setTimestampSeconds(seconds.toString());
    }
  }, [memo, initialTimestamp]);

  const formatTimestamp = (minutes: string, seconds: string): number | undefined => {
    const min = parseInt(minutes) || 0;
    const sec = parseInt(seconds) || 0;
    if (min === 0 && sec === 0) return undefined;
    return min * 60 + sec;
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('エラー', 'メモの内容を入力してください');
      return;
    }

    try {
      const formData: MemoForm = {
        content: content.trim(),
        timestamp_sec: showTimestamp ? formatTimestamp(timestampMinutes, timestampSeconds) : undefined,
      };

      await onSubmit(formData);
    } catch (error) {
      Alert.alert('エラー', 'メモの保存に失敗しました');
    }
  };

  const handleTimestampMinutesChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setTimestampMinutes(numericText);
  };

  const handleTimestampSecondsChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const value = parseInt(numericText) || 0;
    if (value >= 60) {
      const extraMinutes = Math.floor(value / 60);
      const remainingSeconds = value % 60;
      const currentMinutes = parseInt(timestampMinutes) || 0;
      setTimestampMinutes((currentMinutes + extraMinutes).toString());
      setTimestampSeconds(remainingSeconds.toString());
    } else {
      setTimestampSeconds(numericText);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>メモ内容 *</Text>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="学習内容や気づきを記録しましょう..."
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {showTimestamp && (
          <View style={styles.field}>
            <Text style={styles.label}>動画のタイムスタンプ</Text>
            <View style={styles.timestampContainer}>
              <View style={styles.timestampField}>
                <Input
                  value={timestampMinutes}
                  onChangeText={handleTimestampMinutesChange}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.timestampInput}
                  editable={!isLoading}
                />
                <Text style={styles.timestampUnit}>分</Text>
              </View>
              <Text style={styles.timestampSeparator}>:</Text>
              <View style={styles.timestampField}>
                <Input
                  value={timestampSeconds}
                  onChangeText={handleTimestampSecondsChange}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.timestampInput}
                  editable={!isLoading}
                />
                <Text style={styles.timestampUnit}>秒</Text>
              </View>
            </View>
            <Text style={styles.hint}>
              動画の特定の時間に関連するメモの場合は、タイムスタンプを設定してください
            </Text>
          </View>
        )}

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
            title={memo ? "更新" : "保存"}
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
    minHeight: 120,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  timestampField: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timestampInput: {
    flex: 1,
    textAlign: 'center',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  timestampUnit: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  timestampSeparator: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_SECONDARY,
    marginHorizontal: SPACING.SM,
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
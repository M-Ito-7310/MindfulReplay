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
  const [memoType, setMemoType] = useState<'insight' | 'action' | 'question' | 'summary'>(memo?.memo_type || 'insight');
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5>(memo?.importance || 3);

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
        memo_type: memoType,
        importance: importance,
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

  const getTemplateContent = (type: 'insight' | 'action' | 'question' | 'summary'): string => {
    switch (type) {
      case 'insight':
        return '【気づいたこと】\n\n【なるほどと思ったポイント】\n\n【なぜ印象に残ったか】\n\n';
      case 'action':
        return '【やってみたいこと】\n\n【いつやるか】\n\n【必要なもの】\n\n';
      case 'question':
        return '【疑問に思ったこと】\n\n【なぜ気になったか】\n\n【どう解決するか】\n\n';
      case 'summary':
        return '【要点まとめ】\n\n【参考になったポイント】\n\n【活用できそうなこと】\n\n';
      default:
        return '';
    }
  };

  const applyTemplate = (type: 'insight' | 'action' | 'question' | 'summary') => {
    const templateContent = getTemplateContent(type);
    setContent(templateContent);
    setMemoType(type);
  };

  const getMemoTypeLabel = (type: 'insight' | 'action' | 'question' | 'summary'): string => {
    switch (type) {
      case 'insight': return '💡 気づき・学び';
      case 'action': return '🎯 実践・行動';
      case 'question': return '❓ 疑問・質問';
      case 'summary': return '📝 要点・まとめ';
    }
  };

  const getImportanceLabel = (level: number): string => {
    const labels = ['', '⭐ 低', '⭐⭐ やや重要', '⭐⭐⭐ 重要', '⭐⭐⭐⭐ とても重要', '⭐⭐⭐⭐⭐ 最重要'];
    return labels[level] || '';
  };

  const suggestTaskFromMemo = (): string => {
    if (!content.trim()) return '';
    
    const contentLower = content.toLowerCase();
    
    // アクション系キーワードでタスクを提案
    if (contentLower.includes('実践') || contentLower.includes('やってみる') || contentLower.includes('試す')) {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'を実践する';
    }
    
    if (contentLower.includes('調べる') || contentLower.includes('リサーチ') || contentLower.includes('確認')) {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'について詳しく調べる';
    }
    
    if (contentLower.includes('学習') || contentLower.includes('勉強') || contentLower.includes('習得')) {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'を深く学習する';
    }
    
    if (memoType === 'action') {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() || '実践タスクを作成';
    }
    
    if (memoType === 'question') {
      return content.split('\n')[0].replace(/【.*?】/, '').trim() + 'の答えを見つける';
    }
    
    // デフォルト提案
    return content.split('\n')[0].replace(/【.*?】/, '').substring(0, 50).trim() + 'について行動する';
  };

  const handleSuggestTask = () => {
    const suggestion = suggestTaskFromMemo();
    if (suggestion) {
      Alert.alert(
        'タスク作成提案',
        `「${suggestion}」\n\nこのタスクを作成しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '作成する', 
            onPress: () => {
              // ここで実際のタスク作成画面に遷移するか、
              // 親コンポーネントにコールバックを送る
              Alert.alert('タスク作成', 'タスク作成機能は準備中です');
            }
          }
        ]
      );
    } else {
      Alert.alert('提案なし', 'メモの内容からタスクを提案できませんでした。');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* テンプレート選択 */}
        <View style={styles.field}>
          <Text style={styles.label}>メモの種類</Text>
          <View style={styles.templateRow}>
            {(['insight', 'action', 'question', 'summary'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.templateButton,
                  memoType === type && styles.templateButtonActive,
                ]}
                onPress={() => applyTemplate(type)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.templateButtonText,
                  memoType === type && styles.templateButtonTextActive,
                ]}>
                  {getMemoTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 重要度選択 */}
        <View style={styles.field}>
          <Text style={styles.label}>重要度</Text>
          <View style={styles.importanceRow}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.importanceButton,
                  importance === level && styles.importanceButtonActive,
                ]}
                onPress={() => setImportance(level as 1 | 2 | 3 | 4 | 5)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.importanceButtonText,
                  importance === level && styles.importanceButtonTextActive,
                ]}>
                  {getImportanceLabel(level)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>メモ内容 *</Text>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="視聴中の気づきやメモを記録しましょう..."
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

        {/* タスク提案機能 */}
        {content.trim() && memoType === 'action' && (
          <View style={styles.field}>
            <Button
              title="💡 このメモからタスクを提案"
              onPress={handleSuggestTask}
              variant="outline"
              disabled={isLoading}
            />
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
            style={styles.submitButton}
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
  templateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  templateButton: {
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
  },
  templateButtonActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  templateButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  templateButtonTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  importanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  importanceButton: {
    flex: 1,
    backgroundColor: COLORS.GRAY_100,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    marginHorizontal: SPACING.XS,
    alignItems: 'center',
  },
  importanceButtonActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  importanceButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  importanceButtonTextActive: {
    color: COLORS.SUCCESS,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
});
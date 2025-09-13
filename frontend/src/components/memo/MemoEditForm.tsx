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
import { useLayoutTheme } from '@/contexts/LayoutThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { MemoForm, Memo } from '@/types';


interface MemoEditFormProps {
  memo?: Memo;
  initialTimestamp?: number;
  onSubmit: (data: MemoForm) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const MemoEditForm: React.FC<MemoEditFormProps> = ({
  memo,
  initialTimestamp,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [content, setContent] = useState(memo?.content || '');
  const [memoType, setMemoType] = useState<'insight' | 'action' | 'question' | 'summary' | undefined>(memo?.memo_type || undefined);
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5>(memo?.importance || 3);
  const [showImportanceOptions, setShowImportanceOptions] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const { getLayoutStyles } = useLayoutTheme();

  // Prepare final content with timestamp if needed
  const getFinalContent = (): string => {
    if (includeTimestamp && initialTimestamp !== undefined) {
      const timeText = formatTime(initialTimestamp) + ' ';
      // Insert timestamp at the beginning of first line if not already present
      if (!content.startsWith(timeText)) {
        return timeText + content;
      }
    }
    return content;
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('エラー', 'メモの内容を入力してください');
      return;
    }


    try {
      const formData: MemoForm = {
        content: getFinalContent().trim(),
        timestamp_sec: undefined, // タイムスタンプはテキストとして管理
        memo_type: memoType || 'insight', // デフォルトでinsightを送信
        importance: importance,
      };

      await onSubmit(formData);
    } catch (error) {
      Alert.alert('エラー', 'メモの保存に失敗しました');
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

  const layoutStyles = getLayoutStyles();


  return (
    <ScrollView style={[styles.container]} showsVerticalScrollIndicator={false}>
      <View style={[styles.form, { padding: layoutStyles.layout.formPadding }]}>
        {/* テンプレート選択 */}
        <View style={[styles.field, { marginBottom: layoutStyles.layout.fieldSpacing }]}>
            <Text style={[styles.label, { 
              fontSize: layoutStyles.typography.fontSize.md,
              marginBottom: layoutStyles.layout.labelSpacing,
              fontWeight: layoutStyles.typography.fontWeight.MEDIUM,
            }]}>メモのフォーマット</Text>
            <TouchableOpacity
              style={[styles.formatDropdown, {
                minHeight: layoutStyles.layout.buttonHeight * 1.2,
                paddingHorizontal: layoutStyles.spacing.sm,
                paddingVertical: layoutStyles.spacing.sm,
                borderRadius: layoutStyles.layout.inputBorderRadius,
              }]}
              onPress={() => {
                setShowFormatOptions(!showFormatOptions);
                if (showImportanceOptions) setShowImportanceOptions(false);
              }}
              disabled={isLoading}
            >
              <Text style={[styles.formatDropdownText, { 
                fontSize: layoutStyles.typography.fontSize.sm,
                lineHeight: layoutStyles.typography.fontSize.sm * 1.3,
                flex: 1,
                flexWrap: 'wrap',
              }]} numberOfLines={2}>
                {memoType ? getMemoTypeLabel(memoType) : 'テンプレートなし'}
              </Text>
              <Text style={[styles.dropdownArrow, { fontSize: layoutStyles.typography.fontSize.sm }]}>
                {showFormatOptions ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {showFormatOptions && (
              <View style={[styles.formatOptions, { 
                borderRadius: layoutStyles.layout.inputBorderRadius,
                marginTop: layoutStyles.spacing.xs,
              }]}>
                {(['insight', 'action', 'question', 'summary'] as const).map((type, index) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.formatOption,
                      {
                        padding: layoutStyles.spacing.md,
                      },
                      memoType === type && styles.formatOptionActive,
                      index === 3 && styles.formatOptionLast, // 最後の要素
                    ]}
                    onPress={() => {
                      applyTemplate(type);
                      setShowFormatOptions(false);
                    }}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.formatOptionText,
                      { 
                        fontSize: layoutStyles.typography.fontSize.sm,
                        lineHeight: layoutStyles.typography.fontSize.sm * 1.3,
                      },
                      memoType === type && styles.formatOptionTextActive,
                    ]}>
                      {getMemoTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 重要度選択 */}
          <View style={[styles.field, { marginBottom: layoutStyles.layout.fieldSpacing }]}>
            <Text style={[styles.label, { 
              fontSize: layoutStyles.typography.fontSize.md,
              marginBottom: layoutStyles.layout.labelSpacing,
              fontWeight: layoutStyles.typography.fontWeight.MEDIUM,
            }]}>重要度</Text>
            <TouchableOpacity
              style={[styles.importanceDropdown, {
                minHeight: layoutStyles.layout.buttonHeight * 1.2,
                paddingHorizontal: layoutStyles.spacing.sm,
                paddingVertical: layoutStyles.spacing.sm,
                borderRadius: layoutStyles.layout.inputBorderRadius,
              }]}
              onPress={() => {
                setShowImportanceOptions(!showImportanceOptions);
                if (showFormatOptions) setShowFormatOptions(false);
              }}
              disabled={isLoading}
            >
              <Text style={[styles.importanceDropdownText, { 
                fontSize: layoutStyles.typography.fontSize.sm,
                lineHeight: layoutStyles.typography.fontSize.sm * 1.3,
                flex: 1,
                flexWrap: 'wrap',
              }]} numberOfLines={2}>
                {getImportanceLabel(importance)}
              </Text>
              <Text style={[styles.dropdownArrow, { fontSize: layoutStyles.typography.fontSize.sm }]}>
                {showImportanceOptions ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {showImportanceOptions && (
              <View style={[styles.importanceOptions, { 
                borderRadius: layoutStyles.layout.inputBorderRadius,
                marginTop: layoutStyles.spacing.xs,
              }]}>
                {[1, 2, 3, 4, 5].map((level, index) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.importanceOption,
                      {
                        padding: layoutStyles.spacing.md,
                      },
                      importance === level && styles.importanceOptionActive,
                      index === 4 && styles.importanceOptionLast, // 最後の要素
                    ]}
                    onPress={() => {
                      setImportance(level as 1 | 2 | 3 | 4 | 5);
                      setShowImportanceOptions(false);
                    }}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.importanceOptionText,
                      { 
                        fontSize: layoutStyles.typography.fontSize.sm,
                        lineHeight: layoutStyles.typography.fontSize.sm * 1.3,
                      },
                      importance === level && styles.importanceOptionTextActive,
                    ]}>
                      {getImportanceLabel(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={[styles.field, { marginBottom: layoutStyles.layout.fieldSpacing }]}>
            <Text style={[styles.label, { 
              fontSize: layoutStyles.typography.fontSize.md,
              marginBottom: layoutStyles.layout.labelSpacing,
              fontWeight: layoutStyles.typography.fontWeight.MEDIUM,
            }]}>メモ内容 *</Text>
            <TextInput
              style={[styles.textArea, {
                padding: layoutStyles.layout.inputPadding,
                borderRadius: layoutStyles.layout.inputBorderRadius,
                fontSize: layoutStyles.typography.fontSize.md,
                minHeight: layoutStyles.typography.fontSize.md * layoutStyles.typography.lineHeight.normal * 8,
              }]}
              value={content}
              onChangeText={setContent}
              placeholder="視聴中の気づきやメモを記録しましょう..."
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!isLoading}
            />
            {initialTimestamp !== undefined && (
              <TouchableOpacity
                style={[styles.timestampCheckbox, {
                  marginTop: layoutStyles.spacing.sm,
                  paddingVertical: layoutStyles.spacing.sm,
                }]}
                onPress={() => setIncludeTimestamp(!includeTimestamp)}
                disabled={isLoading}
              >
                <View style={styles.checkboxRow}>
                  <View style={[styles.checkbox, {
                    borderColor: includeTimestamp ? COLORS.PRIMARY : COLORS.GRAY_300,
                    backgroundColor: includeTimestamp ? COLORS.PRIMARY : COLORS.WHITE,
                  }]}>
                    {includeTimestamp && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={[styles.checkboxLabel, {
                    fontSize: layoutStyles.typography.fontSize.sm,
                    color: includeTimestamp ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY,
                  }]}>
                    メモにタイムスタンプを追記する ({formatTime(initialTimestamp)})
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>


        {/* タスク提案機能 */}
        {content.trim() && memoType === 'action' && (
            <View style={[styles.field, { marginBottom: layoutStyles.layout.fieldSpacing }]}>
              <Button
                title="💡 このメモからタスクを提案"
                onPress={handleSuggestTask}
                variant="outline"
                disabled={isLoading}
                style={{
                  minHeight: layoutStyles.layout.buttonHeight * 1.2,
                  paddingVertical: layoutStyles.spacing.sm,
                  borderRadius: layoutStyles.layout.buttonBorderRadius,
                }}
              />
            </View>
        )}

        <View style={[styles.actions, {
          marginTop: layoutStyles.spacing.xl,
          gap: layoutStyles.layout.buttonSpacing,
        }]}>
          <Button
            title={memo ? "更新" : "保存"}
            onPress={handleSubmit}
            style={[styles.actionButton, {
              minHeight: layoutStyles.layout.buttonHeight * 1.3,
              paddingVertical: layoutStyles.spacing.sm,
              borderRadius: layoutStyles.layout.buttonBorderRadius,
            }]}
            loading={isLoading}
          />
          {onCancel && (
            <Button
              title="キャンセル"
              onPress={onCancel}
              variant="outline"
              style={[styles.actionButton, {
                minHeight: layoutStyles.layout.buttonHeight * 1.3,
                paddingVertical: layoutStyles.spacing.sm,
                borderRadius: layoutStyles.layout.buttonBorderRadius,
              }]}
              disabled={isLoading}
            />
          )}
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
  // Timestamp header and controls
  timestampHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  timestampToggle: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  timestampToggleText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  timestampToggleTextDisabled: {
    color: COLORS.WHITE,
  },
  // Compact toggle styles
  timestampToggleCompact: {
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    backgroundColor: COLORS.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  timestampToggleTextCompact: {
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  // Auto mode read-only display
  timestampCheckbox: {
    alignSelf: 'flex-start',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
  },
  checkboxLabel: {
    flex: 1,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  timestampAutoValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  // Disabled state
  timestampDisabled: {
    backgroundColor: COLORS.GRAY_50,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
  },
  timestampDisabledText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_MUTED,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  // Compact disabled state
  timestampDisabledCompact: {
    backgroundColor: COLORS.GRAY_50,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 4,
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 180,
    maxWidth: 220,
  },
  enableTimestampButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
  },
  enableTimestampButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  // Compact button styles
  enableTimestampButtonCompact: {
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  enableTimestampButtonTextCompact: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
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
  // Format dropdown styles
  formatDropdown: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatDropdownText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  formatOptions: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.XS,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  formatOption: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  formatOptionActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  formatOptionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  formatOptionTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  formatOptionLast: {
    borderBottomWidth: 0, // 最後の要素の境界線を削除
  },
  // Importance dropdown styles
  importanceDropdown: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  importanceDropdownText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  importanceOptions: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.XS,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  importanceOption: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  importanceOptionActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  importanceOptionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  importanceOptionTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  importanceOptionLast: {
    borderBottomWidth: 0, // 最後の要素の境界線を削除
  },
});
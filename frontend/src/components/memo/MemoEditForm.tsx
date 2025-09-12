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

type TimestampMode = 'auto' | 'manual' | 'none';

interface MemoEditFormProps {
  memo?: Memo;
  initialTimestamp?: number;
  onSubmit: (data: MemoForm) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showTimestamp?: boolean;
  timestampMode?: TimestampMode;
  timestampLocked?: boolean;
}

export const MemoEditForm: React.FC<MemoEditFormProps> = ({
  memo,
  initialTimestamp,
  onSubmit,
  onCancel,
  isLoading = false,
  showTimestamp = true,
  timestampMode = 'manual',
  timestampLocked = false,
}) => {
  const [content, setContent] = useState(memo?.content || '');
  const [timestampMinutes, setTimestampMinutes] = useState('');
  const [timestampSeconds, setTimestampSeconds] = useState('');
  const [memoType, setMemoType] = useState<'insight' | 'action' | 'question' | 'summary' | undefined>(memo?.memo_type || undefined);
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5>(memo?.importance || 3);
  const [showImportanceOptions, setShowImportanceOptions] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [currentTimestampMode, setCurrentTimestampMode] = useState<TimestampMode>(timestampMode);
  const [timestampEnabled, setTimestampEnabled] = useState(
    timestampMode !== 'none' && (memo?.timestamp_sec !== undefined || initialTimestamp !== undefined)
  );
  const { getLayoutStyles } = useLayoutTheme();

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
        timestamp_sec: (timestampEnabled && showTimestamp) ? formatTimestamp(timestampMinutes, timestampSeconds) : undefined,
        memo_type: memoType || 'insight', // デフォルトでinsightを送信
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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleTimestampEnabled = () => {
    if (timestampLocked && timestampEnabled) {
      // ロックされた自動タイムスタンプを無効にする
      setTimestampEnabled(false);
      setCurrentTimestampMode('none');
    } else if (!timestampEnabled) {
      // タイムスタンプを有効にする（手動モード）
      setTimestampEnabled(true);
      setCurrentTimestampMode('manual');
    } else {
      // タイムスタンプを無効にする
      setTimestampEnabled(false);
      setCurrentTimestampMode('none');
    }
  };

  const switchToManualMode = () => {
    setCurrentTimestampMode('manual');
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
          </View>

        {showTimestamp && (
            <View style={[styles.field, { marginBottom: layoutStyles.layout.fieldSpacing }]}>
              <View style={[styles.timestampHeader, { marginBottom: layoutStyles.layout.labelSpacing }]}>
                <Text style={[styles.label, { 
                  fontSize: layoutStyles.typography.fontSize.md,
                  marginBottom: 0,
                  fontWeight: layoutStyles.typography.fontWeight.MEDIUM,
                }]}>動画のタイムスタンプ</Text>
                <TouchableOpacity
                  style={[styles.timestampToggle, {
                    paddingHorizontal: layoutStyles.spacing.sm,
                    paddingVertical: layoutStyles.spacing.xs,
                    borderRadius: layoutStyles.layout.buttonBorderRadius,
                  }]}
                  onPress={toggleTimestampEnabled}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.timestampToggleText,
                    { fontSize: layoutStyles.typography.fontSize.sm },
                    !timestampEnabled && styles.timestampToggleTextDisabled
                  ]}>
                    {timestampEnabled ? '🕒 有効' : '⏸️ 無効'}
                  </Text>
                </TouchableOpacity>
              </View>

            {timestampEnabled ? (
              <>
                {currentTimestampMode === 'auto' && timestampLocked ? (
                  // Auto mode: Read-only display
                  <View style={[styles.timestampReadOnly, {
                    borderRadius: layoutStyles.layout.inputBorderRadius,
                    padding: layoutStyles.layout.inputPadding,
                  }]}>
                    <Text style={[styles.timestampAutoValue, {
                      fontSize: layoutStyles.typography.fontSize.md,
                    }]}>
                      📍 {formatTime(formatTimestamp(timestampMinutes, timestampSeconds) || 0)} (自動設定)
                    </Text>
                    <TouchableOpacity
                      style={[styles.editTimestampButton, {
                        paddingHorizontal: layoutStyles.spacing.sm,
                        paddingVertical: layoutStyles.spacing.xs,
                        borderRadius: layoutStyles.layout.buttonBorderRadius,
                      }]}
                      onPress={switchToManualMode}
                      disabled={isLoading}
                    >
                      <Text style={[styles.editTimestampButtonText, {
                        fontSize: layoutStyles.typography.fontSize.sm,
                      }]}>編集する</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Manual mode: Editable inputs
                  <View style={[styles.timestampContainer, {
                    borderRadius: layoutStyles.layout.inputBorderRadius,
                    padding: layoutStyles.layout.inputPadding,
                  }]}>
                    <View style={styles.timestampField}>
                      <Input
                        value={timestampMinutes}
                        onChangeText={handleTimestampMinutesChange}
                        placeholder="0"
                        keyboardType="numeric"
                        style={[styles.timestampInput, {
                          fontSize: layoutStyles.typography.fontSize.md,
                        }]}
                        editable={!isLoading}
                      />
                      <Text style={[styles.timestampUnit, {
                        fontSize: layoutStyles.typography.fontSize.sm,
                        marginLeft: layoutStyles.spacing.xs,
                      }]}>分</Text>
                    </View>
                    <Text style={[styles.timestampSeparator, {
                      fontSize: layoutStyles.typography.fontSize.lg,
                      marginHorizontal: layoutStyles.spacing.sm,
                    }]}>:</Text>
                    <View style={styles.timestampField}>
                      <Input
                        value={timestampSeconds}
                        onChangeText={handleTimestampSecondsChange}
                        placeholder="0"
                        keyboardType="numeric"
                        style={[styles.timestampInput, {
                          fontSize: layoutStyles.typography.fontSize.md,
                        }]}
                        editable={!isLoading}
                      />
                      <Text style={[styles.timestampUnit, {
                        fontSize: layoutStyles.typography.fontSize.sm,
                        marginLeft: layoutStyles.spacing.xs,
                      }]}>秒</Text>
                    </View>
                  </View>
                )}
                <Text style={[styles.hint, {
                  fontSize: layoutStyles.typography.fontSize.sm,
                  marginTop: layoutStyles.spacing.sm,
                  lineHeight: layoutStyles.typography.fontSize.sm * layoutStyles.typography.lineHeight.normal,
                }]}>
                  {currentTimestampMode === 'auto' && timestampLocked
                    ? '動画の現在時刻が自動で設定されています'
                    : '動画の特定の時間に関連するメモの場合は、タイムスタンプを設定してください'
                  }
                </Text>
              </>
            ) : (
              <View style={[styles.timestampDisabled, {
                borderRadius: layoutStyles.layout.inputBorderRadius,
                padding: layoutStyles.layout.inputPadding,
              }]}>
                <Text style={[styles.timestampDisabledText, {
                  fontSize: layoutStyles.typography.fontSize.sm,
                  marginBottom: layoutStyles.spacing.sm,
                }]}>
                  タイムスタンプなしのメモとして保存されます
                </Text>
                <TouchableOpacity
                  style={[styles.enableTimestampButton, {
                    paddingHorizontal: layoutStyles.spacing.md,
                    paddingVertical: layoutStyles.spacing.sm,
                    borderRadius: layoutStyles.layout.buttonBorderRadius,
                  }]}
                  onPress={toggleTimestampEnabled}
                  disabled={isLoading}
                >
                  <Text style={[styles.enableTimestampButtonText, {
                    fontSize: layoutStyles.typography.fontSize.sm,
                  }]}>タイムスタンプを追加</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
        )}

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
  // Auto mode read-only display
  timestampReadOnly: {
    backgroundColor: COLORS.GRAY_50,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampAutoValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
  editTimestampButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
  },
  editTimestampButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
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
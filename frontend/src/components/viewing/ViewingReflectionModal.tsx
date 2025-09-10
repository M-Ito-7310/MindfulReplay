import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button } from '@/components/common';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { ViewingSessionForm } from '@/types';

interface ViewingReflectionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (sessionData: ViewingSessionForm) => void;
  videoTitle: string;
  watchDuration: number;
}

export const ViewingReflectionModal: React.FC<ViewingReflectionModalProps> = ({
  visible,
  onClose,
  onComplete,
  videoTitle,
  watchDuration,
}) => {
  const [engagementLevel, setEngagementLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleComplete = () => {
    onComplete({
      engagement_level: engagementLevel,
    });
  };

  const formatWatchTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    }
    return `${remainingSeconds}秒`;
  };

  const getEngagementLabel = (level: 1 | 2 | 3 | 4 | 5): string => {
    const labels = {
      1: '😴 あまり集中できなかった',
      2: '😐 普通に視聴した',
      3: '🙂 興味深く視聴した',
      4: '😊 とても参考になった',
      5: '🤩 非常に有益だった'
    };
    return labels[level];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>視聴お疲れさまでした！</Text>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {videoTitle}
            </Text>
            <Text style={styles.watchTime}>
              視聴時間: {formatWatchTime(watchDuration)}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.questionText}>
              この動画はどうでしたか？
            </Text>
            
            <View style={styles.engagementButtons}>
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.engagementButton,
                    engagementLevel === level && styles.engagementButtonActive,
                  ]}
                  onPress={() => setEngagementLevel(level)}
                >
                  <Text style={[
                    styles.engagementButtonText,
                    engagementLevel === level && styles.engagementButtonTextActive,
                  ]}>
                    {getEngagementLabel(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.nextSteps}>
              <Text style={styles.nextStepsTitle}>次のステップ</Text>
              <Text style={styles.nextStepsText}>
                • この動画についてメモを作成
              </Text>
              <Text style={styles.nextStepsText}>
                • 実践したいことをタスクに追加
              </Text>
              <Text style={styles.nextStepsText}>
                • 関連する動画を探す
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="スキップ"
              onPress={onClose}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="完了"
              onPress={handleComplete}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    margin: SPACING.MD,
    maxWidth: 400,
    width: '90%',
  },
  header: {
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },
  watchTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  content: {
    padding: SPACING.LG,
  },
  questionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  engagementButtons: {
    gap: SPACING.SM,
    marginBottom: SPACING.XL,
  },
  engagementButton: {
    backgroundColor: COLORS.GRAY_50,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    alignItems: 'center',
  },
  engagementButtonActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  engagementButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  engagementButtonTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  nextSteps: {
    backgroundColor: COLORS.GRAY_50,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  nextStepsTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  nextStepsText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.LG,
    paddingTop: 0,
    gap: SPACING.MD,
  },
  actionButton: {
    flex: 1,
  },
});
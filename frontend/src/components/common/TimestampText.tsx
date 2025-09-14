import React from 'react';
import {
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/constants/theme';

interface TimestampTextProps {
  content: string;
  videoId?: string;
  onTimestampPress?: (seconds: number, videoId?: string) => void;
  style?: TextStyle | TextStyle[];
  linkStyle?: TextStyle | TextStyle[];
}

export const TimestampText: React.FC<TimestampTextProps> = ({
  content,
  videoId,
  onTimestampPress,
  style,
  linkStyle,
}) => {
  // Parse timestamp string to seconds
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':').map(p => parseInt(p, 10));

    if (parts.length === 2) {
      // MM:SS format
      const [minutes, seconds] = parts;
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      // HH:MM:SS format
      const [hours, minutes, seconds] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return 0;
  };

  // Regular expression to match timestamps like 0:00, 1:23, 1:23:45
  const timestampRegex = /(\d{1,2}:\d{2}(?::\d{2})?)/g;

  // Split content into parts with timestamps
  const renderContent = () => {
    if (!onTimestampPress || !videoId) {
      // If no handler or videoId, just render plain text
      return <Text style={style}>{content}</Text>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    // Find all timestamp matches
    const matches: Array<{ index: number; length: number; text: string }> = [];
    while ((match = timestampRegex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
      });
    }

    // Process matches and create components
    matches.forEach((matchInfo) => {
      // Add text before timestamp
      if (matchInfo.index > lastIndex) {
        const textBefore = content.substring(lastIndex, matchInfo.index);
        parts.push(
          <Text key={`text-${key++}`} style={style}>
            {textBefore}
          </Text>
        );
      }

      // Add clickable timestamp
      const seconds = parseTimestamp(matchInfo.text);

      const handleTimestampPress = () => {
        onTimestampPress(seconds, videoId);
      };

      parts.push(
        <TouchableOpacity
          key={`timestamp-${key++}`}
          onPress={handleTimestampPress}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Text style={[styles.timestampLink, style, linkStyle]}>
            {matchInfo.text}
          </Text>
        </TouchableOpacity>
      );

      lastIndex = matchInfo.index + matchInfo.length;
    });

    // Add remaining text after last timestamp
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parts.push(
        <Text key={`text-${key++}`} style={style}>
          {remainingText}
        </Text>
      );
    }

    // If no timestamps found, return plain text
    if (parts.length === 0) {
      return <Text style={style}>{content}</Text>;
    }

    return <Text style={style}>{parts}</Text>;
  };

  return <>{renderContent()}</>;
};

const styles = StyleSheet.create({
  timestampLink: {
    color: COLORS.PRIMARY,
    textDecorationLine: 'underline',
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM as any,
  },
});
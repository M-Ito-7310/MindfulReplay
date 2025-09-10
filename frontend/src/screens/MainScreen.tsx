import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { VideoListScreen } from './video/VideoListScreen';
import { MemoListScreen } from './memo/MemoListScreen';
import { TaskListScreen } from './task/TaskListScreen';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface MainScreenProps {
  navigation?: any;
}

type TabType = 'videos' | 'memos' | 'tasks';

export const MainScreen: React.FC<MainScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('videos');

  const tabs = [
    { id: 'videos' as TabType, label: '動画', icon: '📹' },
    { id: 'memos' as TabType, label: 'メモ', icon: '📝' },
    { id: 'tasks' as TabType, label: 'タスク', icon: '✅' },
  ];

  const enhancedNavigation = {
    ...navigation,
    navigate: (screen: string, params?: any) => {
      // Handle different screen types
      switch (screen) {
        case 'VideoPlayer':
        case 'MemoCreate':
        case 'MemoEdit':
        case 'TaskCreate':
        case 'TaskEdit':
          // For now, we'll just log these navigation requests
          // In a full React Navigation setup, these would work properly
          console.log(`Navigate to ${screen}`, params);
          // You can implement screen transitions here
          break;
        default:
          navigation?.navigate?.(screen, params);
      }
    },
    goBack: () => {
      // Handle back navigation within tab content
      console.log('Go back');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'videos':
        return <VideoListScreen navigation={enhancedNavigation} />;
      case 'memos':
        return <MemoListScreen navigation={enhancedNavigation} />;
      case 'tasks':
        return <TaskListScreen navigation={enhancedNavigation} />;
      default:
        return <VideoListScreen navigation={enhancedNavigation} />;
    }
  };

  const renderTabButton = (tab: typeof tabs[0]) => (
    <TouchableOpacity
      key={tab.id}
      style={[
        styles.tabButton,
        activeTab === tab.id && styles.activeTabButton,
      ]}
      onPress={() => setActiveTab(tab.id)}
    >
      <Text style={styles.tabIcon}>{tab.icon}</Text>
      <Text
        style={[
          styles.tabLabel,
          activeTab === tab.id && styles.activeTabLabel,
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map(renderTabButton)}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  tabBar: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    paddingTop: SPACING.SM,
  },
  tabBarContent: {
    paddingHorizontal: SPACING.MD,
  },
  tabButton: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    marginRight: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    minWidth: 80,
  },
  activeTabButton: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: SPACING.XS,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },
  activeTabLabel: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
  },
  content: {
    flex: 1,
  },
});
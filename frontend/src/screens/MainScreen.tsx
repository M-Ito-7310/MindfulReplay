import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { VideoListScreen } from './video/VideoListScreen';
import { VideoPlayerScreen } from './video/VideoPlayerScreen';
import { MemoListScreen } from './memo/MemoListScreen';
import { TaskListScreen } from './task/TaskListScreen';
import { authService } from '@/services/auth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface MainScreenProps {
  navigation?: any;
  onLogout?: () => void;
}

type TabType = 'videos' | 'memos' | 'tasks';
type ScreenType = 'main' | 'video-player';

interface ScreenState {
  type: ScreenType;
  params?: any;
}

export const MainScreen: React.FC<MainScreenProps> = ({ navigation, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [screenState, setScreenState] = useState<ScreenState>({ type: 'main' });

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
          setScreenState({ type: 'video-player', params });
          break;
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
      setScreenState({ type: 'main' });
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      
      // Navigate back to login screen
      if (onLogout) {
        onLogout();
      }
      
      // Success message
      if (typeof window !== 'undefined') {
        window.alert('ログアウトしました');
      } else {
        Alert.alert('ログアウト', 'ログアウトしました');
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      // Force logout even if API call fails
      if (onLogout) {
        onLogout();
      }
    }
  };

  const confirmLogout = () => {
    if (typeof window !== 'undefined') {
      if (window.confirm('ログアウトしますか？')) {
        handleLogout();
      }
    } else {
      Alert.alert(
        'ログアウト',
        'ログアウトしますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'ログアウト', onPress: handleLogout, style: 'destructive' },
        ]
      );
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

  // Render different screens based on state
  if (screenState.type === 'video-player') {
    return (
      <View style={styles.container}>
        <VideoPlayerScreen 
          navigation={enhancedNavigation}
          route={{ params: screenState.params }}
        />
      </View>
    );
  }

  // Default main screen with tabs
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MindfulReplay</Text>
        <TouchableOpacity onPress={confirmLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.PRIMARY,
  },
  logoutButton: {
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_100,
  },
  logoutText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
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
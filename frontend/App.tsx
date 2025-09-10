import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { LoginScreen, SignupScreen, MainScreen } from '@/screens';
import { authService } from '@/services/auth';

type AppScreen = 'Login' | 'Signup' | 'Main';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('Login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await authService.isAuthenticated();
    if (authenticated) {
      setCurrentScreen('Main');
      setIsAuthenticated(true);
    }
  };

  const navigation = {
    navigate: (screen: AppScreen) => setCurrentScreen(screen),
    replace: (screen: AppScreen) => setCurrentScreen(screen),
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentScreen('Main');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return (
          <LoginScreen 
            navigation={navigation}
            onLoginSuccess={handleAuthSuccess}
          />
        );
      case 'Signup':
        return (
          <SignupScreen 
            navigation={navigation}
            onSignupSuccess={handleAuthSuccess}
          />
        );
      case 'Main':
        return <MainScreen navigation={navigation} />;
      default:
        return (
          <LoginScreen 
            navigation={navigation}
            onLoginSuccess={handleAuthSuccess}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
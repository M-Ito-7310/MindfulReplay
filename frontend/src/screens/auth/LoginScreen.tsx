import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Input } from '@/components/common';
import { authService } from '@/services/auth';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { LoginForm } from '@/types';

interface LoginScreenProps {
  navigation?: any;
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  navigation,
  onLoginSuccess 
}) => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上である必要があります';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(formData);
      Alert.alert('成功', 'ログインに成功しました');
      
      if (onLoginSuccess) {
        onLoginSuccess();
      } else if (navigation) {
        navigation.replace('Main');
      }
    } catch (error) {
      Alert.alert(
        'ログインエラー',
        error instanceof Error ? error.message : 'ログインに失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupPress = () => {
    if (navigation) {
      navigation.navigate('Signup');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>MindfulReplay</Text>
          <Text style={styles.subtitle}>
            YouTubeの学習を能動的な体験へ
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="メールアドレス"
            placeholder="email@example.com"
            value={formData.email}
            onChangeText={(email) => setFormData({ ...formData, email })}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="パスワード"
            placeholder="パスワードを入力"
            value={formData.password}
            onChangeText={(password) => setFormData({ ...formData, password })}
            error={errors.password}
            secureTextEntry
            showPasswordToggle
          />

          <Button
            title="ログイン"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="アカウントを作成"
            onPress={handleSignupPress}
            variant="outline"
          />
        </View>

        <Text style={styles.footer}>
          パスワードをお忘れですか？
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXXL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  form: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.LG,
    borderRadius: 12,
    marginBottom: SPACING.LG,
  },
  loginButton: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.LG,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.GRAY_300,
  },
  dividerText: {
    marginHorizontal: SPACING.MD,
    color: COLORS.TEXT_MUTED,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
  },
});
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
import { SignupForm } from '@/types';

interface SignupScreenProps {
  navigation?: any;
  onSignupSuccess?: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ 
  navigation,
  onSignupSuccess 
}) => {
  const [formData, setFormData] = useState<SignupForm>({
    email: '',
    username: '',
    password: '',
    display_name: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Partial<SignupForm & { confirmPassword: string }>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupForm & { confirmPassword: string }> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'ユーザー名を入力してください';
    } else if (formData.username.length < 3) {
      newErrors.username = 'ユーザー名は3文字以上である必要があります';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'ユーザー名は英数字とアンダースコアのみ使用できます';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上である必要があります';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'パスワードは大文字、小文字、数字、特殊文字を含む必要があります';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'パスワードを再入力してください';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(formData);
      Alert.alert(
        '登録完了',
        'アカウントの作成が完了しました',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSignupSuccess) {
                onSignupSuccess();
              } else if (navigation) {
                navigation.replace('Main');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        '登録エラー',
        error instanceof Error ? error.message : 'アカウントの作成に失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    if (navigation) {
      navigation.navigate('Login');
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
          <Text style={styles.title}>アカウント作成</Text>
          <Text style={styles.subtitle}>
            MindfulReplayで学習を始めましょう
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="メールアドレス*"
            placeholder="email@example.com"
            value={formData.email}
            onChangeText={(email) => setFormData({ ...formData, email })}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="ユーザー名*"
            placeholder="username"
            value={formData.username}
            onChangeText={(username) => setFormData({ ...formData, username })}
            error={errors.username}
            autoCapitalize="none"
            autoCorrect={false}
            hint="3文字以上の英数字とアンダースコア"
          />

          <Input
            label="表示名"
            placeholder="田中 太郎"
            value={formData.display_name}
            onChangeText={(display_name) => setFormData({ ...formData, display_name })}
            hint="他のユーザーに表示される名前（オプション）"
          />

          <Input
            label="パスワード*"
            placeholder="パスワードを入力"
            value={formData.password}
            onChangeText={(password) => setFormData({ ...formData, password })}
            error={errors.password}
            secureTextEntry
            showPasswordToggle
            hint="8文字以上、大文字・小文字・数字・特殊文字を含む"
          />

          <Input
            label="パスワード確認*"
            placeholder="パスワードを再入力"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
            showPasswordToggle
          />

          <Button
            title="アカウントを作成"
            onPress={handleSignup}
            loading={isLoading}
            style={styles.signupButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="ログインに戻る"
            onPress={handleLoginPress}
            variant="ghost"
          />
        </View>

        <Text style={styles.terms}>
          アカウントを作成することで、利用規約とプライバシーポリシーに同意したものとみなされます
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
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
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
    marginBottom: SPACING.MD,
  },
  signupButton: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.MD,
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
  terms: {
    textAlign: 'center',
    color: COLORS.TEXT_MUTED,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    paddingHorizontal: SPACING.LG,
  },
});
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/typography';
import * as authApi from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isValidEmail, isValidPassword } from '../utils/validators';
import { getErrorMessage } from '../utils/errorMessage';
import { ApiClientError } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation, route }: Props) {
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState(route.params?.verifiedEmail ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const infoMessage = route.params?.verifiedEmail ? 'Email verified! You can now log in.' : null;

  const mutation = useMutation({
    mutationFn: () => login(email.trim().toLowerCase(), password),
    onSuccess: () => {
      showSuccess('Logged in successfully');
    },
    onError: (error) => {
      setUnverifiedEmail(null);
      if (error instanceof ApiClientError && error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email.trim().toLowerCase());
      }
      const message = getErrorMessage(error);
      setFormError(message);
      showError(message);
    },
  });

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
    if (!isValidPassword(password)) errors.password = 'Password must be at least 8 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    setFormError(null);
    setUnverifiedEmail(null);
    if (validate()) {
      mutation.mutate();
    }
  }

  async function handleGoVerify() {
    if (!unverifiedEmail) return;
    setIsSendingCode(true);
    try {
      await authApi.resendOtp(unverifiedEmail);
    } catch {
      // A still-valid code may already exist — fall through to the verify screen either way.
    } finally {
      setIsSendingCode(false);
      navigation.navigate('VerifyEmail', { email: unverifiedEmail });
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader
        eyebrow="Welcome back"
        title="Log in"
        subtitle="See what your Lifestyle Manager is handling for you."
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {infoMessage ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{infoMessage}</Text>
            </View>
          ) : null}

          {formError ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{formError}</Text>
              {unverifiedEmail ? (
                <Text style={styles.bannerLink} onPress={handleGoVerify}>
                  {isSendingCode ? 'Sending code…' : 'Verify your email now'}
                </Text>
              ) : null}
            </View>
          ) : null}

          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoComplete="email"
            testID="login-email"
          />
          <TextField
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry
            testID="login-password"
          />

          <View style={styles.buttonSpacing}>
            <PrimaryButton title="Log in" onPress={handleSubmit} loading={mutation.isPending} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here?</Text>
            <Text style={styles.footerLink} onPress={() => navigation.navigate('Register')}>
              {' '}
              Create an account
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, flexGrow: 1 },
  successBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successBannerText: { ...typography.body, color: colors.primaryDeep },
  banner: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { ...typography.body, color: colors.error },
  bannerLink: { ...typography.bodyStrong, color: colors.error, marginTop: spacing.xs, textDecorationLine: 'underline' },
  buttonSpacing: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.bodyStrong, color: colors.primary },
});

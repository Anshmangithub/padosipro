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
import { useToast } from '../context/ToastContext';
import { isValidEmail, isValidPassword, passwordsMatch } from '../utils/validators';
import { getErrorMessage } from '../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterScreen({ navigation }: Props) {
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => authApi.register(email.trim().toLowerCase(), password),
    onSuccess: () => {
      showSuccess('Account created — check your email for a verification code');
      navigation.navigate('VerifyEmail', { email: email.trim().toLowerCase() });
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setFormError(message);
      showError(message);
    },
  });

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
    if (!isValidPassword(password)) errors.password = 'Password must be at least 8 characters';
    if (!passwordsMatch(password, confirmPassword)) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    setFormError(null);
    if (validate()) {
      mutation.mutate();
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader
        eyebrow="Get started"
        title="Create your account"
        subtitle="Tell us what you need — your Lifestyle Manager handles the rest."
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {formError ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{formError}</Text>
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
            testID="register-email"
          />
          <TextField
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            secureTextEntry
            testID="register-password"
          />
          <TextField
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={fieldErrors.confirmPassword}
            secureTextEntry
            testID="register-confirm-password"
          />

          <View style={styles.buttonSpacing}>
            <PrimaryButton title="Create account" onPress={handleSubmit} loading={mutation.isPending} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Text style={styles.footerLink} onPress={() => navigation.navigate('Login', undefined)}>
              {' '}
              Log in
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
  banner: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { ...typography.body, color: colors.error },
  buttonSpacing: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.bodyStrong, color: colors.primary },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { OtpInput } from '../components/OtpInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/typography';
import * as authApi from '../api/auth';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

const RESEND_COOLDOWN_SECONDS = 30;
const CODE_LENGTH = 6;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const { showSuccess, showError } = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOtp(email, code),
    onSuccess: () => {
      showSuccess('Email verified successfully');
      navigation.replace('Login', { verifiedEmail: email });
    },
    onError: (err) => {
      const message = getErrorMessage(err);
      setError(message);
      setCode('');
      showError(message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp(email),
    onSuccess: () => {
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setCode('');
      setError(null);
      setInfoMessage('A new code has been sent to your email.');
      showSuccess('A new code has been sent to your email');
    },
    onError: (err) => {
      const message = getErrorMessage(err);
      setError(message);
      showError(message);
    },
  });

  function handleVerify() {
    setError(null);
    setInfoMessage(null);
    if (code.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code`);
      return;
    }
    verifyMutation.mutate();
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader
        eyebrow="One more step"
        title="Verify your email"
        subtitle={`We sent a ${CODE_LENGTH}-digit code to ${email}`}
        onBack={navigation.canGoBack() ? navigation.goBack : undefined}
      />
      <View style={styles.container}>
        <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} error={Boolean(error)} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

        <View style={styles.verifyButton}>
          <PrimaryButton title="Verify" onPress={handleVerify} loading={verifyMutation.isPending} />
        </View>

        <View style={styles.resendRow}>
          {secondsLeft > 0 ? (
            <Text style={styles.resendHint}>Resend code in {secondsLeft}s</Text>
          ) : (
            <Text
              style={styles.resendLink}
              onPress={() => !resendMutation.isPending && resendMutation.mutate()}
            >
              {resendMutation.isPending ? 'Sending…' : 'Resend code'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  errorText: { ...typography.body, color: colors.error, marginTop: spacing.md },
  infoText: { ...typography.body, color: colors.primary, marginTop: spacing.md },
  verifyButton: { marginTop: spacing.lg },
  resendRow: { alignItems: 'center', marginTop: spacing.lg },
  resendHint: { ...typography.body, color: colors.textSecondary },
  resendLink: { ...typography.bodyStrong, color: colors.primary },
});

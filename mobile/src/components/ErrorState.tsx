import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/typography';
import { PrimaryButton } from './PrimaryButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Couldn&apos;t load this</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.button}>
          <PrimaryButton title="Try again" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  button: { marginTop: spacing.lg, minWidth: 160 },
});

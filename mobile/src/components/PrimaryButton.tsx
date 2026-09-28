import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { radius, typography } from '../theme/typography';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }: PrimaryButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const content = loading ? (
    <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.primary} />
  ) : (
    <Text style={[styles.text, variant === 'primary' ? styles.textPrimary : styles.textSecondary]}>{title}</Text>
  );

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        style={({ pressed }) => [
          styles.base,
          styles.secondary,
          isDisabled && styles.disabledSecondary,
          pressed && !isDisabled && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [pressed && !isDisabled && styles.pressed]}
    >
      {isDisabled && !loading ? (
        <View style={[styles.base, styles.disabledPrimary]}>{content}</View>
      ) : (
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles.primary]}
        >
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  disabledPrimary: { backgroundColor: colors.disabled },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  disabledSecondary: { borderColor: colors.disabled },
  pressed: { opacity: 0.85 },
  text: { ...typography.button },
  textPrimary: { color: colors.textInverse },
  textSecondary: { color: colors.primary },
});

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/typography';

export type ToastType = 'success' | 'error' | 'info';

const VISIBLE_MS = 2800;
const ANIM_MS = 220;

const palette: Record<ToastType, string> = {
  success: colors.teal,
  error: colors.error,
  info: colors.primary,
};

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
}

export function Toast({ message, type, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: ANIM_MS, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -40, duration: ANIM_MS, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onHide();
      });
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [translateY, opacity, onHide]);

  return (
    <Animated.View
      pointerEvents="none"
      testID={`toast-${type}`}
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          backgroundColor: palette[type],
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 999,
  },
  text: { ...typography.bodyStrong, color: colors.textInverse, textAlign: 'center' },
});

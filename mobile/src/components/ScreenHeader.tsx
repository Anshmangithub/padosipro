import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '../theme/colors';
import { radius, spacing, typography } from '../theme/typography';

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void };
}

// The one consistent "nav bar" every screen renders: a gradient band that
// extends into the safe area, carrying the title and optional back/side
// action — rather than a bare Text sitting under the status bar.
export function ScreenHeader({ eyebrow, title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        {rightAction ? (
          <Pressable onPress={rightAction.onPress} hitSlop={12}>
            <Text style={styles.rightAction}>{rightAction.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
      </View>

      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: { width: 36, height: 36 },
  backArrow: { color: colors.textInverse, fontSize: 24, lineHeight: 24, marginTop: -2 },
  rightAction: { ...typography.bodyStrong, color: colors.textInverse },
  eyebrow: { ...typography.eyebrow, color: colors.textInverseMuted, textTransform: 'uppercase', marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.textInverse },
  subtitle: { ...typography.body, color: colors.textInverseMuted, marginTop: spacing.xs },
});

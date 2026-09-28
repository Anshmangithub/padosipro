import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/typography';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  /** A static label (e.g. "+91") rendered inside the same bordered box, before the input. */
  prefix?: string;
}

export function TextField({ label, error, prefix, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  function handleFocus(e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
    setFocused(true);
    onFocus?.(e);
  }

  function handleBlur(e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) {
    setFocused(false);
    onBlur?.(e);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {prefix ? (
        <View style={[styles.box, focused && styles.boxFocused, error ? styles.boxError : null, style]}>
          <Text style={styles.prefixText}>{prefix}</Text>
          <View style={styles.divider} />
          <TextInput
            style={styles.inputWithPrefix}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />
        </View>
      ) : (
        <TextInput
          style={[styles.input, focused && styles.boxFocused, error ? styles.boxError : null, style]}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
  },
  boxFocused: { borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  prefixText: { ...typography.body, color: colors.textPrimary },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: 12, backgroundColor: colors.border, marginLeft: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputWithPrefix: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 13,
    ...typography.body,
    color: colors.textPrimary,
  },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});

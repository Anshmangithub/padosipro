import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/fonts';
import { radius } from '../theme/typography';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

// A single hidden TextInput drives `length` visual boxes. This sidesteps the
// fiddly focus-juggling of one TextInput per digit while still looking like
// discrete boxes.
export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.row}>
      {digits.map((digit, index) => (
        <View
          key={index}
          style={[styles.box, error && styles.boxError, index === value.length && styles.boxActive]}
        >
          <Text style={styles.digit}>{digit}</Text>
        </View>
      ))}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        autoFocus
        testID="otp-hidden-input"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: {
    width: 46,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  boxError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  digit: { fontFamily: fontFamilies.displayBold, fontSize: 22, color: colors.textPrimary },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
});

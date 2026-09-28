import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { typography } from '../theme/typography';

export function SplashScreen() {
  return (
    <LinearGradient colors={gradients.brand} style={styles.container}>
      <Text style={styles.logo}>PadosiPro</Text>
      <ActivityIndicator color={colors.textInverse} style={styles.spinner} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { ...typography.display, color: colors.textInverse },
  spinner: { marginTop: 24 },
});

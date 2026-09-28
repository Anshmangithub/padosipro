import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme/typography';
import * as profileApi from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isValidIndianMobile } from '../utils/validators';
import { getErrorMessage } from '../utils/errorMessage';

interface FieldErrors {
  name?: string;
  mobileNumber?: string;
  address?: string;
}

export function ProfileScreen() {
  const { markProfileComplete } = useAuth();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      profileApi.saveProfile({
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
        businessName: businessName.trim() || undefined,
      }),
    onSuccess: () => {
      markProfileComplete();
      showSuccess('Profile saved successfully');
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setFormError(message);
      showError(message);
    },
  });

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (name.trim().length < 2) errors.name = 'Enter your full name';
    if (!isValidIndianMobile(mobileNumber)) errors.mobileNumber = 'Enter a valid 10-digit mobile number';
    if (address.trim().length < 5) errors.address = 'Enter your full address';
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
        eyebrow="Almost there"
        title="Tell us about you"
        subtitle="Just this once — so your Lifestyle Manager knows who they're helping."
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {formError ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>{formError}</Text>
            </View>
          ) : null}

          <TextField label="Name" placeholder="Your full name" value={name} onChangeText={setName} error={fieldErrors.name} testID="profile-name" />

          <TextField
            label="Mobile number"
            prefix="+91"
            placeholder="10-digit number"
            value={mobileNumber}
            onChangeText={(v) => setMobileNumber(v.replace(/[^0-9]/g, '').slice(0, 10))}
            error={fieldErrors.mobileNumber}
            keyboardType="number-pad"
            testID="profile-mobile"
          />

          <TextField
            label="Address"
            placeholder="House no., street, city, PIN code"
            value={address}
            onChangeText={setAddress}
            error={fieldErrors.address}
            multiline
            numberOfLines={3}
            style={styles.multiline}
            testID="profile-address"
          />

          <TextField
            label="Business name (optional)"
            placeholder="If you run a home business"
            value={businessName}
            onChangeText={setBusinessName}
            testID="profile-business-name"
          />

          <View style={styles.buttonSpacing}>
            <PrimaryButton title="Continue" onPress={handleSubmit} loading={mutation.isPending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingTop: spacing.xl, flexGrow: 1 },
  banner: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { ...typography.body, color: colors.error },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  buttonSpacing: { marginTop: spacing.sm },
});

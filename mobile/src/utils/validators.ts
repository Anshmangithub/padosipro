export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Mirrors the backend's minimum (see auth.schema.ts) so users see the same
// rule client-side instead of discovering it only after a failed request.
export function isValidPassword(value: string): boolean {
  return value.length >= 8;
}

export function isValidIndianMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value.trim());
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}

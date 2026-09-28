// A bolder, more vibrant palette than a typical form-heavy utility app —
// indigo→violet as the brand gradient, a fresh teal for secondary accents,
// on a near-white, slightly cool background. Original, not copied from
// anywhere.
export const colors = {
  primary: '#5B5FEF',
  primaryDeep: '#4338CA',
  primaryLight: '#EEF0FF',
  violet: '#8B5CF6',
  teal: '#00C2A8',
  tealLight: '#E1FAF5',

  background: '#F6F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0FA',
  border: '#E6E5F5',

  textPrimary: '#14141F',
  textSecondary: '#6B6B80',
  textInverse: '#FFFFFF',
  textInverseMuted: 'rgba(255,255,255,0.78)',
  placeholder: '#9C9CB5',

  success: '#00C2A8',
  error: '#FF4D6D',
  errorLight: '#FFE9ED',

  disabled: '#D6D5E8',
  shadow: '#302B63',
} as const;

// Gradient stop pairs, used with expo-linear-gradient.
export const gradients = {
  brand: ['#5B5FEF', '#8B5CF6'] as const,
  brandDeep: ['#4338CA', '#6D28D9'] as const,
  teal: ['#00C2A8', '#00E0C0'] as const,
};

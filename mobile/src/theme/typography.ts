import { fontFamilies } from './fonts';

// No `fontWeight` here on purpose — each style points at a specific weighted
// font file (via fontFamily), and mixing that with `fontWeight` makes RN try
// to synthesize a mismatched weight instead of using the real one.
export const typography = {
  display: { fontFamily: fontFamilies.displayBold, fontSize: 32, lineHeight: 38 },
  h1: { fontFamily: fontFamilies.displayBold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fontFamilies.displaySemiBold, fontSize: 21, lineHeight: 27 },
  h3: { fontFamily: fontFamilies.displaySemiBold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fontFamilies.bodyRegular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamilies.bodySemiBold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamilies.bodyRegular, fontSize: 13, lineHeight: 18 },
  captionStrong: { fontFamily: fontFamilies.bodyMedium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fontFamilies.displaySemiBold, fontSize: 16, lineHeight: 20 },
  eyebrow: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

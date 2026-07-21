// packages/ui/tailwind.config.ts
// Kealee Platform Shared Tailwind Configuration
// All apps should extend this configuration

import type { Config } from 'tailwindcss';
import { colors, typography, spacing, borderRadius, shadows } from './src/design-tokens';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        orange: colors.orange,
        green: colors.green,
        yellow: colors.yellow,
        red: colors.red,
        gray: colors.gray,
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      spacing: spacing,
      borderRadius: borderRadius,
      boxShadow: shadows,
    },
  },
  plugins: [],
};

export default config;

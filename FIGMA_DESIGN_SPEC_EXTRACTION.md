# Kealee Platform - Design System Extraction for Figma

Complete design tokens, theme configurations, and design system documentation extracted for building a Figma specification document.

**Last Updated:** May 31, 2026
**Extracted from:** Kealee Platform v10/v20

---

## 📁 File Locations Summary

| Component | File Path | Status |
|-----------|-----------|--------|
| **Design Tokens** | `packages/ui/src/design-tokens.ts` | ✅ Complete |
| **Tokens (Extended)** | `packages/ui/src/tokens.ts` | ✅ Complete |
| **Tailwind Config (TS)** | `packages/ui/tailwind.config.ts` | ✅ Complete |
| **Tailwind Config (JS)** | `packages/ui/tailwind.config.js` | ✅ Complete |
| **Module Themes** | `packages/ui/src/themes.ts` | ✅ Complete |
| **Design System Doc** | `docs/DESIGN_SYSTEM_PACKAGE.md` | ✅ Complete |
| **UX/UI Master Spec** | `docs/UX_UI_MASTER_SPECIFICATION.md` | ✅ Complete |

---

## 🎨 PART 1: DESIGN TOKENS

### File: `packages/ui/src/design-tokens.ts`

```typescript
// packages/ui/src/design-tokens.ts
// Kealee Platform Design System - Design Tokens
// All design tokens for consistent styling across applications

/**
 * Color Palette
 * Primary colors for trust & professionalism
 * Secondary colors for energy & construction
 * Semantic colors for states (success, warning, error)
 */
export const colors = {
  // Primary - Trust & Professionalism
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb', // Buttons, links
    700: '#1d4ed8', // Hover states
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Secondary - Energy & Construction
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Accents
    600: '#ea580c',
    700: '#c2410c',
  },
  // Success - Completed, Approved
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success states
    600: '#16a34a',
    700: '#15803d',
  },
  // Warning - Attention Needed
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308', // Warning states
    600: '#ca8a04',
  },
  // Error - Mistakes, Blocks
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error states
    600: '#dc2626',
    700: '#b91c1c',
  },
  // Neutrals - Text, Backgrounds
  gray: {
    50: '#f9fafb',   // Subtle backgrounds
    100: '#f3f4f6',  // Cards, containers
    200: '#e5e7eb',  // Borders
    300: '#d1d5db',  // Disabled states
    400: '#9ca3af',  // Placeholders
    500: '#6b7280',  // Secondary text
    600: '#4b5563',  // Body text
    700: '#374151',  // Headings
    800: '#1f2937',  // Dark headings
    900: '#111827',  // Maximum contrast
  },
} as const;

/**
 * Typography Scale
 * Inter font family for modern, readable text
 */
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px - Small labels
    sm: '0.875rem',   // 14px - Secondary text
    base: '1rem',     // 16px - Body text
    lg: '1.125rem',  // 18px - Emphasized text
    xl: '1.25rem',   // 20px - Small headings
    '2xl': '1.5rem', // 24px - Card headings
    '3xl': '1.875rem', // 30px - Section headings
    '4xl': '2.25rem',  // 36px - Page headings
    '5xl': '3rem',     // 48px - Hero headings
    '6xl': '3.75rem',  // 60px - Landing page heros
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,   // Headings
    normal: 1.5,  // Body text
    relaxed: 1.75, // Long-form content
  },
} as const;

/**
 * Spacing Scale
 * 4px base unit for consistent spacing
 */
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px - Base unit
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
} as const;

/**
 * Border Radius Scale
 * Rounded corners for modern UI
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.375rem', // 6px - Cards
  md: '0.5rem',     // 8px - Buttons
  lg: '0.75rem',    // 12px - Modals
  xl: '1rem',       // 16px - Large cards
  '2xl': '1.5rem',  // 24px - Hero sections
  full: '9999px',   // Full circle
} as const;

/**
 * Shadow Scale
 * Elevation system for depth
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

/**
 * Z-Index Scale
 * Layering system for overlays
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Breakpoints
 * Responsive design breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Animation Durations
 * Consistent timing for transitions
 */
export const durations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Animation Easing
 * Natural motion curves
 */
export const easing = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  breakpoints,
  durations,
  easing,
} as const;

export default designTokens;
```

---

## 🎨 PART 2: EXTENDED TOKENS

### File: `packages/ui/src/tokens.ts`

```typescript
// packages/ui/src/tokens.ts
// Kealee Platform Design System - Design Tokens
// Official design tokens for consistent styling across all applications

/**
 * Color Palette - Use These Exactly
 * Primary colors for trust & professionalism
 * Brand colors for Kealee identity
 * Semantic colors for states
 * App-specific colors for feature areas
 */
export const colors = {
  // Primary
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Brand
  kealeeBlue: '#1E40AF',
  constructionOrange: '#F97316',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // App-specific colors for feature areas
  bid: '#8B5CF6',           // Purple - Bid management
  visit: '#14B8A6',         // Teal - Site visits
  permit: '#6366F1',        // Indigo - Permits
  budget: '#059669',        // Emerald - Budget tracking
  ai: '#7C3AED',            // Violet - AI features
  escrow: '#059669',        // Emerald - Financial/Escrow

  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // White & Black
  white: '#FFFFFF',
  black: '#000000',
} as const;

/**
 * Font Families
 */
export const fonts = {
  display: '"Plus Jakarta Sans", sans-serif',
  body: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;

/**
 * Spacing Scale
 * Based on 4px base unit
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px - Base
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  // Named spacing for clarity
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
} as const;

/**
 * Typography Scale
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
  '5xl': ['3rem', { lineHeight: '1' }],           // 48px
  '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
  '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
} as const;

export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/**
 * Border Radius
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

/**
 * Shadows
 */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

/**
 * Z-Index Scale
 */
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
} as const;

/**
 * Breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Animation
 */
export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Export all tokens
export const tokens = {
  colors,
  fonts,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
  zIndex,
  breakpoints,
  animation,
} as const;

export default tokens;
```

---

## 🎨 PART 3: TAILWIND CONFIGURATION

### File: `packages/ui/tailwind.config.ts`

```typescript
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
```

### File: `packages/ui/tailwind.config.js`

```javascript
// packages/ui/tailwind.config.js
// Kealee Platform Design System - Tailwind Configuration

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../apps/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Trust & Professionalism
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Main brand color
          600: '#2563eb',  // Buttons, links
          700: '#1d4ed8',  // Hover states
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        // Secondary - Energy & Construction
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Accents
          600: '#ea580c',
          700: '#c2410c',
        },
        
        // Success - Completed, Approved
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Success states
          600: '#16a34a',
          700: '#15803d',
        },
        
        // Warning - Attention Needed
        yellow: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',  // Warning states
          600: '#ca8a04',
        },
        
        // Error - Mistakes, Blocks
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Error states
          600: '#dc2626',
          700: '#b91c1c',
        },
        
        // Neutrals - Text, Backgrounds
        gray: {
          50: '#f9fafb',   // Subtle backgrounds
          100: '#f3f4f6',  // Cards, containers
          200: '#e5e7eb',  // Borders
          300: '#d1d5db',  // Disabled states
          400: '#9ca3af',  // Placeholders
          500: '#6b7280',  // Secondary text
          600: '#4b5563',  // Body text
          700: '#374151',  // Headings
          800: '#1f2937',  // Dark headings
          900: '#111827',  // Maximum contrast
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        xs: '0.75rem',    // 12px - Small labels
        sm: '0.875rem',   // 14px - Secondary text
        base: '1rem',     // 16px - Body text
        lg: '1.125rem',   // 18px - Emphasized text
        xl: '1.25rem',    // 20px - Small headings
        '2xl': '1.5rem',  // 24px - Card headings
        '3xl': '1.875rem',// 30px - Section headings
        '4xl': '2.25rem', // 36px - Page headings
        '5xl': '3rem',    // 48px - Hero headings
        '6xl': '3.75rem', // 60px - Landing page heros
      },
      
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      
      lineHeight: {
        tight: 1.25,    // Headings
        normal: 1.5,    // Body text
        relaxed: 1.75,  // Long-form content
      },
      
      spacing: {
        0: '0',
        1: '0.25rem',  // 4px
        2: '0.5rem',   // 8px
        3: '0.75rem',  // 12px
        4: '1rem',     // 16px - Base unit
        5: '1.25rem',  // 20px
        6: '1.5rem',   // 24px
        8: '2rem',     // 32px
        10: '2.5rem',  // 40px
        12: '3rem',    // 48px
        16: '4rem',    // 64px
        20: '5rem',    // 80px
        24: '6rem',    // 96px
      },
      
      borderRadius: {
        none: '0',
        sm: '0.125rem',   // 2px
        DEFAULT: '0.375rem', // 6px - Cards
        md: '0.5rem',     // 8px - Buttons
        lg: '0.75rem',    // 12px - Modals
        xl: '1rem',       // 16px - Large cards
        '2xl': '1.5rem',  // 24px - Hero sections
        full: '9999px',   // Pills, avatars
      },
      
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },
      maxWidth: {
        '0': '0rem',
        'none': 'none',
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
        'full': '100%',
        'min': 'min-content',
        'max': 'max-content',
        'prose': '65ch',
      },
    },
  },
  plugins: [],
};
```

---

## 🎭 PART 4: THEME SYSTEM WITH MODULE THEMES

### File: `packages/ui/src/themes.ts`

```typescript
// packages/ui/src/themes.ts
// Kealee Platform Design System - Module Themes
// Each module has its own accent color and styling configuration

import { colors } from './tokens';

/**
 * Module Theme Configuration
 * Maps each app to its specific primary and accent colors
 */
export type ModuleName =
  | 'm-marketplace'
  | 'm-project-owner'
  | 'm-ops-services'
  | 'm-architect'
  | 'm-engineer'
  | 'm-permits-inspections'
  | 'm-finance-trust'
  | 'm-inspector'
  | 'os-pm'
  | 'os-admin';

export interface ModuleTheme {
  name: ModuleName;
  displayName: string;
  primary: string;
  accent: string;
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}

export const moduleThemes: Record<ModuleName, ModuleTheme> = {
  'm-marketplace': {
    name: 'm-marketplace',
    displayName: 'Kealee Marketplace',
    primary: colors.kealeeBlue,
    accent: colors.constructionOrange,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'm-project-owner': {
    name: 'm-project-owner',
    displayName: 'Project Owner Portal',
    primary: colors.kealeeBlue,
    accent: colors.success,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'm-ops-services': {
    name: 'm-ops-services',
    displayName: 'Contractor Services',
    primary: colors.kealeeBlue,
    accent: colors.bid,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'm-architect': {
    name: 'm-architect',
    displayName: 'Design Services',
    primary: '#6366F1', // Indigo
    accent: colors.constructionOrange,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'm-engineer': {
    name: 'm-engineer',
    displayName: 'Engineering Services',
    primary: '#0891B2', // Cyan
    accent: colors.constructionOrange,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'm-permits-inspections': {
    name: 'm-permits-inspections',
    displayName: 'Permits & Inspections',
    primary: '#7C3AED', // Violet
    accent: colors.success,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'm-finance-trust': {
    name: 'm-finance-trust',
    displayName: 'Finance & Trust',
    primary: colors.escrow,
    accent: colors.kealeeBlue,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'm-inspector': {
    name: 'm-inspector',
    displayName: 'Inspector Portal',
    primary: '#7C3AED', // Violet
    accent: colors.warning,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'os-pm': {
    name: 'os-pm',
    displayName: 'PM Workspace',
    primary: colors.kealeeBlue,
    accent: colors.constructionOrange,
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    textPrimary: colors.gray[900],
    textSecondary: colors.gray[600],
    borderColor: colors.gray[200],
  },
  'os-admin': {
    name: 'os-admin',
    displayName: 'Admin Console',
    primary: colors.gray[900], // Dark theme
    accent: colors.constructionOrange,
    bgPrimary: colors.gray[900],
    bgSecondary: colors.gray[800],
    textPrimary: colors.white,
    textSecondary: colors.gray[400],
    borderColor: colors.gray[700],
  },
};

/**
 * Get theme for a specific module
 */
export function getModuleTheme(moduleName: ModuleName): ModuleTheme {
  return moduleThemes[moduleName] || moduleThemes['m-marketplace'];
}

/**
 * Theme CSS variables generator
 * Use this to inject theme as CSS custom properties
 */
export function getThemeCSSVariables(theme: ModuleTheme): Record<string, string> {
  return {
    '--theme-primary': theme.primary,
    '--theme-accent': theme.accent,
    '--theme-bg-primary': theme.bgPrimary,
    '--theme-bg-secondary': theme.bgSecondary,
    '--theme-text-primary': theme.textPrimary,
    '--theme-text-secondary': theme.textSecondary,
    '--theme-border': theme.borderColor,
  };
}

/**
 * Feature-specific color map
 * Used for consistent coloring of domain-specific features
 */
export const featureColors = {
  // Project phases
  planning: colors.primary[500],
  design: '#6366F1',
  permits: colors.permit,
  construction: colors.constructionOrange,
  inspection: colors.visit,
  completion: colors.success,

  // Status indicators
  active: colors.success,
  pending: colors.warning,
  blocked: colors.error,
  draft: colors.gray[400],
  archived: colors.gray[500],

  // Priority levels
  urgent: colors.error,
  high: colors.constructionOrange,
  medium: colors.warning,
  low: colors.primary[400],

  // Financial
  income: colors.success,
  expense: colors.error,
  escrow: colors.escrow,
  refund: colors.warning,

  // User roles
  admin: colors.gray[900],
  pm: colors.kealeeBlue,
  contractor: colors.constructionOrange,
  homeowner: colors.primary[500],
  architect: '#6366F1',
  engineer: '#0891B2',
  inspector: '#7C3AED',
} as const;

export default moduleThemes;
```

---

## 📚 PART 5: DESIGN SYSTEM DOCUMENTATION

### File: `docs/DESIGN_SYSTEM_PACKAGE.md`

Complete design system package documentation with component specifications, usage examples, and development guidelines.

**Key Components:**
- Button, Input, Textarea, Card, Badge, Progress
- Modal, Toast, StepIndicator, Avatar, Loading, EmptyState

**Features:**
- ✅ WCAG 2.1 AA compliant
- ✅ Full TypeScript support
- ✅ Comprehensive testing
- ✅ Accessible components

### File: `docs/UX_UI_MASTER_SPECIFICATION.md`

Complete UX/UI specifications including:
- UX strategy and principles
- User flow specifications with timing targets
- Component library documentation
- App-specific UX/UI specs

**Key Flow Specs:**
- Project Creation: < 2 minutes, 5 clicks
- Permit Submission: < 3 minutes, 6 clicks
- Package Purchase: < 90 seconds, 4 clicks
- Request Design Quote: < 60 seconds, 3 clicks

---

## 🎯 MODULE-SPECIFIC THEMES

### Color Assignments by App

| App | Display Name | Primary Color | Accent Color |
|-----|-------------|---------------|--------------|
| m-marketplace | Kealee Marketplace | #1E40AF (Blue) | #F97316 (Orange) |
| m-project-owner | Project Owner Portal | #1E40AF (Blue) | #10B981 (Green) |
| m-ops-services | Contractor Services | #1E40AF (Blue) | #8B5CF6 (Purple) |
| m-architect | Design Services | #6366F1 (Indigo) | #F97316 (Orange) |
| m-engineer | Engineering Services | #0891B2 (Cyan) | #F97316 (Orange) |
| m-permits-inspections | Permits & Inspections | #7C3AED (Violet) | #10B981 (Green) |
| m-finance-trust | Finance & Trust | #059669 (Emerald) | #1E40AF (Blue) |
| m-inspector | Inspector Portal | #7C3AED (Violet) | #F59E0B (Warning) |
| os-pm | PM Workspace | #1E40AF (Blue) | #F97316 (Orange) |
| os-admin | Admin Console | #111827 (Dark) | #F97316 (Orange) |

---

## 🔧 CSS CUSTOM PROPERTIES

### Theme CSS Variables Available

```css
--theme-primary          /* Primary color for the module */
--theme-accent           /* Accent/secondary color */
--theme-bg-primary       /* Primary background color */
--theme-bg-secondary     /* Secondary background color */
--theme-text-primary     /* Primary text color */
--theme-text-secondary   /* Secondary text color */
--theme-border           /* Border color */
```

---

## 📐 RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

---

## ⚡ ANIMATION SYSTEM

### Duration Scale

- **fast**: 150ms - Quick interactions, hover states
- **normal**: 200ms - Standard transitions
- **slow**: 300ms - Modal appearances, major state changes
- **slower**: 500ms - Smooth entrance animations

### Easing Functions

- **linear**: No acceleration
- **in**: Ease in (accelerating from zero velocity)
- **out**: Ease out (decelerating to zero velocity)
- **inOut**: Ease in-out (accelerating then decelerating)

---

## ✅ USAGE GUIDE FOR FIGMA

### Importing to Figma

1. **Create Color Styles** from the color palette
   - Primary: Blue (50-900)
   - Secondary: Orange (50-700)
   - Semantic: Green, Yellow, Red (50-700)
   - Neutrals: Gray (50-900)

2. **Create Typography Styles**
   - Font Family: Inter (body), Plus Jakarta Sans (display), JetBrains Mono (mono)
   - Sizes: xs to 7xl
   - Weights: 100-900

3. **Create Component Styles**
   - Button (Primary, Secondary, Ghost, Danger)
   - Input with variants
   - Card with variants
   - Badge variants

4. **Create Grid & Layout Guides**
   - Base unit: 4px
   - Spacing scale: 1-24
   - Column grid: 12 columns

5. **Module Theme Variants**
   - Create separate color style groups per module
   - Link each app's components to its theme colors

---

## 📦 IMPLEMENTATION IN APPS

All apps should:

1. Install `@kealee/ui` package
2. Extend Tailwind config from `packages/ui/tailwind.config.js`
3. Import design tokens as needed
4. Use module themes for app-specific branding
5. Import pre-built components

---

**Design System Package Location:** `packages/ui/`
**Last Updated:** May 31, 2026
**Version:** Kealee Platform v20

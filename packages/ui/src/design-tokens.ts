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

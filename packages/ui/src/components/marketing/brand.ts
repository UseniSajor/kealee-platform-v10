// packages/ui/src/components/marketing/brand.ts
// Kealee Platform - Brand Design Tokens for Marketing Components

/**
 * Official Kealee Brand Colors
 * Per brand guidelines - no MBE Certified, no Zem Solutions
 */
export const brand = {
  // Primary Brand Colors
  navy: '#1A2B4A',           // Deep Navy - Primary
  orange: '#E8793A',         // Builder Orange - Secondary
  teal: '#2ABFBF',           // Accent Teal
  success: '#38A169',        // Success Green

  // Extended Palette
  navyLight: '#2A3D5F',
  navyDark: '#0F1A2E',
  orangeLight: '#F09A5A',
  orangeDark: '#C65A20',
  tealLight: '#4DD4D4',
  tealDark: '#1A8F8F',

  // Neutrals
  white: '#FFFFFF',
  cloud: '#F7FAFC',          // Light background
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },

  // Semantic Colors
  error: '#E53E3E',
  warning: '#DD6B20',
  info: '#3182CE',
} as const;

/**
 * App-specific accent colors for sidebar sections
 */
export const appAccents = {
  architect: brand.teal,           // Architecture & Design
  permits: '#38A169',              // Permits & Inspections (green)
  ops: brand.orange,               // Ops & PM Services
  projectOwner: brand.navy,        // Project Owner Portal
} as const;

/**
 * Typography
 * Clash Display for headlines, Plus Jakarta Sans for body, JetBrains Mono for pricing
 */
export const fonts = {
  display: '"Clash Display", "Plus Jakarta Sans", sans-serif',
  body: '"Plus Jakarta Sans", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;

/**
 * Shadow levels for elevation
 */
export const shadows = {
  level1: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  level2: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  level3: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  level4: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

/**
 * Animation variants for framer-motion
 */
export const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
} as const;

/**
 * Breakpoints
 */
export const breakpoints = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export default { brand, appAccents, fonts, shadows, animations, breakpoints };

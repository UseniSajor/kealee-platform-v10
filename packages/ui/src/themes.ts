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

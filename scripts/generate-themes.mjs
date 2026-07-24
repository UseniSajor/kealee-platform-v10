#!/usr/bin/env node
/**
 * STEP 3: Generate Module Themes
 * Creates theme CSS files for each application module
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('\n🎨 STEP 3: Module Theme Generation\n');

// Module theme definitions
const moduleThemes = {
  'm-architect': {
    primary: '#4f46e5',
    accent: '#f97316',
    name: 'Architect Module',
  },
  'm-marketplace': {
    primary: '#2563eb',
    accent: '#f97316',
    name: 'Marketplace Module',
  },
  'project-owner': {
    primary: '#2563eb',
    accent: '#10b981',
    name: 'Project Owner Module',
  },
  'm-engineer': {
    primary: '#0891b2',
    accent: '#f97316',
    name: 'Engineer Module',
  },
  'm-permits-inspections': {
    primary: '#7c3aed',
    accent: '#10b981',
    name: 'Permits & Inspections',
  },
  'm-finance-trust': {
    primary: '#2563eb',
    accent: '#2563eb',
    name: 'Finance & Trust',
  },
  'm-inspector': {
    primary: '#0891b2',
    accent: '#10b981',
    name: 'Inspector Module',
  },
  'os-pm': {
    primary: '#2563eb',
    accent: '#f97316',
    name: 'Project Management',
  },
  'os-admin': {
    primary: '#111827',
    accent: '#f97316',
    name: 'Admin Dashboard',
  },
};

// Generate themes
Object.entries(moduleThemes).forEach(([moduleKey, theme]) => {
  const appPath = path.join(projectRoot, 'apps', moduleKey);

  if (!fs.existsSync(appPath)) {
    console.log(`⏭️  Skipped ${moduleKey} (directory not found)`);
    return;
  }

  const stylesDir = path.join(appPath, 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }

  generateThemeFile(stylesDir, moduleKey, theme);
  console.log(`✅ Generated theme for ${moduleKey}`);
});

// Generate master theme file
generateMasterThemeFile();
console.log('✅ Generated master theme file');

// Generate theme type definitions
generateThemeTypes();
console.log('✅ Generated theme types');

console.log('\n✨ Module Themes Generated!');
console.log(`📁 ${Object.keys(moduleThemes).length} module themes created`);
console.log('📝 Theme files:');
Object.keys(moduleThemes).forEach(module => {
  console.log(`   • apps/${module}/styles/theme.css`);
});

function generateThemeFile(stylesDir, moduleKey, theme) {
  const filename = path.join(stylesDir, 'theme.css');

  const content = `/* Theme for ${theme.name} */
/* Module: ${moduleKey} */
/* Generated - DO NOT EDIT MANUALLY */

:root[data-module="${moduleKey}"] {
  /* Primary Color */
  --theme-primary: ${theme.primary};
  --theme-primary-light: ${adjustBrightness(theme.primary, 0.1)};
  --theme-primary-dark: ${adjustBrightness(theme.primary, -0.1)};

  /* Accent Color */
  --theme-accent: ${theme.accent};
  --theme-accent-light: ${adjustBrightness(theme.accent, 0.1)};
  --theme-accent-dark: ${adjustBrightness(theme.accent, -0.1)};

  /* Derived Colors */
  --theme-text-primary: var(--color-neutral-900);
  --theme-text-secondary: var(--color-neutral-600);
  --theme-background: var(--color-neutral-50);
  --theme-border: var(--color-neutral-200);
}

/* Button styles for this theme */
.btn-primary {
  background-color: var(--theme-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--theme-primary-dark);
}

/* Accent button styles */
.btn-accent {
  background-color: var(--theme-accent);
  color: white;
}

.btn-accent:hover {
  background-color: var(--theme-accent-dark);
}

/* Card styles */
.card {
  border-color: var(--theme-border);
  color: var(--theme-text-primary);
}

/* Navigation styles */
.nav-primary {
  background-color: var(--theme-primary);
  color: white;
}

.nav-accent {
  background-color: var(--theme-accent);
  color: white;
}

/* Link styles */
a {
  color: var(--theme-primary);
}

a:hover {
  color: var(--theme-primary-dark);
}

/* Badge styles */
.badge-primary {
  background-color: var(--theme-primary);
  color: white;
}

.badge-accent {
  background-color: var(--theme-accent);
  color: white;
}
`;

  fs.writeFileSync(filename, content);
}

function generateMasterThemeFile() {
  const themesPath = path.join(projectRoot, 'packages/ui/src/themes.ts');

  const themeDefinitions = Object.entries(moduleThemes).map(
    ([key, theme]) => `  '${key}': { primary: '${theme.primary}', accent: '${theme.accent}', name: '${theme.name}' }`
  ).join(',\n');

  const content = `// Master theme definitions
// All module themes defined in one place

export const themes = {
${themeDefinitions}
} as const;

export type ThemeKey = keyof typeof themes;

export function getThemeByModule(moduleKey: string) {
  return themes[moduleKey as ThemeKey] || themes['os-admin'];
}

export function applyTheme(moduleKey: string) {
  const root = document.documentElement;
  root.setAttribute('data-module', moduleKey);
}
`;

  fs.writeFileSync(themesPath, content);
}

function generateThemeTypes() {
  const typesPath = path.join(projectRoot, 'packages/ui/src/theme-types.ts');

  const content = `// Theme type definitions

export interface ThemeDefinition {
  primary: string;
  accent: string;
  name: string;
}

export type ThemeKey =
  | 'm-architect'
  | 'm-marketplace'
  | 'project-owner'
  | 'm-engineer'
  | 'm-permits-inspections'
  | 'm-finance-trust'
  | 'm-inspector'
  | 'os-pm'
  | 'os-admin';

export interface ThemeCSS {
  '--theme-primary': string;
  '--theme-primary-light': string;
  '--theme-primary-dark': string;
  '--theme-accent': string;
  '--theme-accent-light': string;
  '--theme-accent-dark': string;
  '--theme-text-primary': string;
  '--theme-text-secondary': string;
  '--theme-background': string;
  '--theme-border': string;
}
`;

  fs.writeFileSync(typesPath, content);
}

function adjustBrightness(hex, percent) {
  // Simple brightness adjustment for theme colors
  // In production, use a proper color library
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;

  return '#' + (
    0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

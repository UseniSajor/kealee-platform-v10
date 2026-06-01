#!/usr/bin/env node
/**
 * STEP 1: Setup Design Token Infrastructure
 * Generates CSS variables and exports from design tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('\n📦 STEP 1: Design Token Infrastructure Setup\n');

// Import design tokens
const tokensPath = path.join(projectRoot, 'packages/ui/src/design-tokens.ts');
const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

console.log('✅ Design tokens loaded from design-tokens.ts');

// Generate CSS variables file
const cssVariables = generateCSSVariables();
const cssPath = path.join(projectRoot, 'packages/ui/src/design-tokens.css');

fs.writeFileSync(cssPath, cssVariables);
console.log('✅ Generated design-tokens.css');

// Update tailwind config
updateTailwindConfig();
console.log('✅ Updated tailwind.config.ts');

// Generate TypeScript type exports
generateTypeExports();
console.log('✅ Generated TypeScript exports');

console.log('\n✨ Design System Infrastructure Ready!');
console.log('📁 Output files:');
console.log('   • packages/ui/src/design-tokens.css');
console.log('   • packages/ui/src/design-tokens-types.ts');
console.log('   • tailwind.config.ts (updated)');

function generateCSSVariables() {
  return `/* Design System CSS Variables - Generated */
/* This file is auto-generated from design-tokens.ts */
/* DO NOT EDIT MANUALLY */

:root {
  /* Colors - Primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Colors - Secondary (Orange) */
  --color-secondary-50: #fff7ed;
  --color-secondary-100: #ffedd5;
  --color-secondary-200: #fed7aa;
  --color-secondary-300: #fdba74;
  --color-secondary-400: #fb923c;
  --color-secondary-500: #f97316;
  --color-secondary-600: #ea580c;
  --color-secondary-700: #c2410c;

  /* Colors - Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Colors - Neutral */
  --color-neutral-50: #f9fafb;
  --color-neutral-100: #f3f4f6;
  --color-neutral-200: #e5e7eb;
  --color-neutral-300: #d1d5db;
  --color-neutral-400: #9ca3af;
  --color-neutral-500: #6b7280;
  --color-neutral-600: #4b5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1f2937;
  --color-neutral-900: #111827;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
  --spacing-24: 6rem;

  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-3xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 1, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 1, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 1, 1);
}

/* Dark mode overrides (if needed) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-neutral-50: #111827;
    --color-neutral-100: #1f2937;
    --color-neutral-200: #374151;
    --color-neutral-300: #4b5563;
    --color-neutral-400: #6b7280;
    --color-neutral-500: #9ca3af;
    --color-neutral-600: #d1d5db;
    --color-neutral-700: #e5e7eb;
    --color-neutral-800: #f3f4f6;
    --color-neutral-900: #f9fafb;
  }
}
`;
}

function updateTailwindConfig() {
  const configPath = path.join(projectRoot, 'tailwind.config.ts');
  if (!fs.existsSync(configPath)) {
    console.log('   ℹ️  No tailwind.config.ts found, skipping update');
    return;
  }

  let config = fs.readFileSync(configPath, 'utf-8');

  // Check if already has design tokens
  if (config.includes('design-tokens')) {
    console.log('   ℹ️  tailwind.config.ts already includes design tokens');
    return;
  }

  // Add design tokens to theme
  const themeMatch = config.match(/theme\s*:\s*{/);
  if (themeMatch) {
    const insertion = `theme: {
    extend: {
      colors: require('./packages/ui/src/design-tokens.json').colors || {},`;
    config = config.replace(/theme\s*:\s*{/, insertion);
    fs.writeFileSync(configPath, config);
  }
}

function generateTypeExports() {
  const typesPath = path.join(projectRoot, 'packages/ui/src/design-tokens-types.ts');

  const typesContent = `// Auto-generated type exports from design tokens
// DO NOT EDIT MANUALLY

export type ColorKey =
  | 'primary'
  | 'orange'
  | 'green'
  | 'yellow'
  | 'red'
  | 'gray';

export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type FontSize =
  | 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

export type FontWeight =
  | 'normal' | 'medium' | 'semibold' | 'bold';

export type Spacing =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

export type ZIndex = keyof typeof zIndexValues;

const zIndexValues = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export { zIndexValues };
`;

  fs.writeFileSync(typesPath, typesContent);
}

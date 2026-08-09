/**
 * Theme Utilities
 * Functions for applying and managing themes across the application
 */

import { themes, type ThemeKey } from './themes';

/**
 * Apply theme to the document root
 * Sets data-module attribute for CSS theme switching
 */
export function applyTheme(themeKey: ThemeKey): void {
  const theme = themes[themeKey];
  if (!theme) {
    console.warn(`Theme not found: ${themeKey}`);
    return;
  }

  // Set data attribute on root for CSS theming
  document.documentElement.setAttribute('data-module', themeKey);

  // Apply CSS variables for runtime theming
  const root = document.documentElement.style;
  root.setProperty('--theme-primary', theme.primary);
  root.setProperty('--theme-accent', theme.accent);

  // Store current theme in localStorage
  try {
    localStorage.setItem('kealee-theme', themeKey);
  } catch (e) {
    console.warn('Failed to save theme preference:', e);
  }
}

/**
 * Get theme by module key
 */
export function getThemeByModule(moduleKey: string): (typeof themes)[ThemeKey] {
  const theme = themes[moduleKey as ThemeKey];
  return theme || themes['os-admin']; // Fallback to admin theme
}

/**
 * Get current theme from document
 */
export function getCurrentTheme(): ThemeKey {
  if (typeof document === 'undefined') {
    return 'm-marketplace'; // Server-side fallback
  }

  const module = document.documentElement.getAttribute('data-module');
  return (module as ThemeKey) || 'm-marketplace';
}

/**
 * Load theme from localStorage
 */
export function loadSavedTheme(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const saved = localStorage.getItem('kealee-theme');
    if (saved && saved in themes) {
      applyTheme(saved as ThemeKey);
    }
  } catch (e) {
    console.warn('Failed to load saved theme:', e);
  }
}

/**
 * Get contrasting text color for a background color
 */
export function getTextColor(bgColor: string): 'white' | 'black' {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return contrasting color
  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Get all available themes
 */
export function getAllThemes() {
  return Object.entries(themes).map(([key, theme]) => ({
    key: key as ThemeKey,
    ...theme,
  }));
}

/**
 * Initialize theme system
 */
export function initializeThemeSystem(): void {
  // Load saved theme or apply default
  loadSavedTheme();

  // Watch for theme changes
  const observer = new MutationObserver(() => {
    const current = document.documentElement.getAttribute('data-module');
    if (current && current in themes) {
      const theme = getThemeByModule(current);
      document.documentElement.style.setProperty('--theme-primary', theme.primary);
      document.documentElement.style.setProperty('--theme-accent', theme.accent);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-module'],
  });

  // Initial setup
  const currentTheme = getCurrentTheme();
  const theme = getThemeByModule(currentTheme);
  document.documentElement.style.setProperty('--theme-primary', theme.primary);
  document.documentElement.style.setProperty('--theme-accent', theme.accent);
}

export default {
  applyTheme,
  getThemeByModule,
  getCurrentTheme,
  loadSavedTheme,
  getTextColor,
  getAllThemes,
  initializeThemeSystem,
};

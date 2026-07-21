// Master theme definitions
// All module themes defined in one place

export const themes = {
  'm-architect': { primary: '#4f46e5', accent: '#f97316', name: 'Architect Module' },
  'm-marketplace': { primary: '#2563eb', accent: '#f97316', name: 'Marketplace Module' },
  'm-project-owner': { primary: '#2563eb', accent: '#10b981', name: 'Project Owner Module' },
  'm-engineer': { primary: '#0891b2', accent: '#f97316', name: 'Engineer Module' },
  'm-permits-inspections': { primary: '#7c3aed', accent: '#10b981', name: 'Permits & Inspections' },
  'm-finance-trust': { primary: '#2563eb', accent: '#2563eb', name: 'Finance & Trust' },
  'm-inspector': { primary: '#0891b2', accent: '#10b981', name: 'Inspector Module' },
  'os-pm': { primary: '#2563eb', accent: '#f97316', name: 'Project Management' },
  'os-admin': { primary: '#111827', accent: '#f97316', name: 'Admin Dashboard' }
} as const;

export type ThemeKey = keyof typeof themes;
export type ModuleTheme = { primary: string; accent: string; name: string };

export function getThemeByModule(moduleKey: string): ModuleTheme {
  return themes[moduleKey as ThemeKey] || themes['os-admin'];
}

export function getThemeCSSVariables(theme: ModuleTheme): Record<string, string> {
  return {
    '--color-primary': theme.primary,
    '--color-accent': theme.accent,
  };
}

export function applyTheme(moduleKey: string) {
  const root = document.documentElement;
  root.setAttribute('data-module', moduleKey);
}

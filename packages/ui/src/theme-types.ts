// Theme type definitions

export interface ThemeDefinition {
  primary: string;
  accent: string;
  name: string;
}

export type ThemeKey =
  | 'm-architect'
  | 'm-marketplace'
  | 'm-project-owner'
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

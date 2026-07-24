/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1A2B4A', light: '#2A3D5F', dark: '#0F1A2E' },
        'builder-orange': { DEFAULT: '#E8793A', light: '#F09A5A', dark: '#C65A20' },
        teal: { DEFAULT: '#2ABFBF', light: '#4DD4D4', dark: '#1A8F8F' },
      },
      fontFamily: {
        display: ['"Clash Display"', '"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

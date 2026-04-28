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
        'builder-orange': { DEFAULT: '#C8521A', light: '#E8793A', dark: '#A83E10' },
        teal: { DEFAULT: '#2ABFBF', light: '#4DD4D4', dark: '#1A8F8F' },
        warm: {
          '50':  '#FFFBF5',
          '100': '#FFF8F0',
          '150': '#FFF5E8',
        },
      },
      fontFamily: {
        display: ['Syne', '"Clash Display"', 'sans-serif'],
        body:    ['"DM Sans"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

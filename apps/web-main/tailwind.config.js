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
        'kealee-primary': '#FFB366',
        'kealee-primary-hover': '#FF8C22',
        'kealee-brown': '#B69574',
        'kealee-tan': '#E9D7C1',
        'kealee-gray': '#666666',
        'kealee-sky': '#7EC6F4',
        'kealee-light-gray': '#F5F5F5',
        charcoal: '#1F252A',
        copper: '#C38B5F',
        'deep-blue': '#2E5090',
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
        display: ['var(--font-nunito-display)', 'sans-serif'],
        body:    ['var(--font-nunito-body)', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        'home-serif': ['var(--font-home-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
        'home-sans': ['var(--font-home-sans)', 'Barlow', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

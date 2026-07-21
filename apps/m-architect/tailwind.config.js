// apps/m-architect/tailwind.config.js
const uiConfig = require('../../packages/ui/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...uiConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};

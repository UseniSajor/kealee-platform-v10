// packages/ui/.storybook/preview.ts
// Storybook Preview Configuration with Kealee Design System

import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FFFFFF' },
        { name: 'gray', value: '#F9FAFB' },
        { name: 'navy', value: '#1A2B4A' },
        { name: 'orange', value: '#E8793A' },
        { name: 'teal', value: '#2ABFBF' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        wide: {
          name: 'Wide Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    layout: 'centered',
    docs: {
      toc: true,
    },
  },
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;

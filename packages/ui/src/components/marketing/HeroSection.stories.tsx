// packages/ui/src/components/marketing/HeroSection.stories.tsx
// Storybook Stories for HeroSection Component

import type { Meta, StoryObj } from '@storybook/react';
import { HeroSection } from './HeroSection';

const meta: Meta<typeof HeroSection> = {
  title: 'Marketing/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Hero section component for marketing landing pages. Supports eyebrow badges, headlines, CTAs, and trust indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrowColor: {
      control: 'select',
      options: ['navy', 'orange', 'teal', 'green'],
      description: 'Color theme for the eyebrow badge',
    },
    bgPattern: {
      control: 'select',
      options: ['none', 'dots', 'grid'],
      description: 'Background pattern style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeroSection>;

// Default Hero
export const Default: Story = {
  args: {
    eyebrow: 'Kealee Platform',
    eyebrowColor: 'teal',
    headline: 'Build Better, Build Smarter',
    subheadline:
      'The end-to-end construction platform for the DC-Baltimore corridor. From permits to project completion.',
    ctas: [
      { label: 'Get Started', variant: 'primary', href: '/signup' },
      { label: 'Learn More', variant: 'outline', href: '/about' },
    ],
    trustItems: [
      '3,000+ jurisdictions supported',
      '85% first-try approval rate',
      '$50M+ projects managed',
    ],
    bgPattern: 'none',
  },
};

// Permits Hero
export const PermitsHero: Story = {
  args: {
    eyebrow: 'TurboTax for Building Permits',
    eyebrowColor: 'green',
    headline: 'Get Permits Approved, Not Rejected',
    subheadline:
      'AI reviews your application in 5 minutes and catches common errors before submission. No more back-and-forth with permit offices.',
    ctas: [
      { label: 'Start Application', variant: 'primary', href: '/permits/new' },
      { label: 'See How It Works', variant: 'ghost', href: '#comparison' },
    ],
    trustItems: [
      '85% first-try approval rate',
      '3,000+ jurisdictions',
      'Money-back guarantee',
    ],
    bgPattern: 'dots',
  },
};

// Architect Hero
export const ArchitectHero: Story = {
  args: {
    eyebrow: 'For Design Professionals',
    eyebrowColor: 'teal',
    headline: 'Design Projects Done Right',
    subheadline:
      'The only design platform built for architects working in construction. Manage phases, deliverables, client reviews, and seamlessly hand off to permits.',
    ctas: [
      { label: 'Start Design Project', variant: 'primary', href: '/projects/new' },
      { label: 'View Demo', variant: 'outline', href: '/demo' },
    ],
    trustItems: [
      'Free for architects',
      '3% platform fee on projects',
      'Seamless permit integration',
    ],
  },
};

// Ops Services Hero
export const OpsServicesHero: Story = {
  args: {
    eyebrow: 'Operations & PM Services',
    eyebrowColor: 'orange',
    headline: 'Project Management, Your Way',
    subheadline:
      'Choose software to manage your own projects, or let our experts handle everything. PM Software + Professional Services.',
    ctas: [
      { label: 'Explore PM Software', variant: 'primary', href: '#software' },
      { label: 'View Services', variant: 'outline', href: '#services' },
    ],
    trustItems: [
      'From $99/month',
      'No long-term contracts',
      '24/7 support available',
    ],
    bgPattern: 'grid',
  },
};

// Minimal Hero (no extras)
export const Minimal: Story = {
  args: {
    headline: 'Simple, Powerful, Effective',
    subheadline: 'Get started in minutes with our intuitive platform.',
    ctas: [{ label: 'Get Started Free', variant: 'primary', href: '/signup' }],
  },
};

// Dark Background Hero
export const WithGridPattern: Story = {
  args: {
    eyebrow: 'New Feature',
    eyebrowColor: 'orange',
    headline: 'Introducing AI-Powered Reviews',
    subheadline:
      'Our new AI system reviews your permit applications in under 5 minutes, catching errors before they cause delays.',
    ctas: [
      { label: 'Try It Now', variant: 'primary', href: '/try' },
      { label: 'Learn More', variant: 'ghost', href: '/ai' },
    ],
    bgPattern: 'grid',
  },
};

// packages/ui/src/components/marketing/PricingTierCard.stories.tsx
// Storybook Stories for PricingTierCard Component

import type { Meta, StoryObj } from '@storybook/react';
import { PricingTierCard } from './PricingTierCard';

const meta: Meta<typeof PricingTierCard> = {
  title: 'Marketing/PricingTierCard',
  component: PricingTierCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Pricing tier card component for displaying subscription plans and service packages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    accentColor: {
      control: 'select',
      options: ['orange', 'teal', 'green', 'navy'],
      description: 'Accent color for the popular badge and CTA',
    },
    darkMode: {
      control: 'boolean',
      description: 'Enable dark mode styling',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PricingTierCard>;

// Standard Tier
export const Standard: Story = {
  args: {
    tier: {
      name: 'Professional',
      price: 249,
      period: '/month',
      popular: false,
      description: 'For growing construction firms',
      features: [
        '25 active projects',
        'Advanced scheduling',
        'Budget tracking',
        'Subcontractor portal',
        'Phone support',
      ],
      cta: { label: 'Start Trial', href: '/signup' },
    },
    accentColor: 'orange',
  },
};

// Popular Tier
export const Popular: Story = {
  args: {
    tier: {
      name: 'Business',
      price: 499,
      period: '/month',
      popular: true,
      description: 'Most popular for established contractors',
      features: [
        'Unlimited projects',
        'Resource management',
        'Custom reports',
        'API access',
        'Priority support',
        'Dedicated success manager',
      ],
      cta: { label: 'Start Trial', href: '/signup' },
    },
    accentColor: 'orange',
  },
};

// Free Tier
export const FreeTier: Story = {
  args: {
    tier: {
      name: 'Free',
      price: 0,
      period: 'forever',
      popular: false,
      description: 'For individual professionals getting started',
      features: [
        'Up to 3 active projects',
        'Basic deliverable tracking',
        'Client review portal',
        'Email support',
      ],
      cta: { label: 'Get Started', href: '/signup' },
    },
    accentColor: 'teal',
  },
};

// Enterprise Tier (Custom Pricing)
export const Enterprise: Story = {
  args: {
    tier: {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      popular: false,
      description: 'For large organizations with custom needs',
      features: [
        'Everything in Business',
        'Multi-team support',
        'SSO integration',
        'Custom integrations',
        'SLA guarantee',
        '24/7 premium support',
      ],
      cta: { label: 'Contact Sales', href: '/contact' },
    },
    accentColor: 'navy',
  },
};

// Permit Package
export const PermitPackage: Story = {
  args: {
    tier: {
      name: 'Standard',
      price: 1500,
      period: 'per permit',
      popular: true,
      description: 'Most popular for residential projects',
      features: [
        'AI application review',
        'Permit specialist review',
        'Corrections handling',
        'Inspection scheduling',
        'Phone support',
        'Resubmission included',
      ],
      cta: { label: 'Get Started', href: '/permits/new' },
    },
    accentColor: 'green',
  },
};

// Dark Mode
export const DarkMode: Story = {
  args: {
    tier: {
      name: 'Professional',
      price: '3%',
      period: 'of project value',
      popular: true,
      description: 'For architects with active client projects',
      features: [
        'Unlimited projects',
        'Advanced phase management',
        'Team collaboration',
        'Permit integration',
        'Payment processing',
      ],
      cta: { label: 'Get Started', href: '/signup' },
    },
    accentColor: 'teal',
    darkMode: true,
  },
  parameters: {
    backgrounds: { default: 'navy' },
  },
};

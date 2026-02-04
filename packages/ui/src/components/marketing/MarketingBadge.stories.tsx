// packages/ui/src/components/marketing/MarketingBadge.stories.tsx
// Storybook Stories for MarketingBadge Component

import type { Meta, StoryObj } from '@storybook/react';
import { MarketingBadge } from './MarketingBadge';

const meta: Meta<typeof MarketingBadge> = {
  title: 'Marketing/MarketingBadge',
  component: MarketingBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Badge component for marketing pages. Used for eyebrows, labels, and status indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['navy', 'orange', 'teal', 'green'],
      description: 'Color theme for the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outline'],
      description: 'Visual style variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarketingBadge>;

// Default Badge
export const Default: Story = {
  args: {
    text: 'New Feature',
    color: 'orange',
    size: 'md',
    variant: 'soft',
  },
};

// All Colors
export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <MarketingBadge text="Navy" color="navy" />
      <MarketingBadge text="Orange" color="orange" />
      <MarketingBadge text="Teal" color="teal" />
      <MarketingBadge text="Green" color="green" />
    </div>
  ),
};

// All Sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <MarketingBadge text="Small" size="sm" color="orange" />
      <MarketingBadge text="Medium" size="md" color="orange" />
      <MarketingBadge text="Large" size="lg" color="orange" />
    </div>
  ),
};

// All Variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <MarketingBadge text="Solid" variant="solid" color="orange" />
      <MarketingBadge text="Soft" variant="soft" color="orange" />
      <MarketingBadge text="Outline" variant="outline" color="orange" />
    </div>
  ),
};

// Use Cases
export const UseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <MarketingBadge text="Most Popular" color="orange" variant="solid" />
        <span className="text-sm text-gray-500">- Pricing highlight</span>
      </div>
      <div className="flex items-center gap-2">
        <MarketingBadge text="TurboTax for Permits" color="green" variant="soft" />
        <span className="text-sm text-gray-500">- Hero eyebrow</span>
      </div>
      <div className="flex items-center gap-2">
        <MarketingBadge text="Operations" color="teal" variant="soft" />
        <span className="text-sm text-gray-500">- Category label</span>
      </div>
      <div className="flex items-center gap-2">
        <MarketingBadge text="Coming Soon" color="navy" variant="outline" />
        <span className="text-sm text-gray-500">- Status indicator</span>
      </div>
    </div>
  ),
};

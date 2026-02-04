// packages/ui/src/components/marketing/ServiceCard.stories.tsx
// Storybook Stories for ServiceCard Component

import type { Meta, StoryObj } from '@storybook/react';
import { ServiceCard } from './ServiceCard';

const meta: Meta<typeof ServiceCard> = {
  title: 'Marketing/ServiceCard',
  component: ServiceCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Service card component for displaying operations and estimation services with pricing.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '350px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ServiceCard>;

// Operations Service
export const OperationsService: Story = {
  args: {
    service: {
      name: 'Site Analysis Report',
      description:
        'Comprehensive site assessment documenting existing conditions, constraints, and opportunities.',
      price: 125,
      priceUnit: '',
      href: '/services/site-analysis',
    },
  },
};

// Estimation Service
export const EstimationService: Story = {
  args: {
    service: {
      name: 'Detailed Construction Estimate',
      description:
        'Line-item estimate with quantities, unit costs, and labor breakdown from design drawings.',
      price: 595,
      priceUnit: 'from',
      href: '/services/detailed-estimate',
    },
  },
};

// Premium Service
export const PremiumService: Story = {
  args: {
    service: {
      name: 'Project Feasibility Analysis',
      description:
        'Comprehensive financial analysis including cost estimate, timeline, and ROI projections.',
      price: 695,
      priceUnit: '',
      href: '/services/feasibility-analysis',
    },
  },
};

// Budget Service
export const BudgetService: Story = {
  args: {
    service: {
      name: 'Permit Requirements Research',
      description:
        'Research and documentation of all permit requirements for your specific project and jurisdiction.',
      price: 95,
      priceUnit: '',
      href: '/services/permit-research',
    },
  },
};

// With Icon
export const WithCategory: Story = {
  args: {
    service: {
      name: 'Contractor Vetting & Verification',
      description:
        'Background verification, license check, and reference validation for potential contractors.',
      price: 175,
      priceUnit: '',
      category: 'Operations',
      href: '/services/contractor-vetting',
    },
  },
};

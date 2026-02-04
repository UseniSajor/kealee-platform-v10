// packages/ui/src/components/auth/RegisterForm.stories.tsx
// Storybook Stories for RegisterForm Component

import type { Meta, StoryObj } from '@storybook/react';
import { RegisterForm } from './RegisterForm';

const meta: Meta<typeof RegisterForm> = {
  title: 'Auth/RegisterForm',
  component: RegisterForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Registration form component with role selection (Homeowner, GC/Builder, Owner/Developer, Specialty Contractor, Architect, Engineer) followed by account details.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RegisterForm>;

// Default Register Form
export const Default: Story = {
  args: {
    loginUrl: '/login',
  },
};

// With Submit Handler
export const WithSubmitHandler: Story = {
  args: {
    loginUrl: '/login',
    onSubmit: async (data) => {
      console.log('Registration submitted:', data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(`Registration attempted for: ${data.email} as ${data.role}`);
    },
  },
};

// Custom Login URL
export const CustomLoginURL: Story = {
  args: {
    loginUrl: '/auth/signin',
  },
};

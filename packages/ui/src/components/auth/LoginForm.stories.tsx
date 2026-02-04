// packages/ui/src/components/auth/LoginForm.stories.tsx
// Storybook Stories for LoginForm Component

import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Login form component with email/password authentication and social login options (Google, Apple).',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

// Default Login Form
export const Default: Story = {
  args: {
    signupUrl: '/signup',
    forgotPasswordUrl: '/forgot-password',
  },
};

// With Custom URLs
export const CustomURLs: Story = {
  args: {
    signupUrl: '/auth/register',
    forgotPasswordUrl: '/auth/forgot',
    redirectUrl: '/dashboard',
  },
};

// With Submit Handler
export const WithSubmitHandler: Story = {
  args: {
    signupUrl: '/signup',
    forgotPasswordUrl: '/forgot-password',
    onSubmit: async (data) => {
      console.log('Login submitted:', data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(`Login attempted with email: ${data.email}`);
    },
  },
};

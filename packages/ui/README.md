# @kealee/ui

Kealee Platform Design System - Shared UI Component Library

A comprehensive, accessible, and fully-typed component library for consistent UX/UI across all Kealee Platform applications.

## Installation

```bash
npm install @kealee/ui
# or
pnpm add @kealee/ui
# or
yarn add @kealee/ui
```

## Components

### Button

Primary action component with multiple variants and sizes.

```tsx
import { Button } from '@kealee/ui';

<Button variant="primary" size="lg">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Delete</Button>
```

### Input

Form input with validation states and helper text.

```tsx
import { Input } from '@kealee/ui';

<Input
  label="Email"
  type="email"
  required
  error="Invalid email"
  helperText="Enter your email address"
/>
```

### Textarea

Multi-line text input with validation.

```tsx
import { Textarea } from '@kealee/ui';

<Textarea
  label="Description"
  rows={4}
  error="Required field"
/>
```

### Card

Container component with variants.

```tsx
import { Card } from '@kealee/ui';

<Card variant="elevated" hover>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

### Badge

Status indicators and labels.

```tsx
import { Badge } from '@kealee/ui';

<Badge variant="success">Active</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="warning">Pending</Badge>
```

### Progress

Progress indicators with variants.

```tsx
import { Progress } from '@kealee/ui';

<Progress value={75} variant="success" showLabel />
<Progress value={50} size="lg" animated />
```

### Modal

Dialog and popup system.

```tsx
import { Modal } from '@kealee/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure?</p>
</Modal>
```

### Toast

Notification system.

```tsx
import { Toast } from '@kealee/ui';

<Toast
  type="success"
  title="Success!"
  message="Your action was completed"
  onClose={() => {}}
/>
```

### Avatar

User profile pictures and initials.

```tsx
import { Avatar } from '@kealee/ui';

<Avatar src="/user.jpg" alt="John Doe" />
<Avatar fallback="John Doe" status="online" />
<Avatar size="lg" shape="square" />
```

### Loading

Loading states and spinners.

```tsx
import { Loading } from '@kealee/ui';

<Loading />
<Loading variant="dots" text="Loading..." />
<Loading fullScreen />
```

### EmptyState

Empty state screens with actions.

```tsx
import { EmptyState } from '@kealee/ui';

<EmptyState
  icon={<FolderOpen size={48} />}
  title="No projects yet"
  description="Get started by creating your first project"
  action={{ label: "Create Project", onClick: handleCreate }}
/>
```

### StepIndicator

Multi-step progress indicator.

```tsx
import { StepIndicator } from '@kealee/ui';

const steps = [
  { id: '1', title: 'Step 1', subtitle: 'Description' },
  { id: '2', title: 'Step 2', subtitle: 'Description' },
];

<StepIndicator steps={steps} currentStep={0} />
```

## Design Tokens

Access design tokens for consistent styling.

```tsx
import { colors, typography, spacing } from '@kealee/ui';

// Use in your styles
const style = {
  color: colors.primary[600],
  fontSize: typography.fontSize.lg,
  padding: spacing[4],
};
```

## Tailwind Configuration

Extend the shared Tailwind config in your app:

```js
// tailwind.config.js
const uiConfig = require('@kealee/ui/tailwind.config');

module.exports = {
  ...uiConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

## Features

- ✅ **Fully Typed**: Complete TypeScript support
- ✅ **Accessible**: WCAG 2.1 AA compliant
- ✅ **Responsive**: Mobile-first design
- ✅ **Documented**: JSDoc comments for all components
- ✅ **Tested**: Comprehensive unit tests
- ✅ **Consistent**: Shared design tokens

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Watch mode
pnpm dev
```

## License

MIT

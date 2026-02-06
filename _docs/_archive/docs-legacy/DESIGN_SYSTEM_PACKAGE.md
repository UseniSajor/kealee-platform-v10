# Design System Package Documentation

Complete documentation for the `@kealee/ui` shared design system package.

## Package Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Progress.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── Avatar.tsx
│   │   ├── Loading.tsx
│   │   └── EmptyState.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── design-tokens.ts
│   └── index.ts
├── __tests__/
│   ├── components/
│   │   ├── Avatar.test.tsx
│   │   ├── Loading.test.tsx
│   │   └── EmptyState.test.tsx
│   └── setup.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Components

### Core Components

1. **Button** - Primary action component
   - Variants: primary, secondary, ghost, danger
   - Sizes: sm, md, lg
   - States: loading, disabled
   - Icons: left, right

2. **Input** - Form input field
   - Validation states: error, success
   - Helper text support
   - Icon support
   - Required field indicator

3. **Textarea** - Multi-line input
   - Same features as Input
   - Resizable option

4. **Card** - Container component
   - Variants: default, interactive, elevated
   - Hover effects
   - Padding options

5. **Badge** - Status indicators
   - Variants: default, primary, success, warning, error, info
   - Sizes: default, lg

6. **Progress** - Progress indicators
   - Variants: default, primary, success, warning, error
   - Sizes: sm, md, lg
   - Animated option
   - Label support

7. **Modal** - Dialog system
   - Backdrop blur
   - Keyboard navigation (Escape)
   - Size variants
   - Close button

8. **Toast** - Notification system
   - Types: success, error, warning, info
   - Auto-dismiss
   - Action buttons

9. **StepIndicator** - Multi-step progress
   - Visual step circles
   - Connector lines
   - Status: completed, current, upcoming

10. **Avatar** - User profile pictures
    - Image or initials fallback
    - Status indicators
    - Sizes: sm, md, lg, xl
    - Shapes: circle, square

11. **Loading** - Loading states
    - Variants: spinner, dots, pulse
    - Sizes: sm, md, lg
    - Full screen option
    - Custom text

12. **EmptyState** - Empty state screens
    - Icon support
    - Title and description
    - Primary and secondary actions

## Design Tokens

All design tokens are exported from `design-tokens.ts`:

- **Colors**: Primary, secondary, semantic colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: 4px base unit scale
- **Border Radius**: Consistent rounded corners
- **Shadows**: Elevation system
- **Z-Index**: Layering system
- **Breakpoints**: Responsive breakpoints
- **Durations**: Animation timings
- **Easing**: Motion curves

## Usage

### Installation

```bash
npm install @kealee/ui
```

### Basic Usage

```tsx
import { Button, Input, Card } from '@kealee/ui';

function MyComponent() {
  return (
    <Card>
      <Input label="Email" type="email" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

### Using Design Tokens

```tsx
import { colors, spacing } from '@kealee/ui';

const style = {
  backgroundColor: colors.primary[600],
  padding: spacing[4],
};
```

### Tailwind Configuration

Extend the shared config:

```js
// tailwind.config.js
const uiConfig = require('@kealee/ui/tailwind.config');

module.exports = {
  ...uiConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
  ],
};
```

## Accessibility

All components are WCAG 2.1 AA compliant:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Focus management
- ✅ Color contrast

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Lint
npm run lint
```

## Contributing

When adding new components:

1. Create component file in `src/components/`
2. Add TypeScript types
3. Add JSDoc comments
4. Make it accessible
5. Add unit tests
6. Export from `src/index.ts`
7. Update README.md

## License

MIT

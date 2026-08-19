# Error Handling Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies

For each app, add to `package.json`:

```json
{
  "dependencies": {
    "@kealee/ui": "workspace:*",
    "sonner": "^1.0.0"
  }
}
```

Then run:
```bash
pnpm install
```

### 2. Update Layout

Add ErrorBoundary and Toaster to your app's `layout.tsx`:

```tsx
import { ErrorBoundary } from '@kealee/ui'
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
          <Toaster position="top-right" />
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### 3. Use Enhanced API Client

Replace existing API calls:

```tsx
// Before
const response = await fetch('/api/endpoint')
const data = await response.json()

// After
import { apiRequest, handleApiError } from '@kealee/ui'

try {
  const data = await apiRequest('/api/endpoint', {
    retries: 3,
    retryDelay: 1000,
  })
} catch (error) {
  handleApiError(error) // Shows toast automatically
}
```

### 4. Add Loading States

```tsx
import { LoadingSpinner, ButtonLoading } from '@kealee/ui'

// In component
{isLoading ? <LoadingSpinner /> : <Content />}

// In button
<ButtonLoading loading={isSubmitting}>Submit</ButtonLoading>
```

### 5. Add Form Validation

```tsx
import { validateForm, getFieldError, commonSchemas } from '@kealee/ui'
import { z } from 'zod'

const schema = z.object({
  email: commonSchemas.email,
  name: commonSchemas.nonEmptyString,
})

const handleSubmit = (data) => {
  const result = validateForm(schema, data)
  if (!result.success) {
    // Show field errors
    return
  }
  // Submit valid data
}
```

## ✅ Checklist

- [ ] Install @kealee/ui and sonner
- [ ] Add ErrorBoundary to layout
- [ ] Add Toaster to layout
- [ ] Replace fetch with apiRequest
- [ ] Add loading states to async operations
- [ ] Add form validation
- [ ] Test error scenarios

## 🎯 Done!

Your app now has comprehensive error handling!

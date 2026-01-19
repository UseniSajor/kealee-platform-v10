# @kealee/ui

Shared UI components and utilities for all Kealee apps.

## Installation

```bash
pnpm add @kealee/ui sonner
```

## Components

### ErrorBoundary

Catches React rendering errors and displays user-friendly error UI.

```tsx
import { ErrorBoundary } from '@kealee/ui'

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

### Loading States

```tsx
import { LoadingSpinner, PageLoading, ButtonLoading, Skeleton } from '@kealee/ui'

<LoadingSpinner size="md" />
<PageLoading message="Loading..." />
<ButtonLoading loading={isLoading}>Submit</ButtonLoading>
<Skeleton lines={3} />
```

## Utilities

### API Client

Enhanced fetch wrapper with retry logic and error handling.

```tsx
import { apiRequest, handleApiError } from '@kealee/ui'

try {
  const data = await apiRequest('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify({ ... }),
    retries: 3,
  })
} catch (error) {
  handleApiError(error)
}
```

### Toast Notifications

```tsx
import { toastSuccess, toastError, toastWarning, toastInfo } from '@kealee/ui'

toastSuccess('Success!')
toastError('Error occurred')
toastWarning('Warning')
toastInfo('Info')
```

### Form Validation

```tsx
import { validateForm, getFieldError, commonSchemas } from '@kealee/ui'
import { z } from 'zod'

const schema = z.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
})

const result = validateForm(schema, formData)
if (!result.success) {
  const emailError = getFieldError(result.errors, 'email')
}
```

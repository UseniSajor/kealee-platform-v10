# API Integration Guide - os-admin & os-pm

## Overview

This guide covers connecting os-admin and os-pm apps to the backend API, replacing mock data with real API calls, and adding proper error handling.

---

## Current Status

### os-admin
- ✅ API service exists: `apps/os-admin/lib/os-admin-api.service.ts`
- ✅ Comprehensive API methods implemented
- ⚠️ Need to verify components are using real API calls

### os-pm
- ✅ API client exists: `apps/os-pm/lib/api-client.ts`
- ✅ Enhanced API client exists: `apps/os-pm/lib/enhanced-api-client.ts`
- ⚠️ Need to verify components are using real API calls

---

## 1. os-admin API Integration

### Existing API Service

The `OsAdminApiService` class provides methods for:
- User management
- Subscription management
- Billing dashboard
- Analytics
- Support tickets
- System logs
- RBAC
- API keys
- Audit logs
- Organizations

### Integration Steps

#### Step 1: Verify API Service Usage

Check if components are using the API service:

```typescript
// ✅ Good - Using API service
import { OsAdminApiService } from '@/lib/os-admin-api.service';

const users = await OsAdminApiService.getUsers();

// ❌ Bad - Using mock data
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com' }
];
```

#### Step 2: Replace Mock Data

Find components using mock data and replace with API calls:

```typescript
// Before (Mock Data)
'use client';
export function UsersPage() {
  const [users] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com' }
  ]);
  
  return <UsersTable users={users} />;
}

// After (Real API)
'use client';
import { useEffect, useState } from 'react';
import { OsAdminApiService } from '@/lib/os-admin-api.service';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const data = await OsAdminApiService.getUsers();
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <UsersTable users={users} />;
}
```

#### Step 3: Add Error Handling

Create a reusable error handler:

```typescript
// apps/os-admin/lib/error-handler.ts
export function handleApiError(error: any) {
  if (error.message === 'Not authenticated') {
    // Redirect to login
    window.location.href = '/login';
    return;
  }
  
  // Show error toast
  console.error('API Error:', error);
  // Use your toast library
  toast.error(error.message || 'An error occurred');
}
```

#### Step 4: Add Loading States

Create a loading component:

```typescript
// apps/os-admin/components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}
```

---

## 2. os-pm API Integration

### Existing API Clients

Two API clients are available:
1. **`api-client.ts`** - Basic API client with CSRF protection
2. **`enhanced-api-client.ts`** - Enhanced client with error handling

### Integration Steps

#### Step 1: Use Enhanced API Client

Prefer the enhanced API client for better error handling:

```typescript
// ✅ Good - Using enhanced API client
import { api } from '@/lib/enhanced-api-client';

const tasks = await api.getMyTasks();

// ❌ Bad - Using basic client (unless you need CSRF)
import { api } from '@/lib/api-client';
```

#### Step 2: Replace Mock Data

```typescript
// Before (Mock Data)
const tasks = [
  { id: '1', title: 'Task 1', status: 'pending' }
];

// After (Real API)
const { tasks } = await api.getMyTasks({ status: 'pending' });
```

#### Step 3: Add Error Boundaries

Create an error boundary component:

```typescript
// apps/os-pm/components/ErrorBoundary.tsx
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 3. Common Patterns

### Pattern 1: Data Fetching Hook

Create a reusable hook for data fetching:

```typescript
// apps/os-admin/hooks/useApiData.ts
import { useState, useEffect } from 'react';

export function useApiData<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, deps);

  return { data, loading, error, refetch: () => fetchData() };
}
```

Usage:

```typescript
const { data: users, loading, error } = useApiData(
  () => OsAdminApiService.getUsers(),
  []
);
```

### Pattern 2: Optimistic Updates

For better UX, update UI optimistically:

```typescript
async function updateUser(userId: string, updates: any) {
  // Optimistic update
  setUsers(users.map(u => 
    u.id === userId ? { ...u, ...updates } : u
  ));

  try {
    await OsAdminApiService.updateUser(userId, updates);
  } catch (error) {
    // Revert on error
    setUsers(originalUsers);
    handleApiError(error);
  }
}
```

### Pattern 3: Retry Logic

Add retry logic for failed requests:

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}
```

---

## 4. Testing API Integration

### Test Checklist

- [ ] All API calls use real endpoints (not mock data)
- [ ] Error handling works for network failures
- [ ] Loading states display correctly
- [ ] Authentication errors redirect to login
- [ ] Data refreshes after mutations
- [ ] Optimistic updates work correctly
- [ ] Error boundaries catch component errors

### Test Script

```typescript
// apps/os-admin/__tests__/api-integration.test.ts
import { OsAdminApiService } from '@/lib/os-admin-api.service';

describe('API Integration', () => {
  it('should fetch users', async () => {
    const result = await OsAdminApiService.getUsers();
    expect(result).toHaveProperty('users');
    expect(Array.isArray(result.users)).toBe(true);
  });

  it('should handle authentication errors', async () => {
    // Mock unauthenticated response
    // Verify redirect to login
  });
});
```

---

## 5. Deployment Checklist

Before deploying to staging:

- [ ] All mock data replaced with API calls
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Error boundaries in place
- [ ] API endpoints verified
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Authentication working

---

## 6. Monitoring

After deployment:

1. **Monitor API calls:**
   - Check browser DevTools → Network tab
   - Verify successful responses
   - Check for failed requests

2. **Monitor errors:**
   - Check Sentry for API errors
   - Monitor error rates
   - Set up alerts for critical failures

3. **Monitor performance:**
   - Check API response times
   - Monitor loading state durations
   - Optimize slow endpoints

---

## Next Steps

1. Review all components in os-admin and os-pm
2. Identify components using mock data
3. Replace with real API calls
4. Add error handling and loading states
5. Test thoroughly
6. Deploy to staging
7. Monitor and fix issues
8. Deploy to production

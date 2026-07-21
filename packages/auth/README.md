# @kealee/auth

Kealee Platform Authentication Package - Supabase Integration

## Installation

```bash
pnpm add @kealee/auth
```

## Environment Variables

Required in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Usage

### Basic Auth Functions

```typescript
import { signUp, signIn, signOut, getCurrentUser } from '@kealee/auth';

// Sign up
await signUp('user@example.com', 'password123', {
  full_name: 'John Doe'
});

// Sign in
await signIn('user@example.com', 'password123');

// Sign out
await signOut();

// Get current user
const user = await getCurrentUser();
```

### React Hooks

```typescript
import { useAuth, useRequireAuth } from '@kealee/auth';

// Get auth state
function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  
  return <div>Welcome {user.email}</div>;
}

// Require authentication
function ProtectedComponent() {
  const { user, loading } = useRequireAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Protected content for {user.email}</div>;
}
```

## Features

- ✅ Email/password authentication
- ✅ Session management
- ✅ Password reset
- ✅ Email verification
- ✅ User metadata
- ✅ React hooks for auth state
- ✅ Protected route helpers

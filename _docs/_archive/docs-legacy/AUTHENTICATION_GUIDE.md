# 🔐 Kealee Platform Authentication Guide

Complete guide to the authentication system built with Supabase.

---

## 📦 Architecture

### Shared Auth Package (`@kealee/auth`)

Centralized authentication package used by all apps:

```typescript
import { signUp, signIn, signOut, useAuth } from '@kealee/auth';
```

**Location:** `packages/auth/`

**Features:**
- Supabase client configuration
- Auth functions (signUp, signIn, signOut, resetPassword, etc.)
- React hooks (useAuth, useRequireAuth)
- Middleware helpers

---

## 🎯 App-Specific Implementation

### Client-Facing Apps

**Apps:** m-project-owner, m-ops-services, m-architect, m-permits-inspections

**Pages:**
- `/login` - Email/password login
- `/signup` - Account creation
- `/auth/verify-email` - Email verification confirmation
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form

**Middleware:**
- Protects routes: `/dashboard/*`, `/projects/*`, `/account/*`, `/settings/*`
- Redirects to `/login` if not authenticated
- Redirects to `/dashboard` if accessing auth pages while logged in

### Internal Apps

**Apps:** os-admin, os-pm

**Middleware:**
- **os-admin:** Requires `admin` role
- **os-pm:** Requires `pm` or `admin` role
- All routes protected
- Redirects to `/unauthorized` if role insufficient

---

## 🔧 Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Auth Package

```bash
cd packages/auth
pnpm build
```

### 3. Environment Variables

**For all apps (`.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**For API (`services/api/.env.local`):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### 4. Supabase Setup

1. Create Supabase project
2. Enable Email auth provider
3. Configure email templates
4. Set up redirect URLs:
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/auth/verify-email`
   - (Add production URLs)

---

## 💻 Usage

### In React Components

```typescript
import { useAuth, useRequireAuth } from '@kealee/auth';

// Get auth state
function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome {user.email}</div>;
}

// Require authentication
function ProtectedComponent() {
  const { user, loading } = useRequireAuth('/login');
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Protected content for {user.email}</div>;
}
```

### In API Routes

```typescript
import { authenticateUser, requireAdmin } from '@/middleware/auth.middleware';

// Protected route
fastify.get('/api/projects', {
  preHandler: [authenticateUser],
  handler: async (request, reply) => {
    const user = (request as AuthenticatedRequest).user;
    // Use user.id to filter data
    return { projects: [] };
  }
});

// Admin-only route
fastify.get('/api/admin/users', {
  preHandler: [authenticateUser, requireAdmin],
  handler: async (request, reply) => {
    // Admin logic here
    return { users: [] };
  }
});
```

### Programmatic Auth

```typescript
import { signUp, signIn, signOut, resetPassword } from '@kealee/auth';

// Sign up
await signUp('user@example.com', 'password123', {
  full_name: 'John Doe'
});

// Sign in
await signIn('user@example.com', 'password123');

// Sign out
await signOut();

// Reset password
await resetPassword('user@example.com');
```

---

## 🔒 Protected Routes

### Client Apps

Routes automatically protected:
- `/dashboard/*`
- `/projects/*`
- `/account/*`
- `/settings/*`

### Internal Apps

All routes protected:
- **os-admin:** Admin role required
- **os-pm:** PM or Admin role required

---

## 🧪 Testing

### Manual Testing

1. **Sign Up:**
   - Navigate to `/signup`
   - Fill form and submit
   - Check email for verification link

2. **Login:**
   - Navigate to `/login`
   - Enter credentials
   - Should redirect to `/dashboard`

3. **Protected Routes:**
   - Try accessing `/dashboard` without login
   - Should redirect to `/login`

4. **Password Reset:**
   - Navigate to `/auth/forgot-password`
   - Enter email
   - Check email for reset link
   - Complete reset form

### Automated Testing

```typescript
// Example test
describe('Authentication', () => {
  it('should sign up new user', async () => {
    const result = await signUp('test@example.com', 'password123');
    expect(result.user).toBeDefined();
  });

  it('should sign in existing user', async () => {
    const result = await signIn('test@example.com', 'password123');
    expect(result.session).toBeDefined();
  });
});
```

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

**Solution:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`

### "Invalid or expired token"

**Solution:** User needs to sign in again. Token may have expired.

### "Insufficient permissions"

**Solution:** User role doesn't match required role. Check user's role in Supabase.

### Middleware not working

**Solution:** 
1. Check `middleware.ts` exists in app root
2. Verify `matcher` config includes protected routes
3. Ensure Supabase client is properly initialized

---

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

## ✅ Status

**Implementation:** 100% Complete  
**All apps:** Protected and authenticated  
**Ready for:** Production use

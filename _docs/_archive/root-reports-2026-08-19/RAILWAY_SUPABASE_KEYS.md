# Supabase Keys for Railway - Which Ones Do You Need?

## Quick Answer

**YES, you need BOTH keys:**

1. ✅ **SUPABASE_ANON_KEY** - Required for user authentication
2. ✅ **SUPABASE_SERVICE_ROLE_KEY** - Required for several features (see below)

## Why You Need Both

### SUPABASE_ANON_KEY (Required)

Used for:
- ✅ User authentication (`services/api/src/modules/auth/auth.service.ts`)
- ✅ User signup/login
- ✅ Token verification
- ✅ Safe to use in client-side code (respects RLS)

### SUPABASE_SERVICE_ROLE_KEY (Required)

Used for server-side operations that need admin privileges:

1. **API Key Management** (`api-key.service.ts`)
   - Generating API keys
   - Managing API key usage
   - Storing keys in Supabase

2. **Webhook Service** (`webhook.service.ts`)
   - Storing webhook configurations
   - Tracking webhook deliveries

3. **Security Audit** (`security-audit.service.ts`, `immutable-audit.service.ts`)
   - Writing audit logs
   - Security event tracking

4. **Usage Analytics** (`usage-analytics.service.ts`)
   - Tracking API usage
   - Analytics data storage

5. **GraphQL Resolvers** (`graphql/resolvers.ts`)
   - GraphQL operations that need admin access

6. **Permits API** (`permits-api.routes.ts`)
   - Administrative permit operations

## Security Warning

⚠️ **SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security (RLS)**

- **NEVER** expose this key in client-side code
- **NEVER** commit it to git
- **ONLY** use it in server-side code (your API service)
- This key has **full admin access** to your Supabase project

## How to Get Your Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Setting in Railway

### Via Dashboard:

1. Go to your Railway project
2. Select **API service**
3. Go to **Variables** tab
4. Add all three:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

### Via CLI:

```bash
railway variables set SUPABASE_URL=https://your-project.supabase.co --service api
railway variables set SUPABASE_ANON_KEY=your_anon_key --service api
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key --service api
```

## What Happens If You Don't Add Service Role Key?

If `SUPABASE_SERVICE_ROLE_KEY` is missing, these features will **fail**:

- ❌ API key generation/management
- ❌ Webhook storage/management
- ❌ Security audit logging
- ❌ Usage analytics
- ❌ GraphQL operations requiring admin access
- ❌ Permits API administrative functions

You'll see errors like:
```
Error: SUPABASE_SERVICE_ROLE_KEY is not defined
```

## Verification

After adding both keys, check your service logs:

```bash
railway logs --service api
```

You should see the API starting successfully without Supabase-related errors.

## Summary

| Key | Required? | Used For | Security |
|-----|-----------|----------|----------|
| `SUPABASE_ANON_KEY` | ✅ Yes | User auth | Safe for client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Admin operations | Server-side only! |

**Both keys are required for the Kealee Platform to function properly.**

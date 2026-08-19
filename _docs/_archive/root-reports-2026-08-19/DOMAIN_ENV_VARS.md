# Domain Structure Environment Variables

## CLIENT-FACING APPS

### m-marketplace (kealee.com, www.kealee.com)
```bash
NEXT_PUBLIC_MARKETPLACE_URL=https://kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### m-ops-services (ops.kealee.com)
```bash
NEXT_PUBLIC_MARKETPLACE_URL=https://kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### m-project-owner (app.kealee.com)
```bash
NEXT_PUBLIC_MARKETPLACE_URL=https://kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### m-architect (architect.kealee.com)
```bash
NEXT_PUBLIC_MARKETPLACE_URL=https://kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### m-permits-inspections (permits.kealee.com)
```bash
NEXT_PUBLIC_MARKETPLACE_URL=https://kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## INTERNAL APPS

### os-pm (pm.kealee.com)
```bash
# DO NOT SET MARKETPLACE_URL
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_PM_WS_URL=wss://api.kealee.com
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### os-admin (admin.kealee.com)
```bash
# DO NOT SET MARKETPLACE_URL
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

## RAILWAY API (api.kealee.com)

```bash
CORS_ORIGINS=https://kealee.com,https://www.kealee.com,https://ops.kealee.com,https://app.kealee.com,https://architect.kealee.com,https://permits.kealee.com,https://pm.kealee.com,https://admin.kealee.com
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
# ... other API variables
```

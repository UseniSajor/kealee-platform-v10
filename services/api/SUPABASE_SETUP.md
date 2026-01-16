# Supabase Credentials Setup Guide

This guide will help you retrieve the necessary Supabase credentials for the Kealee Platform API service.

## Required Credentials

The Kealee Platform requires the following Supabase credentials:

1. **SUPABASE_URL** - Your Supabase project URL
2. **SUPABASE_SERVICE_ROLE_KEY** - Service role key (for server-side operations)
3. **SUPABASE_ANON_KEY** - Anonymous/public key (for client-side authentication)

## Step-by-Step Instructions

### Step 1: Access Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account (or create a new account if you don't have one)
3. Select your project from the dashboard (or create a new project)

### Step 2: Retrieve Project URL (SUPABASE_URL)

1. In your Supabase project dashboard, click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the settings menu
3. Under **Project URL**, you'll find your project URL
   - Format: `https://xxxxxxxxxxxxx.supabase.co`
   - Copy this entire URL

**Example:**
```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

### Step 3: Retrieve API Keys

In the same **Settings > API** page, you'll find two API keys:

#### A. Anonymous/Public Key (SUPABASE_ANON_KEY)

1. Look for the **Project API keys** section
2. Find the key labeled **anon** or **public**
3. Click the **eye icon** to reveal the key (or click **Copy**)
4. This key is safe to use in client-side code

**Example:**
```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### B. Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

1. In the same **Project API keys** section
2. Find the key labeled **service_role** or **secret**
3. Click the **eye icon** to reveal the key (or click **Copy**)
4. **⚠️ IMPORTANT:** This key has admin privileges. Never expose it in client-side code or commit it to version control.

**Example:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Update Your Environment Variables

1. Open your `.env.local` file in `services/api/`
2. Replace the placeholder values with your actual credentials:

```env
# Database
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

### Alternative: Using Supabase CLI

If you have the Supabase CLI installed, you can also retrieve credentials:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Get project URL and keys
supabase status
```

## Visual Guide

### Finding API Settings

```
Supabase Dashboard
├── Your Project
│   ├── Settings (⚙️ icon)
│   │   ├── API
│   │   │   ├── Project URL ← SUPABASE_URL
│   │   │   └── Project API keys
│   │   │       ├── anon/public ← SUPABASE_ANON_KEY
│   │   │       └── service_role ← SUPABASE_SERVICE_ROLE_KEY
```

## Security Best Practices

1. **Never commit credentials to Git**
   - Ensure `.env.local` is in `.gitignore`
   - Use environment variables in production

2. **Use Service Role Key Only on Server-Side**
   - The service role key bypasses Row Level Security (RLS)
   - Only use it in your API service, never in frontend code

3. **Use Anon Key for Client-Side**
   - The anon key respects RLS policies
   - Safe to use in browser/client applications

4. **Rotate Keys if Compromised**
   - Go to Settings > API
   - Click "Reset" next to the compromised key
   - Update your environment variables immediately

## Troubleshooting

### "Invalid API key" Error

- Verify you copied the entire key (they're very long)
- Check for extra spaces or line breaks
- Ensure you're using the correct key type (anon vs service_role)

### "Project not found" Error

- Verify the SUPABASE_URL is correct
- Check that your project is active (not paused)
- Ensure you have access to the project

### Testing Your Credentials

You can test your credentials by running:

```bash
cd services/api
pnpm dev
```

If credentials are correct, the server should start without authentication errors.

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase API Reference](https://supabase.com/docs/reference)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

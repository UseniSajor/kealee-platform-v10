# Stripe Setup Guide for Ops Services Products

## Quick Setup

To run the Stripe products import script, you need to set the `STRIPE_SECRET_KEY` environment variable.

### Option 1: Create .env.local (Recommended)

1. **Create `.env.local` file in `services/api/` directory:**

```bash
cd services/api
```

2. **Add your Stripe secret key:**

```env
STRIPE_SECRET_KEY=sk_test_xxxxx
```

3. **Run the script:**

```bash
pnpm stripe:setup-ops-products
```

### Option 2: Set Environment Variable Temporarily (PowerShell)

```powershell
$env:STRIPE_SECRET_KEY='sk_test_xxxxx'
pnpm stripe:setup-ops-products
```

### Option 3: Set Environment Variable Temporarily (Bash)

```bash
export STRIPE_SECRET_KEY='sk_test_xxxxx'
pnpm stripe:setup-ops-products
```

---

## Getting Your Stripe Secret Key

### For Development (Test Mode)

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_...`)
3. Use this key for local development

### For Production (Live Mode)

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_live_...`)
3. Use this key for production imports

**⚠️ Important:** 
- Test keys (`sk_test_...`) create test products in Stripe
- Live keys (`sk_live_...`) create real products
- Always use test keys for development!

---

## Complete .env.local Template

Create `services/api/.env.local` with:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Database (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public

# Supabase (if needed)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Running the Script

Once `STRIPE_SECRET_KEY` is set:

```bash
cd services/api
pnpm stripe:setup-ops-products
```

The script will:
1. ✅ Create 4 package products (A, B, C, D)
2. ✅ Create monthly and annual prices for each
3. ✅ Create 8 a la carte products
4. ✅ Output all environment variables needed

---

## Troubleshooting

### Error: "Missing env var STRIPE_SECRET_KEY"

**Solution:** Make sure you've set the environment variable:
- Check `.env.local` exists in `services/api/`
- Verify the key starts with `sk_test_` or `sk_live_`
- Restart your terminal if using temporary env vars

### Error: "Invalid API Key"

**Solution:** 
- Verify you copied the full key (it's long!)
- Make sure there are no extra spaces
- Check you're using the correct mode (test vs live)

---

**Next Steps:** After running the script, copy the output environment variables to Vercel and Railway.





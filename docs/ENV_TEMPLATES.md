# Environment Variable Templates

Reference templates for `.env.example` files for each application.

## m-marketplace/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PACKAGE_A="price_..."
STRIPE_PRICE_PACKAGE_B="price_..."
STRIPE_PRICE_PACKAGE_C="price_..."
STRIPE_PRICE_PACKAGE_D="price_..."

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
NEXT_PUBLIC_FB_PIXEL_ID=""
NEXT_PUBLIC_HOTJAR_ID=""
NEXT_PUBLIC_HOTJAR_SV=""
NEXT_PUBLIC_CRISP_WEBSITE_ID=""

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
```

## m-ops-services/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# NextAuth
NEXTAUTH_URL="http://localhost:3005"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PACKAGE_A="price_..."
STRIPE_PRICE_PACKAGE_B="price_..."
STRIPE_PRICE_PACKAGE_C="price_..."
STRIPE_PRICE_PACKAGE_D="price_..."

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3005"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
```

## os-admin/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth (if using NextAuth instead of Supabase)
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3002"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
```

## os-pm/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# NextAuth
NEXTAUTH_URL="http://localhost:3003"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3003"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
```

## m-project-owner/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# NextAuth
NEXTAUTH_URL="http://localhost:3004"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3004"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
```

## m-architect/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# NextAuth
NEXTAUTH_URL="http://localhost:3006"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3006"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
```

## m-permits-inspections/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# NextAuth
NEXTAUTH_URL="http://localhost:3007"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Stripe (for jurisdiction subscriptions)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3007"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
```

## services/api/.env.example

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kealee_development"

# Server
PORT=3001
NODE_ENV=development

# Supabase Auth
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PACKAGE_A="price_..."
STRIPE_PRICE_PACKAGE_B="price_..."
STRIPE_PRICE_PACKAGE_C="price_..."
STRIPE_PRICE_PACKAGE_D="price_..."

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007"

# Monitoring
SENTRY_DSN=""
```

## Quick Setup

1. Copy the template for each app to `apps/<app-name>/.env.example`
2. Run the setup script: `./scripts/setup-env-local.sh`
3. Update values in `.env.local` files with your actual keys

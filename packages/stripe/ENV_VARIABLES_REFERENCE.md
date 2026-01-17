# Stripe Environment Variables Reference

Complete list of all Stripe environment variables needed for Kealee Platform.

## 🔑 API Keys

### Backend (Railway)
```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
```

---

## 💼 PM Staffing Packages

### Backend (Railway)
```env
STRIPE_PRICE_PACKAGE_A=price_...  # Essential - $1,750/month
STRIPE_PRICE_PACKAGE_B=price_...  # Professional - $3,750/month
STRIPE_PRICE_PACKAGE_C=price_...  # Premium - $9,500/month
STRIPE_PRICE_PACKAGE_D=price_...  # White Glove - $16,500/month
```

### Frontend (Vercel - m-ops-services)
```env
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_C=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_D=price_...
```

---

## 🏪 Marketplace Subscriptions

### Backend (Railway)
```env
STRIPE_PRICE_MARKETPLACE_BASIC=price_...      # Basic - $49/month
STRIPE_PRICE_MARKETPLACE_PRO=price_...        # Professional - $149/month
STRIPE_PRICE_MARKETPLACE_PREMIUM=price_...    # Premium - $299/month
```

### Frontend (Vercel - marketplace app)
```env
NEXT_PUBLIC_STRIPE_PRICE_MARKETPLACE_BASIC=price_...
NEXT_PUBLIC_STRIPE_PRICE_MARKETPLACE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_MARKETPLACE_PREMIUM=price_...
```

---

## 👨‍💼 Professional Subscriptions

### Backend (Railway)
```env
STRIPE_PRICE_ARCHITECT_PRO=price_...  # Architect Pro - $99/month
STRIPE_PRICE_PERMIT_PRO=price_...     # Permit Pro - $299/month
```

### Frontend (Vercel - m-architect, m-permits-inspections)
```env
NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_PRO=price_...
```

---

## 📈 Marketing Package

### Backend (Railway)
```env
STRIPE_PRICE_MARKETING_PRO=price_...  # Marketing Pro - $799/month
```

### Frontend (Vercel - marketplace app)
```env
NEXT_PUBLIC_STRIPE_PRICE_MARKETING_PRO=price_...
```

---

## 🔧 Add-On Services

### Backend (Railway)
```env
STRIPE_PRICE_EXPEDITED=price_...      # Expedited Processing - $500 one-time
STRIPE_PRICE_WHITE_LABEL=price_...    # White-Label Reporting - $199/month
STRIPE_PRICE_API_ACCESS=price_...     # API Access - $499/month
```

### Frontend (Vercel - relevant apps)
```env
NEXT_PUBLIC_STRIPE_PRICE_EXPEDITED=price_...
NEXT_PUBLIC_STRIPE_PRICE_WHITE_LABEL=price_...
NEXT_PUBLIC_STRIPE_PRICE_API_ACCESS=price_...
```

---

## 📋 Pay-Per-Permit Services

### Backend (Railway)
```env
STRIPE_PRICE_PERMIT_SIMPLE=price_...     # Simple Permit - $50
STRIPE_PRICE_PERMIT_STANDARD=price_...   # Standard Permit - $150
STRIPE_PRICE_PERMIT_COMPLEX=price_...    # Complex Permit - $500
```

### Frontend (Vercel - m-permits-inspections)
```env
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_SIMPLE=price_...
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_STANDARD=price_...
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_COMPLEX=price_...
```

---

## 📝 Complete .env Template

### Railway (Backend API)
```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PM Staffing Packages
STRIPE_PRICE_PACKAGE_A=price_...
STRIPE_PRICE_PACKAGE_B=price_...
STRIPE_PRICE_PACKAGE_C=price_...
STRIPE_PRICE_PACKAGE_D=price_...

# Marketplace Subscriptions
STRIPE_PRICE_MARKETPLACE_BASIC=price_...
STRIPE_PRICE_MARKETPLACE_PRO=price_...
STRIPE_PRICE_MARKETPLACE_PREMIUM=price_...

# Professional Subscriptions
STRIPE_PRICE_ARCHITECT_PRO=price_...
STRIPE_PRICE_PERMIT_PRO=price_...

# Marketing Package
STRIPE_PRICE_MARKETING_PRO=price_...

# Add-On Services
STRIPE_PRICE_EXPEDITED=price_...
STRIPE_PRICE_WHITE_LABEL=price_...
STRIPE_PRICE_API_ACCESS=price_...

# Pay-Per-Permit Services
STRIPE_PRICE_PERMIT_SIMPLE=price_...
STRIPE_PRICE_PERMIT_STANDARD=price_...
STRIPE_PRICE_PERMIT_COMPLEX=price_...
```

### Vercel (Frontend Apps)

#### m-ops-services
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_C=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_D=price_...
```

#### marketplace
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_MARKETPLACE_BASIC=price_...
NEXT_PUBLIC_STRIPE_PRICE_MARKETPLACE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_MARKETPLACE_PREMIUM=price_...
NEXT_PUBLIC_STRIPE_PRICE_MARKETING_PRO=price_...
```

#### m-architect
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT_PRO=price_...
```

#### m-permits-inspections
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_SIMPLE=price_...
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_STANDARD=price_...
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_COMPLEX=price_...
```

---

## 🚀 How to Get Price IDs

### Option 1: Run Setup Script (Recommended)
```bash
cd packages/stripe
pnpm install
pnpm setup-products
```

This will create all products and output the price IDs.

### Option 2: Manual Creation
1. Go to https://dashboard.stripe.com/test/products
2. Create each product manually
3. Copy the price ID from each product
4. Add to your .env files

---

## ✅ Verification Checklist

- [ ] All price IDs start with `price_`
- [ ] Backend has secret key (starts with `sk_`)
- [ ] Frontend has publishable key (starts with `pk_`)
- [ ] Webhook secret configured (starts with `whsec_`)
- [ ] All required price IDs added to Railway
- [ ] Relevant price IDs added to each Vercel app
- [ ] Test mode keys for development
- [ ] Live mode keys for production

---

## 🔒 Security Notes

1. **NEVER** commit `.env` files to git
2. **NEVER** expose secret keys in frontend code
3. **ALWAYS** use `NEXT_PUBLIC_` prefix for frontend variables
4. **ALWAYS** keep webhook secrets secure
5. **ROTATE** keys if compromised

---

## 📊 Price ID Mapping

| Product | Price | Interval | Env Variable |
|---------|-------|----------|--------------|
| Essential | $1,750 | month | STRIPE_PRICE_PACKAGE_A |
| Professional | $3,750 | month | STRIPE_PRICE_PACKAGE_B |
| Premium | $9,500 | month | STRIPE_PRICE_PACKAGE_C |
| White Glove | $16,500 | month | STRIPE_PRICE_PACKAGE_D |
| Marketplace Basic | $49 | month | STRIPE_PRICE_MARKETPLACE_BASIC |
| Marketplace Pro | $149 | month | STRIPE_PRICE_MARKETPLACE_PRO |
| Marketplace Premium | $299 | month | STRIPE_PRICE_MARKETPLACE_PREMIUM |
| Architect Pro | $99 | month | STRIPE_PRICE_ARCHITECT_PRO |
| Permit Pro | $299 | month | STRIPE_PRICE_PERMIT_PRO |
| Marketing Pro | $799 | month | STRIPE_PRICE_MARKETING_PRO |
| Expedited | $500 | one-time | STRIPE_PRICE_EXPEDITED |
| White Label | $199 | month | STRIPE_PRICE_WHITE_LABEL |
| API Access | $499 | month | STRIPE_PRICE_API_ACCESS |
| Simple Permit | $50 | one-time | STRIPE_PRICE_PERMIT_SIMPLE |
| Standard Permit | $150 | one-time | STRIPE_PRICE_PERMIT_STANDARD |
| Complex Permit | $500 | one-time | STRIPE_PRICE_PERMIT_COMPLEX |

---

For more information, see `HOW_TO_GET_ENV_VARIABLES.md`

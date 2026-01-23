# Stripe Integration Setup Guide

## Overview

The payment system now uses **real Stripe Elements** instead of mock implementations. This provides:
- ✅ PCI-compliant card input
- ✅ Real-time validation
- ✅ Secure tokenization
- ✅ ACH/Bank account support
- ✅ Automatic fraud detection

## Environment Setup

### 1. Get Your Stripe Keys

1. Create a Stripe account at https://dashboard.stripe.com/register
2. Get your API keys from https://dashboard.stripe.com/test/apikeys

### 2. Configure Environment Variables

Add to your `.env.local` or `.env`:

```bash
# Frontend (Next.js/Vite)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
# OR for Vite:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Backend (API)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

**⚠️ IMPORTANT:**
- Use `pk_test_` keys for development
- Use `pk_live_` keys for production
- **NEVER** commit secret keys to version control
- The publishable key (`pk_`) is safe to expose in frontend code

### 3. Vercel/Railway Deployment

**Vercel (Frontend):**
1. Go to Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_xxxxx`

**Railway (Backend API):**
1. Go to your service → Variables
2. Add: `STRIPE_SECRET_KEY` = `sk_live_xxxxx`

## Component Usage

### AddPaymentMethodModal

The modal now uses real Stripe Elements:

```tsx
import { AddPaymentMethodModal } from './components/finance/deposit/AddPaymentMethodModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AddPaymentMethodModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSuccess={(paymentMethodId) => {
        console.log('Payment method added:', paymentMethodId);
      }}
    />
  );
}
```

### Features

**Card Payments:**
- Real-time validation
- Automatic card type detection
- CVC/CVV security
- Expiry date validation

**ACH/Bank Accounts:**
- Routing number validation
- Account number confirmation
- Micro-deposit verification (automatic)
- 1-2 business day verification period

## Testing

### Test Card Numbers

Stripe provides test cards for development:

```
Success:
  4242 4242 4242 4242  (Visa)
  5555 5555 5555 4444  (Mastercard)

Requires Authentication:
  4000 0025 0000 3155

Declined:
  4000 0000 0000 9995
```

Use any future expiry date and any 3-digit CVC.

### Test ACH

Use these routing numbers for testing:
```
Success:  110000000
Declined: 110000001
```

## Architecture

```
┌─────────────────────────────────────────┐
│   AddPaymentMethodModal.tsx             │
│   (Main Component)                      │
│   - Elements Provider Wrapper           │
│   - Payment Type Selection              │
│   - Form State Management               │
└────────┬────────────────────────────────┘
         │
         ├─► StripeCardElement.tsx
         │   - Card number, expiry, CVC
         │   - Real-time validation
         │   - Creates PaymentMethod via Stripe.js
         │
         └─► StripeACHElement.tsx
             - Routing & account numbers
             - Account confirmation
             - Creates PaymentMethod via Stripe.js
```

## Security

✅ **PCI DSS Compliance:** Card data never touches your servers
✅ **Stripe.js Tokenization:** Secure payment method creation
✅ **HTTPS Required:** All Stripe API calls require HTTPS
✅ **No Storage:** We never store full card/account numbers

## Troubleshooting

### "Stripe Not Configured" Error

**Cause:** Missing environment variable

**Fix:**
```bash
# Check if variable is set
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# If empty, add to .env.local:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### "Stripe has not loaded yet"

**Cause:** Network issues or ad blockers

**Fix:**
1. Check browser console for errors
2. Disable ad blockers
3. Ensure Stripe.js can load from `https://js.stripe.com`

### Payment Method Creation Failed

**Causes:**
- Invalid card details
- Network timeout
- Stripe API issue

**Fix:**
1. Check browser console for detailed error
2. Verify test card numbers
3. Check Stripe Dashboard → Logs for API errors

## Migration from Mock

**Before (Mock):**
```tsx
// Generated fake ID
const mockId = `pm_${Math.random().toString(36).substr(2, 9)}`;
```

**After (Real Stripe):**
```tsx
// Real Stripe PaymentMethod
const { paymentMethod } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
});
const realId = paymentMethod.id; // e.g., pm_1ABC123...
```

## Next Steps

1. ✅ Stripe Elements integrated
2. ⏳ Implement ACH verification UI
3. ⏳ Add Apple Pay / Google Pay
4. ⏳ Implement payment method management page
5. ⏳ Add saved payment method editing

## Resources

- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
- [Test Cards](https://stripe.com/docs/testing)
- [ACH Documentation](https://stripe.com/docs/payments/ach-debit)
- [Stripe Dashboard](https://dashboard.stripe.com/)

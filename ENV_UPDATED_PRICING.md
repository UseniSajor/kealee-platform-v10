# Updated Stripe Pricing Structure

## 📊 **Package Pricing (Updated)**

### **Package A - Essential** ($1,750/month)
```env
STRIPE_PRICE_PACKAGE_A=price_1Oxxxxxxxxxxxxx
```
**Features:**
- Timeline & task management
- Document organization
- Weekly check-ins

---

### **Package B - Professional** ($3,750/month)
```env
STRIPE_PRICE_PACKAGE_B=price_1Oxxxxxxxxxxxxx
```
**Features:**
- Everything in Essential
- Contractor coordination
- Budget tracking
- Site visits

---

### **Package C - Premium** ($9,500/month) ⭐ Most Popular
```env
STRIPE_PRICE_PACKAGE_C=price_1Oxxxxxxxxxxxxx
```
**Features:**
- Everything in Professional
- Permit management
- Inspection coordination
- Full contractor oversight

---

### **Package D - White Glove** ($16,500/month)
```env
STRIPE_PRICE_PACKAGE_D=price_1Oxxxxxxxxxxxxx
```
**Features:**
- Everything in Premium
- We hire contractors
- Handle all payments
- Complete hands-off

---

## 🏗️ **Professional Services**

### **Architecture & Design**
```typescript
priceRange: [$3,500 - $15,000]
type: 'custom' // Quote-based
```

### **Engineering Services**
```typescript
priceRange: [$1,200 - $5,000]
type: 'custom' // Quote-based
```

### **Permit Acceleration**
```env
STRIPE_PRICE_PERMIT=price_1Oxxxxxxxxxxxxx
```
**Price:** $299 one-time

---

## 💰 **Marketplace & Platform Fees**

### **Platform Fee**
```typescript
platformFee: 3% // Applied to all marketplace transactions
```

### **Escrow Fee**
```typescript
escrowFee: 1% // Max $500 per transaction
maxEscrowFee: $500
```

---

## 📋 **Complete Environment Variables**

Add these to Railway:

```env
# Package Price IDs
STRIPE_PRICE_PACKAGE_A=price_1Oxxxxxxxxxxxxx  # $1,750/month - Essential
STRIPE_PRICE_PACKAGE_B=price_1Oxxxxxxxxxxxxx  # $3,750/month - Professional
STRIPE_PRICE_PACKAGE_C=price_1Oxxxxxxxxxxxxx  # $9,500/month - Premium
STRIPE_PRICE_PACKAGE_D=price_1Oxxxxxxxxxxxxx  # $16,500/month - White Glove

# Service Price IDs
STRIPE_PRICE_PERMIT=price_1Oxxxxxxxxxxxxx     # $299 one-time - Permit Acceleration

# Marketplace (optional - if using Stripe products for marketplace)
STRIPE_PRICE_MARKETPLACE_BASIC=price_1Oxxxxxxxxxxxxx
STRIPE_PRICE_MARKETPLACE_PRO=price_1Oxxxxxxxxxxxxx
STRIPE_PRICE_MARKETPLACE_PREMIUM=price_1Oxxxxxxxxxxxxx
```

---

## 🎯 **Pricing Comparison**

| Package | Name | Price | Target Customer | Annual Value |
|---------|------|-------|-----------------|--------------|
| A | Essential | $1,750/mo | Small renovations | $21,000 |
| B | Professional | $3,750/mo | Standard projects | $45,000 |
| C | Premium ⭐ | $9,500/mo | Large projects | $114,000 |
| D | White Glove | $16,500/mo | Luxury/Commercial | $198,000 |

---

## 💡 **Usage in Code**

```typescript
import { stripeConfig, getPackageById } from './config/stripe.config';

// Get specific package
const premiumPackage = getPackageById('C');
console.log(premiumPackage.name); // "Premium"
console.log(premiumPackage.price); // 9500
console.log(premiumPackage.popular); // true

// Access price ID for Stripe API
const priceId = stripeConfig.packages.C.priceId;

// Calculate marketplace fee
const projectAmount = 10000; // $10,000 project
const platformFee = projectAmount * stripeConfig.marketplace.platformFee; // $300
const escrowFee = Math.min(
  projectAmount * stripeConfig.marketplace.escrowFee, 
  stripeConfig.marketplace.maxEscrowFee
); // $100

const totalFees = platformFee + escrowFee; // $400
```

---

## 🚀 **Next Steps**

1. **Create products in Stripe Dashboard**
2. **Set prices:**
   - Package A: $1,750/month recurring
   - Package B: $3,750/month recurring
   - Package C: $9,500/month recurring
   - Package D: $16,500/month recurring
   - Permit: $299 one-time
3. **Copy price IDs** from Stripe
4. **Add to Railway** environment variables
5. **Deploy** and test!

---

**Updated:** January 17, 2026
**Pricing Structure:** Refined for market positioning

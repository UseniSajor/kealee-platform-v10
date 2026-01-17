# Stripe Products & Pricing Tiers - Kealee Platform

## 🎯 Overview

This document defines all Stripe products, pricing tiers, and subscription plans for the Kealee Platform.

---

## 💰 **REVENUE STREAM #1: Ops Services (PM Staffing)**

### **Product: PM Staffing & Operations Management**

#### **Package A - Starter** ($1,700/month)
```javascript
{
  name: "PM Staffing - Starter (Package A)",
  description: "Essential project management support for small projects",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 170000, // $1,700 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "5-10 hours/week PM time",
    "Single project management",
    "Basic reporting",
    "Email support",
    "Monthly check-ins"
  ],
  metadata: {
    package_id: "package_a",
    hours_per_week: "5-10",
    project_limit: "1",
    support_level: "email"
  }
}
```

#### **Package B - Professional** ($4,500/month)
```javascript
{
  name: "PM Staffing - Professional (Package B)",
  description: "Comprehensive project management for growing businesses",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 450000, // $4,500 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "15-20 hours/week PM time",
    "Up to 3 concurrent projects",
    "Advanced reporting & analytics",
    "Priority email & phone support",
    "Weekly check-ins",
    "Dedicated PM assignment"
  ],
  metadata: {
    package_id: "package_b",
    hours_per_week: "15-20",
    project_limit: "3",
    support_level: "priority"
  }
}
```

#### **Package C - Premium** ($8,500/month)
```javascript
{
  name: "PM Staffing - Premium (Package C)",
  description: "Full-time project management for complex projects",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 850000, // $8,500 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "30-40 hours/week PM time",
    "Unlimited concurrent projects",
    "Real-time reporting & insights",
    "24/7 priority support",
    "Daily check-ins available",
    "Senior PM assignment",
    "Custom workflow automation"
  ],
  metadata: {
    package_id: "package_c",
    hours_per_week: "30-40",
    project_limit: "unlimited",
    support_level: "24/7"
  }
}
```

#### **Package D - Enterprise** ($16,500/month)
```javascript
{
  name: "PM Staffing - Enterprise (Package D)",
  description: "Full-time dedicated PM team for enterprise operations",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 1650000, // $16,500 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "Full-time PM team (40+ hours/week)",
    "Unlimited projects & portfolio management",
    "Executive reporting suite",
    "Dedicated account manager",
    "Custom integration & API access",
    "White-glove onboarding",
    "Quarterly business reviews"
  ],
  metadata: {
    package_id: "package_d",
    hours_per_week: "40+",
    project_limit: "unlimited",
    support_level: "dedicated",
    enterprise: "true"
  }
}
```

---

## 💰 **REVENUE STREAM #2: Marketplace (Contractor Directory)**

### **Product: Marketplace Subscription for Contractors**

#### **Basic Listing** ($49/month)
```javascript
{
  name: "Marketplace - Basic Listing",
  description: "Basic contractor profile in the marketplace",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 4900, // $49 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "Basic profile listing",
    "Up to 5 project photos",
    "Receive up to 3 leads/month",
    "Basic analytics",
    "Community forum access"
  ],
  metadata: {
    tier: "basic",
    lead_limit: "3",
    photo_limit: "5",
    verification: "false"
  }
}
```

#### **Professional** ($149/month)
```javascript
{
  name: "Marketplace - Professional",
  description: "Enhanced profile with priority placement",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 14900, // $149 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "Featured profile listing",
    "Unlimited project photos & portfolio",
    "Receive up to 15 leads/month",
    "Advanced analytics & insights",
    "Priority support",
    "Verified badge",
    "Quote request notifications"
  ],
  metadata: {
    tier: "professional",
    lead_limit: "15",
    photo_limit: "unlimited",
    verification: "true",
    featured: "true"
  }
}
```

#### **Premium** ($299/month)
```javascript
{
  name: "Marketplace - Premium",
  description: "Maximum visibility with exclusive features",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 29900, // $299 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "Top-tier featured placement",
    "Unlimited leads & project gallery",
    "Background check verification",
    "License & insurance verification",
    "Premium badge",
    "SEO optimization",
    "Custom landing page",
    "API access for lead management"
  ],
  metadata: {
    tier: "premium",
    lead_limit: "unlimited",
    photo_limit: "unlimited",
    verification: "background_check",
    featured: "top_tier",
    api_access: "true"
  }
}
```

---

## 💰 **REVENUE STREAM #3: Platform Fees (Transaction-Based)**

### **Product: Project Transaction Fees**

#### **Standard Projects** (3.5% + $0.30)
```javascript
{
  name: "Project Transaction Fee - Standard",
  description: "Platform fee for standard project transactions",
  type: "good",
  pricing: {
    model: "per_unit",
    unit_amount: 30, // $0.30 fixed fee in cents
    currency: "usd",
    // Plus 3.5% calculated in code
  },
  metadata: {
    fee_type: "transaction",
    percentage: "3.5",
    fixed_amount: "0.30",
    project_type: "standard"
  }
}
```

#### **Milestone Payments** (2.9% + $0.30)
```javascript
{
  name: "Milestone Payment Fee",
  description: "Platform fee for milestone-based payments",
  type: "good",
  pricing: {
    model: "per_unit",
    unit_amount: 30, // $0.30 fixed fee in cents
    currency: "usd",
    // Plus 2.9% calculated in code
  },
  metadata: {
    fee_type: "milestone",
    percentage: "2.9",
    fixed_amount: "0.30"
  }
}
```

---

## 💰 **REVENUE STREAM #4: Architect & Engineer Services**

### **Product: Architect Design Services**

#### **Per Project Fee** (5% platform fee)
```javascript
{
  name: "Architect Services - Platform Fee",
  description: "Platform fee for architectural design services",
  type: "service",
  pricing: {
    model: "per_unit",
    // Calculated as 5% of project value
  },
  metadata: {
    fee_type: "professional_services",
    percentage: "5",
    service_type: "architect",
    min_fee: "500" // $500 minimum
  }
}
```

#### **Subscription - Pro Architect** ($99/month)
```javascript
{
  name: "Architect Pro Subscription",
  description: "Professional tools for architects",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 9900, // $99 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "Unlimited project uploads",
    "Advanced BIM integration",
    "Version control & collaboration",
    "PE stamp workflow integration",
    "Priority review processing",
    "Reduced platform fees (3% instead of 5%)"
  ],
  metadata: {
    tier: "pro",
    platform_fee_discount: "3",
    project_limit: "unlimited"
  }
}
```

---

## 💰 **REVENUE STREAM #5: Permits & Inspections**

### **Product: Permit Processing Services**

#### **Pay-Per-Permit** ($25-$500 per permit)
```javascript
{
  name: "Permit Processing - Pay Per Use",
  description: "Individual permit application processing",
  type: "service",
  pricing: {
    model: "tiered",
    tiers: [
      {
        up_to: 1,
        unit_amount: 5000 // $50 for simple permits
      },
      {
        up_to: 1,
        unit_amount: 15000 // $150 for standard permits
      },
      {
        up_to: 1,
        unit_amount: 50000 // $500 for complex permits
      }
    ],
    currency: "usd"
  },
  metadata: {
    pricing_type: "per_permit",
    complexity_based: "true"
  }
}
```

#### **Monthly Subscription** ($299/month)
```javascript
{
  name: "Permit Pro - Monthly Subscription",
  description: "Unlimited permit applications with priority processing",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 29900, // $299 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "Unlimited permit applications",
    "Priority processing",
    "Automated compliance checks",
    "Jurisdiction integration",
    "Real-time status tracking",
    "Inspection scheduling included"
  ],
  metadata: {
    tier: "subscription",
    permit_limit: "unlimited",
    priority: "true"
  }
}
```

---

## 💰 **REVENUE STREAM #6: Add-On Services**

### **Product: Premium Add-Ons**

#### **Expedited Processing** ($500 one-time)
```javascript
{
  name: "Expedited Processing",
  description: "Rush processing for urgent projects",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 50000, // $500 in cents
    currency: "usd"
  },
  metadata: {
    type: "add_on",
    processing_time: "24_hours"
  }
}
```

#### **White-Label Reporting** ($199/month)
```javascript
{
  name: "White-Label Reporting",
  description: "Custom branded reports for clients",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 19900, // $199 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  metadata: {
    type: "add_on",
    feature: "white_label"
  }
}
```

#### **API Access** ($499/month)
```javascript
{
  name: "API Access - Professional",
  description: "Full API access for custom integrations",
  type: "service",
  pricing: {
    model: "per_unit",
    unit_amount: 49900, // $499 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "licensed"
    }
  },
  features: [
    "Full REST API access",
    "GraphQL endpoint access",
    "Webhook support",
    "Rate limit: 10,000 requests/day",
    "Dedicated API support"
  ],
  metadata: {
    type: "add_on",
    feature: "api_access",
    rate_limit: "10000"
  }
}
```

---

## 🔧 **Stripe Setup Script**

### **Environment Variables Needed:**

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **Create Products Script:**

```javascript
// scripts/stripe/setup-products.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  console.log('Creating Stripe products...\n');

  // Ops Services Products
  const packageA = await stripe.products.create({
    name: 'PM Staffing - Starter (Package A)',
    description: 'Essential project management support',
    type: 'service',
    metadata: {
      package_id: 'package_a',
      hours_per_week: '5-10'
    }
  });
  
  const priceA = await stripe.prices.create({
    product: packageA.id,
    unit_amount: 170000,
    currency: 'usd',
    recurring: { interval: 'month' }
  });
  
  console.log(`✅ Package A: ${packageA.id} / ${priceA.id}`);

  // Add more products...
  
  return {
    products: {
      packageA: packageA.id,
      // ... other product IDs
    },
    prices: {
      packageA: priceA.id,
      // ... other price IDs
    }
  };
}

createProducts()
  .then(result => {
    console.log('\n✅ All products created!');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });
```

---

## 📊 **Pricing Summary Table**

| Product | Tier | Price | Billing | Target Revenue |
|---------|------|-------|---------|----------------|
| **PM Staffing** | Package A | $1,700 | Monthly | $1.9M-$2.2M |
| **PM Staffing** | Package B | $4,500 | Monthly | Year 1 |
| **PM Staffing** | Package C | $8,500 | Monthly | |
| **PM Staffing** | Package D | $16,500 | Monthly | |
| **Marketplace** | Basic | $49 | Monthly | $400K-$1.1M |
| **Marketplace** | Pro | $149 | Monthly | Year 1 |
| **Marketplace** | Premium | $299 | Monthly | |
| **Platform Fees** | Transaction | 3.5% + $0.30 | Per transaction | $200K-$400K |
| **Architect Pro** | Subscription | $99 | Monthly | $50K-$150K |
| **Permit Pro** | Subscription | $299 | Monthly | Included in total |
| **API Access** | Add-on | $499 | Monthly | Additional revenue |

---

## 🎯 **Implementation Checklist**

- [ ] Create Stripe account
- [ ] Set up Stripe products in dashboard or via API
- [ ] Configure webhook endpoints
- [ ] Add Stripe keys to Railway environment variables
- [ ] Test subscription flows in test mode
- [ ] Set up customer portal for self-service
- [ ] Configure tax settings
- [ ] Set up invoicing
- [ ] Test payment methods (card, ACH, etc.)
- [ ] Go live with production keys

---

## 📝 **Next Steps**

1. **Create products in Stripe dashboard** or use the setup script
2. **Save product IDs** to your database or environment variables
3. **Implement subscription checkout** in your apps
4. **Set up webhooks** for subscription events
5. **Test end-to-end** with Stripe test cards

---

**Total Addressable Market:** $3M+ Year 1 across all revenue streams

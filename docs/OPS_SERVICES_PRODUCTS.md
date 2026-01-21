# Ops Services Products Configuration

## Package-Based Subscriptions

The ops services app offers 4 main subscription packages:

### Package A - Starter
- **Price:** $1,750-$2,750/month
- **Stripe Price ID:** `STRIPE_PRICE_PACKAGE_A`
- **Features:**
  - 5-10 hours/week PM time
  - Single project focus
  - Email support (48hr response)
  - Weekly progress reports
  - Basic task tracking

### Package B - Professional
- **Price:** $3,750-$5,500/month
- **Stripe Price ID:** `STRIPE_PRICE_PACKAGE_B`
- **Features:**
  - 15-20 hours/week PM time
  - Up to 3 concurrent projects
  - Priority email & phone support
  - Bi-weekly progress reports
  - Advanced project tracking
  - Contractor coordination

### Package C - Premium ⭐ Most Popular
- **Price:** $6,500-$9,500/month
- **Stripe Price ID:** `STRIPE_PRICE_PACKAGE_C`
- **Features:**
  - 30-40 hours/week PM time
  - Unlimited projects
  - 24/7 priority support
  - Daily progress reports
  - Dedicated PM assigned
  - Full contractor management
  - Budget optimization
  - Risk management

### Package D - Enterprise
- **Price:** $10,500-$16,500/month
- **Stripe Price ID:** `STRIPE_PRICE_PACKAGE_D`
- **Features:**
  - 40+ hours/week PM time
  - Portfolio management
  - Dedicated account manager
  - Custom reporting
  - Strategic planning support
  - Multi-project coordination
  - Executive-level insights
  - White-glove service

---

## A La Carte Products

Individual services that can be purchased separately (in addition to or instead of packages):

### Service Request Categories

These are the types of services available as a la carte products:

1. **Permit Application Help**
   - Applications, resubmittals, follow-ups, jurisdiction communications
   - Suggested for: Package A, Package B

2. **Inspection Scheduling**
   - Book inspections, coordinate trades, prep checklists
   - Suggested for: Package A, Package B

3. **Contractor Coordination**
   - Subs/vendors scheduling, updates, and accountability
   - Suggested for: Package B, Package C, Package D

4. **Change Order Management**
   - CO drafting, approvals, documentation, client communications
   - Suggested for: Package C, Package D

5. **Billing & Invoicing**
   - Owner invoices, vendor bills, lien waivers, receipts
   - Suggested for: Package A

6. **Schedule Optimization**
   - Tighten sequence, reduce downtime, protect milestones
   - Suggested for: Package C, Package D

7. **Document Preparation**
   - Submittals, closeout docs, plan sets, compliance files
   - Suggested for: Package A

8. **Other Operations Help**
   - Anything ops-related that's slowing your team down

---

## Environment Variables

### Required for Packages

These must be set in both **Vercel** (m-ops-services app) and **Railway** (API service):

```env
STRIPE_PRICE_PACKAGE_A=price_xxxxx
STRIPE_PRICE_PACKAGE_B=price_xxxxx
STRIPE_PRICE_PACKAGE_C=price_xxxxx
STRIPE_PRICE_PACKAGE_D=price_xxxxx
```

### A La Carte Products

For each a la carte product in Stripe, add an environment variable:

**Format:** `STRIPE_PRICE_<PRODUCT_NAME>`

**Examples:**
```env
STRIPE_PRICE_PERMIT_TRACKING=price_xxxxx
STRIPE_PRICE_VENDOR_MANAGEMENT=price_xxxxx
STRIPE_PRICE_WEEKLY_REPORTING=price_xxxxx
STRIPE_PRICE_INSPECTION_SCHEDULING=price_xxxxx
STRIPE_PRICE_DOCUMENT_PREPARATION=price_xxxxx
STRIPE_PRICE_CHANGE_ORDER_MANAGEMENT=price_xxxxx
STRIPE_PRICE_BILLING_INVOICING=price_xxxxx
STRIPE_PRICE_SCHEDULE_OPTIMIZATION=price_xxxxx
```

**Naming Convention:**
- Uppercase
- Spaces replaced with underscores
- Special characters removed
- Example: "Permit Tracking" → `STRIPE_PRICE_PERMIT_TRACKING`

---

## Adding Products

### Using the Script

The setup scripts will prompt for a la carte products:

1. Run `.\scripts\add-vercel-env-vars.ps1`
2. When prompted, enter each product name and its Stripe Price ID
3. The script will automatically:
   - Convert product name to env var format
   - Add to m-ops-services in Vercel
   - Add to API service in Railway
   - Add to both production and preview environments

### Manual Addition

1. **In Stripe Dashboard:**
   - Create product for each a la carte service
   - Add pricing (one-time or recurring)
   - Copy Price ID (starts with `price_`)

2. **In Vercel (m-ops-services app):**
   - Settings → Environment Variables
   - Add: `STRIPE_PRICE_<PRODUCT_NAME>` = `price_xxxxx`
   - Set for: Production, Preview

3. **In Railway (API service):**
   - Variables tab
   - Add: `STRIPE_PRICE_<PRODUCT_NAME>` = `price_xxxxx`

---

## Usage in Code

### Current Implementation

The checkout flow currently uses package-based subscriptions:

```typescript
// apps/m-ops-services/app/api/create-checkout/route.ts
const PRICE_IDS: Record<string, string> = {
  A: process.env.STRIPE_PRICE_PACKAGE_A!,
  B: process.env.STRIPE_PRICE_PACKAGE_B!,
  C: process.env.STRIPE_PRICE_PACKAGE_C!,
  D: process.env.STRIPE_PRICE_PACKAGE_D!,
};
```

### Adding A La Carte Support

To enable a la carte product purchases, update the checkout route:

```typescript
// Add a la carte products
const ALACARTE_PRICE_IDS: Record<string, string> = {
  PERMIT_TRACKING: process.env.STRIPE_PRICE_PERMIT_TRACKING!,
  VENDOR_MANAGEMENT: process.env.STRIPE_PRICE_VENDOR_MANAGEMENT!,
  // ... add all a la carte products
};

// Combine with packages
const ALL_PRICE_IDS = { ...PRICE_IDS, ...ALACARTE_PRICE_IDS };
```

---

## Product List Template

When you provide the Stripe product list screenshot, we'll add variables for:

- [ ] Package A Price ID
- [ ] Package B Price ID
- [ ] Package C Price ID
- [ ] Package D Price ID
- [ ] A La Carte Product 1: _____________
- [ ] A La Carte Product 2: _____________
- [ ] A La Carte Product 3: _____________
- [ ] ... (add as needed)

---

## Next Steps

1. ✅ Scripts updated to support a la carte products
2. ⏳ **Waiting for Stripe product list screenshot**
3. ⏳ Add product-specific variables based on your Stripe products
4. ⏳ Update checkout flow to support a la carte purchases


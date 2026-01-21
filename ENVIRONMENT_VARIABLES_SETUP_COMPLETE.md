# Environment Variables Setup - Complete Guide

## ✅ Scripts Ready

Both Vercel and Railway environment variable scripts have been updated with:

1. ✅ **A La Carte Product Support** - Dynamic input for individual products
2. ✅ **Package Price IDs** - All 4 packages (A, B, C, D)
3. ✅ **Production & Preview** - Variables added to both environments
4. ✅ **All 7 Apps** - Complete coverage for all Vercel apps
5. ✅ **Both Services** - API and Worker services in Railway

---

## 🚀 How to Run

### Step 1: Add Vercel Environment Variables

```powershell
.\scripts\add-vercel-env-vars.ps1
```

**What it does:**
- Prompts for Railway URLs (Database, API)
- Prompts for Supabase credentials
- Prompts for Stripe keys
- Prompts for **a la carte products** (product name + price ID)
- Adds variables to all 7 apps
- Adds to both production and preview environments

### Step 2: Add Railway Environment Variables

```powershell
.\scripts\add-railway-env-vars.ps1
```

**What it does:**
- Prompts for Database, Redis, SendGrid, Anthropic keys
- Prompts for Stripe keys and package price IDs
- Prompts for **a la carte products** (product name + price ID)
- Adds variables to API service
- Adds variables to Worker service

---

## 📋 Required Values Checklist

### Core Infrastructure
- [ ] Railway Database URL
- [ ] Railway API URL
- [ ] Supabase URL
- [ ] Supabase Anon Key
- [ ] Supabase Service Key (optional)

### Stripe Configuration
- [ ] Stripe Publishable Key
- [ ] Stripe Secret Key
- [ ] Stripe Webhook Secret
- [ ] **Package A Price ID** (`STRIPE_PRICE_PACKAGE_A`)
- [ ] **Package B Price ID** (`STRIPE_PRICE_PACKAGE_B`)
- [ ] **Package C Price ID** (`STRIPE_PRICE_PACKAGE_C`)
- [ ] **Package D Price ID** (`STRIPE_PRICE_PACKAGE_D`)

### A La Carte Products
- [ ] Product 1: Name + Price ID
- [ ] Product 2: Name + Price ID
- [ ] Product 3: Name + Price ID
- [ ] ... (add as many as needed)

### Optional Services
- [ ] Google Places API Key
- [ ] AWS S3 Credentials
- [ ] DocuSign Credentials
- [ ] Sentry DSN
- [ ] Analytics IDs

---

## 📸 Stripe Product List

**When you provide the Stripe product list screenshot, we'll:**

1. Identify all a la carte products
2. Extract product names and price IDs
3. Add them to the scripts automatically
4. Update documentation with product list

**Expected format from Stripe:**
- Product Name
- Price ID (starts with `price_`)
- Recurring/One-time
- Amount

---

## 🔍 Current Service Request Categories

These are the service types available in ops services (may become a la carte products):

1. **Permit Application Help**
   - Applications, resubmittals, follow-ups, jurisdiction communications

2. **Inspection Scheduling**
   - Book inspections, coordinate trades, prep checklists

3. **Contractor Coordination**
   - Subs/vendors scheduling, updates, and accountability

4. **Change Order Management**
   - CO drafting, approvals, documentation, client communications

5. **Billing & Invoicing**
   - Owner invoices, vendor bills, lien waivers, receipts

6. **Schedule Optimization**
   - Tighten sequence, reduce downtime, protect milestones

7. **Document Preparation**
   - Submittals, closeout docs, plan sets, compliance files

8. **Other Operations Help**
   - Anything ops-related that's slowing your team down

---

## 📝 Environment Variable Naming

### Packages
- `STRIPE_PRICE_PACKAGE_A`
- `STRIPE_PRICE_PACKAGE_B`
- `STRIPE_PRICE_PACKAGE_C`
- `STRIPE_PRICE_PACKAGE_D`

### A La Carte Products
**Format:** `STRIPE_PRICE_<PRODUCT_NAME>`

**Examples:**
- "Permit Tracking" → `STRIPE_PRICE_PERMIT_TRACKING`
- "Vendor Management" → `STRIPE_PRICE_VENDOR_MANAGEMENT`
- "Weekly Reporting" → `STRIPE_PRICE_WEEKLY_REPORTING`
- "Inspection Scheduling" → `STRIPE_PRICE_INSPECTION_SCHEDULING`

**Rules:**
- Uppercase
- Spaces → underscores
- Special characters removed
- Only alphanumeric and underscores

---

## 🎯 Next Steps

1. ✅ Scripts are ready
2. ⏳ **Run the scripts** to add variables
3. ⏳ **Provide Stripe product list** screenshot
4. ⏳ Add any missing a la carte products
5. ⏳ Verify all variables are set
6. ⏳ Test checkout flow

---

## 📚 Documentation

- `VERCEL_ENV_VARIABLES_REFERENCE.md` - Complete Vercel variable list
- `RAILWAY_ENV_VARIABLES_REFERENCE.md` - Complete Railway variable list
- `docs/OPS_SERVICES_PRODUCTS.md` - Ops services products documentation

---

## ✅ Status

**Scripts:** ✅ Ready  
**A La Carte Support:** ✅ Implemented  
**Documentation:** ✅ Complete  
**Waiting for:** 📸 Stripe product list screenshot


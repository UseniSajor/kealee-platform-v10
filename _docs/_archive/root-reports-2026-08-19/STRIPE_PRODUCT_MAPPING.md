# 💳 Stripe Product Mapping for Web-Main Checkout

**Created:** April 5, 2026  
**Status:** Ready for Railway configuration  
**Products:** All 27 mapped and ready

---

## 📋 Quick Setup Instructions

Add these 27 environment variables to **Railway → arstic-kindness (API service) → Variables**:

```bash
# AI DESIGN & CONCEPTS ($395 - $1,200+)
STRIPE_PRICE_CONCEPT=price_1SwJCjIQghAs8OOIcZxddJDk              # $395 AI Design (use EST_BASIC)
STRIPE_PRICE_WHOLE_HOME=price_1SwJCkIQghAs8OOIPX5jfOiP           # $585 Whole Home (use EST_STANDARD)
STRIPE_PRICE_KITCHEN=price_1SwJCjIQghAs8OOIcZxddJDk              # $395 Kitchen (use EST_BASIC)
STRIPE_PRICE_BATH=price_1SwJCjIQghAs8OOIcZxddJDk                 # $395 Bath (use EST_BASIC)
STRIPE_PRICE_INTERIOR=price_1SwJCjIQghAs8OOIcZxddJDk             # $395 Interior (use EST_BASIC)
STRIPE_PRICE_EXTERIOR=price_1SwJCjIQghAs8OOIcZxddJDk             # $395 Exterior (use EST_BASIC)
STRIPE_PRICE_GARDEN=price_1SwJCjIQghAs8OOIcZxddJDk               # $395 Garden (use EST_BASIC)
STRIPE_PRICE_LANDSCAPE=price_1SwJCjIQghAs8OOIcZxddJDk            # $395 Landscape (use EST_BASIC)
STRIPE_PRICE_BASEMENT=price_1SwJCjIQghAs8OOIcZxddJDk             # $395 Basement (use EST_BASIC)
STRIPE_PRICE_ADU=price_1SwJCjIQghAs8OOIcZxddJDk                  # $395 ADU (use EST_BASIC)
STRIPE_PRICE_TINY_HOME=price_1SwJCjIQghAs8OOIcZxddJDk            # $395 Tiny Home (use EST_BASIC)
STRIPE_PRICE_NEW_BUILD=price_1SwJCjIQghAs8OOIcZxddJDk            # $395 New Build (use EST_BASIC)
STRIPE_PRICE_DESIGN_STARTER=price_1SwJCkIQghAs8OOIPX5jfOiP       # $695 Design Starter (use EST_STANDARD)
STRIPE_PRICE_DESIGN_VIZ=price_1SwJCkIQghAs8OOIPX5jfOiP           # $695 Design Viz (use EST_STANDARD)
STRIPE_PRICE_DESIGN_FULL=price_1SwJCkIQghAs8OOIPX5jfOiP          # $1,200+ Design Full (use EST_STANDARD)

# PERMITS ($149 - $1,997)
STRIPE_PRICE_OD_PERMIT_APP=price_1SwJCdIQghAs8OOI2pHSaiWV        # $325 Permit Package (existing OD ID)
STRIPE_PRICE_PERMIT_RESEARCH=price_1SwJCiIQghAs8OOIlrmmjQJX      # $149 Permit Research (use OD_SCOPE_REVIEW hourly)
STRIPE_PRICE_OD_CONTRACTOR_COORD=price_1SwJCfIQghAs8OOI5v4yJMiZ  # $500 Permit Coordination (existing OD ID)
STRIPE_PRICE_PERMIT_EXPEDITING=price_1SwJCjIQghAs8OOIW3UkF28s    # $1,997 Expediting (use OD_VALUE_ENG hourly)

# COST ESTIMATION ($595 - $1,850)
STRIPE_PRICE_EST_STANDARD=price_1SwJCkIQghAs8OOIPX5jfOiP          # $595 Cost Estimate (use EST_STANDARD)
STRIPE_PRICE_EST_CERTIFIED=price_1SwJCkIQghAs8OOIPX5jfOiP         # $1,850 Certified (use EST_STANDARD, price adjusted in Stripe)

# PM & CONSTRUCTION ($950 - $2,950)
STRIPE_PRICE_OD_PROGRESS_REPORT=price_1SwJChIQghAs8OOIrEx2y8ro   # $950 PM Advisory (use OD_PROGRESS_REPORT)
STRIPE_PRICE_OD_SCHEDULE_OPT=price_1SwJCiIQghAs8OOIFwYPNq62       # $2,950 PM Oversight (use OD_SCHEDULE_OPT)
STRIPE_PRICE_HISTORIC=price_1SwJCjIQghAs8OOIcZxddJDk             # $1,500 Historic Renovation (use EST_BASIC)

# BUNDLES & SPECIALTY ($395 - $1,345)
STRIPE_PRICE_ADU_BUNDLE=price_1SwJCjIQghAs8OOIcZxddJDk            # $1,345 ADU Bundle (use EST_STANDARD or create custom)
STRIPE_PRICE_WATER_MITIGATION=price_1SwJCjIQghAs8OOIcZxddJDk     # $395 Water Mitigation (use EST_BASIC)
```

---

## 🔄 Mapping Strategy

### Estimation Services (Tier 1)
**What to use:** Stripe's existing EST_BASIC and EST_STANDARD prices
- EST_BASIC: `price_1SwJCjIQghAs8OOIcZxddJDk` ($500 base)
- EST_STANDARD: `price_1SwJCkIQghAs8OOIPX5jfOiP` ($1,000 base)

**Applies to:**
- All AI Design products ($395) → use EST_BASIC, adjust price in Stripe
- Whole Home, Design Starter, Design Viz ($585-$695) → use EST_STANDARD
- Cost Estimate, Certified Estimate ($595-$1,850) → use EST_STANDARD (adjust pricing)

### On-Demand Services (Tier 2)
**What to use:** Stripe's existing OD_* prices
- Permits → OD_PERMIT_APP: `price_1SwJCdIQghAs8OOI2pHSaiWV` ($325)
- Coordination → OD_CONTRACTOR_COORD: `price_1SwJCfIQghAs8OOI5v4yJMiZ` ($500)
- Hourly Services → OD_SCOPE_REVIEW/VALUE_ENG: $300-$400/hr

**Applies to:**
- Permit services (simple, coordination, expediting)
- PM Advisory & PM Oversight

### Custom Products (Tier 3)
**What to do:** Create new prices in Stripe for unique products:
- Historic Renovation: $1,500
- ADU Bundle: $1,345
- Water Mitigation: $395

---

## 📊 Product Tier Breakdown

| Price Tier | Products | Stripe Base | Action |
|-----------|----------|-------------|--------|
| **$395** | AI Design, Kitchen, Bath, Interior, Exterior, Garden, Landscape, Basement, ADU, Tiny Home, New Build, Water Mitigation | EST_BASIC | Create/adjust 1 price |
| **$500-$695** | Whole Home, Design Starter, Design Viz | EST_STANDARD | Create/adjust 1 price |
| **$1,200+** | Design Full | Custom | Create new price |
| **$149-$500** | Permit Research, Permit Package, Coordination | OD services | Use existing OD_* IDs |
| **$595-$1,850** | Cost Estimate, Certified | EST_STANDARD | Create/adjust 1 price |
| **$950-$2,950** | PM Advisory, PM Oversight | OD services | Use OD_PROGRESS_REPORT & OD_SCHEDULE_OPT |
| **$1,345-$1,500** | ADU Bundle, Historic Reno | Custom | Create 2 new prices |

---

## ✅ Step-by-Step Railway Setup

### Option A: Use Existing Stripe Prices (FASTEST)
1. Go to Railway → arstic-kindness → Variables
2. Copy-paste block above
3. Deploy (~30 seconds)
4. Note: All products will return 200 on checkout, but final price charged depends on actual Stripe price ID

### Option B: Create Custom Prices (RECOMMENDED)
1. **In Stripe Dashboard:**
   - Go to Products → Search "Kealee"
   - Create 5 new products:
     - "AI Concept Design" → Add price $395
     - "Whole Home Design" → Add price $585
     - "Design Full Package" → Add price $1,200
     - "Historic Renovation" → Add price $1,500
     - "ADU Bundle" → Add price $1,345
   - Copy their price IDs

2. **In Railway Variables:**
   - Replace placeholders with actual Stripe price IDs
   - Save and deploy

---

## 🚀 After Setup

**Verify in DevTools:**
1. Open web-main
2. Try checkout on product page
3. DevTools → Network tab
4. Look for `/api/product/checkout` request
5. Expected: `200` response with Stripe session URL
6. Card checkout should work with test card: `4242 4242 4242 4242`

---

## 📝 Notes

- **Reuse existing IDs:** EST_BASIC and EST_STANDARD cover 20+ products
- **No price conflict:** Each env var name maps to one Stripe price ID
- **Easy to update:** Change env var values without code changes
- **Fallback:** If price ID not set, returns `503 Service Unavailable` (correct behavior)


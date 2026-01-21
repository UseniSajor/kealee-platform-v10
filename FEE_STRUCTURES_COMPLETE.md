# COMPLETE FEE STRUCTURES - ALL MODULES
## Consolidated from Documentation

**Version:** 1.0.0  
**Date:** January 21, 2026  
**Purpose:** Reference document for all payment/fee implementations across modules

---

## 📊 REVENUE STREAMS OVERVIEW

| # | Module | Year 1 Revenue | Fee Model | Status |
|---|--------|----------------|-----------|--------|
| 1 | **m-ops-services** | $1.9M-$2.2M | Monthly subscriptions | ✅ Implemented |
| 2 | **m-project-owner** | $200K-$400K | 3% platform fees | ✅ Implemented |
| 3 | **m-finance-trust** | $50K-$100K | Transaction fees | ✅ Implemented |
| 4 | **m-marketplace** | $400K-$1.1M | Subscriptions + lead fees | ⚠️ Partial |
| 5 | **m-architect** | $50K-$150K | 3% design fees | ❌ Not implemented |
| 6 | **m-permits-inspections** | $800K-$1.2M | Multiple fee types | ⚠️ API only |
| 7 | **m-engineer** | $30K-$100K | 3% engineering fees | ❌ Not implemented |

**Total Year 1 Revenue Target:** $3.4M - $5.2M

---

## 1. M-OPS-SERVICES (Package Subscriptions)

### **Fee Structure:**
- **Package A:** $1,750/month
- **Package B:** $4,500/month
- **Package C:** $8,500/month
- **Package D:** $16,500/month

### **Payment Flow:**
1. User selects package on `/pricing`
2. Redirects to `/checkout/[packageId]`
3. Creates Stripe Checkout session via `/api/stripe/checkout`
4. User completes payment on Stripe
5. Webhook creates subscription in database
6. User redirected to `/checkout/success`

### **Implementation Status:**
- ✅ Checkout page: `apps/m-ops-services/app/checkout/[packageId]/page.tsx`
- ✅ Stripe integration: `apps/m-ops-services/app/api/stripe/checkout/route.ts`
- ✅ Backend API: `/billing/stripe/checkout-session`
- ✅ Webhook handling: `services/api/src/modules/webhooks/stripe.webhook.ts`

### **Backend Endpoints:**
- `POST /billing/stripe/checkout-session` - Create checkout
- `POST /billing/stripe/webhook` - Handle webhooks
- `GET /billing/subscriptions/me` - Get user subscription

---

## 2. M-PROJECT-OWNER (Platform Fees)

### **Fee Structure:**
- **Platform Fee:** 3% of total project value
- **Example:** $150K project = $4,500 platform fee
- **When Charged:** At project creation or contract signing

### **Payment Flow:**
1. Project owner creates project
2. System calculates 3% platform fee
3. Fee added to project total
4. Payment collected via milestone releases or upfront
5. Fee deducted from escrow or charged separately

### **Implementation Status:**
- ✅ Payment release: `apps/m-project-owner/components/PaymentReleasePanel.tsx`
- ✅ Backend API: `/payments/milestones/:id/release`
- ⚠️ Platform fee calculation: Needs explicit fee line item
- ⚠️ Fee collection: Integrated into milestone flow, not separate checkout

### **Backend Endpoints:**
- `POST /payments/milestones/:milestoneId/release` - Release payment (includes platform fee)
- `GET /payments/projects/:projectId/escrow` - Get escrow details
- `POST /payments/intents` - Create payment intent for upfront fees

### **Fee Calculation:**
```typescript
const platformFee = projectValue * 0.03
const totalAmount = projectValue + platformFee
```

---

## 3. M-FINANCE-TRUST (Escrow & Transaction Fees)

### **Fee Structure:**
- **Transaction Fees:** Included in platform fees
- **Wire Transfer Fees:** $25-$50 per transfer (future)
- **Escrow Holding:** No fee (future: interest on escrowed funds)

### **Payment Flow:**
1. Escrow account created with project
2. Funds deposited into escrow
3. Milestone releases processed via Stripe
4. Transaction fees deducted from releases
5. Final holdback released at project completion

### **Implementation Status:**
- ✅ Escrow creation: `services/api/src/modules/payments/payment.service.ts`
- ✅ Milestone releases: `services/api/src/modules/payments/milestone-payment.service.ts`
- ✅ Stripe transfers: Integrated
- ⚠️ Transaction fee tracking: Needs explicit fee line items

### **Backend Endpoints:**
- `GET /payments/projects/:projectId/escrow` - Get escrow agreement
- `POST /payments/milestones/:milestoneId/release` - Release payment
- `GET /payments/projects/:projectId/payments` - Payment history

---

## 4. M-MARKETPLACE (Subscriptions + Lead Fees)

### **Fee Structure:**

**Subscription Tiers:**
- **Basic:** $49/month
- **Pro:** $149/month
- **Premium:** $399/month

**Lead Fees:**
- **Per Lead:** $15-$50 (varies by lead quality)
- **Lead Credits:** Included in subscription tiers

### **Payment Flow:**
1. Contractor signs up for subscription
2. Monthly subscription charged via Stripe
3. Lead credits allocated based on tier
4. Additional leads purchased as needed
5. Lead fees charged per lead accepted

### **Implementation Status:**
- ⚠️ Subscription: Needs implementation (similar to m-ops-services)
- ⚠️ Lead fees: Needs checkout flow
- ✅ Backend API structure exists

### **Backend Endpoints Needed:**
- `POST /marketplace/subscriptions` - Create subscription
- `POST /marketplace/leads/purchase` - Purchase lead credits
- `POST /marketplace/leads/:id/accept` - Accept lead (charge fee)

---

## 5. M-ARCHITECT (Platform Fees)

### **Fee Structure:**
- **Platform Fee:** 3% of design contract value
- **Example:** $25K design contract = $750 platform fee
- **When Charged:** When design contract is signed/approved

### **Payment Flow:**
1. Architect completes design project
2. Design contract created with value
3. Platform fee calculated (3%)
4. Fee collected when project owner approves design
5. Payment processed via Stripe

### **Implementation Status:**
- ❌ Fee calculation: Not implemented
- ❌ Payment collection: Not implemented
- ✅ Design project structure exists

### **Backend Endpoints Needed:**
- `POST /architect/projects/:id/complete` - Complete design (calculate fee)
- `POST /architect/projects/:id/approve` - Approve design (charge fee)
- `POST /architect/payments/collect` - Collect platform fee

### **Fee Calculation:**
```typescript
const designContractValue = project.designFee
const platformFee = designContractValue * 0.03
const totalAmount = designContractValue + platformFee
```

---

## 6. M-PERMITS-INSPECTIONS (Multiple Fee Types)

### **Fee Structure:**

#### **A. Jurisdiction SaaS Licensing (Recurring)**
- **Basic Tier:** $500/month (up to 100 permits/month, 3 users)
- **Pro Tier:** $1,000/month (up to 500 permits/month, 10 users)
- **Enterprise Tier:** $2,000/month (unlimited permits, unlimited users)

#### **B. Expedited Processing (Per Permit)**
- **Fee:** 15-25% of standard permit cost
- **Example:** $1,000 permit = $150-$250 expedited fee
- **Service:** 48-72 hour review guarantee

#### **C. Document Preparation (Per Submittal)**
- **Basic Package:** $150 (document organization + checklist)
- **Standard Package:** $300 (+ code compliance check)
- **Premium Package:** $500 (+ consultation + resubmission management)

#### **D. Platform Fees (Private Transactions)**
- **Fee:** 3% of permit value
- **When:** Permits processed outside jurisdiction system
- **Example:** $5,000 permit = $150 platform fee

#### **E. Integration Fees (Recurring)**
- **Fee:** $50-$200/month per contractor/architect/engineer
- **Service:** API access, automated submittals, real-time updates

### **Payment Flow:**

**Jurisdiction Licensing:**
1. Jurisdiction signs up for SaaS tier
2. Monthly subscription created
3. Charged via Stripe subscription

**Expedited Processing:**
1. User selects expedited option during permit application
2. Expedited fee calculated (15-25% of permit cost)
3. Fee added to permit total
4. Payment collected via Stripe Checkout

**Document Preparation:**
1. User selects document prep package
2. Fee added to permit application
3. Payment collected via Stripe Checkout

**Permit Fees:**
1. Permit application submitted
2. Jurisdiction calculates permit fees
3. Fees displayed to applicant
4. Payment collected via Stripe Checkout
5. Permit issued after payment

### **Implementation Status:**
- ⚠️ Fee structure: Defined in API (`apps/m-permits-inspections/src/lib/api/permits.ts`)
- ❌ Checkout flow: Not implemented
- ❌ Subscription management: Not implemented
- ✅ Backend API structure exists

### **Backend Endpoints Needed:**
- `POST /permits/:id/payment` - Pay permit fees
- `POST /permits/:id/expedited` - Add expedited processing
- `POST /permits/:id/document-prep` - Add document prep service
- `POST /jurisdictions/:id/subscribe` - Create jurisdiction subscription
- `GET /jurisdictions/:id/billing` - Get jurisdiction billing

### **Fee Calculation Examples:**
```typescript
// Expedited Processing
const permitCost = 1000
const expeditedFee = permitCost * 0.20 // 20%
const totalPermitFee = permitCost + expeditedFee

// Document Preparation
const docPrepFee = 300 // Standard package
const totalFees = permitCost + expeditedFee + docPrepFee

// Platform Fee (if private)
const platformFee = permitCost * 0.03
const grandTotal = totalFees + platformFee
```

---

## 7. M-ENGINEER (Platform Fees)

### **Fee Structure:**
- **Platform Fee:** 3% of engineering contract value
- **Example:** $15K engineering contract = $450 platform fee
- **When Charged:** When engineering contract is signed/approved

### **Payment Flow:**
1. Engineer completes engineering deliverables
2. Engineering contract created with value
3. Platform fee calculated (3%)
4. Fee collected when project owner approves engineering
5. Payment processed via Stripe

### **Implementation Status:**
- ❌ Fee calculation: Not implemented
- ❌ Payment collection: Not implemented
- ⚠️ Module structure: Needs to be built

### **Backend Endpoints Needed:**
- `POST /engineer/projects/:id/complete` - Complete engineering (calculate fee)
- `POST /engineer/projects/:id/approve` - Approve engineering (charge fee)
- `POST /engineer/payments/collect` - Collect platform fee

### **Fee Calculation:**
```typescript
const engineeringContractValue = project.engineeringFee
const platformFee = engineeringContractValue * 0.03
const totalAmount = engineeringContractValue + platformFee
```

---

## 🔄 PAYMENT PROCESSING PATTERNS

### **Pattern 1: Subscription (Recurring)**
**Used by:** m-ops-services, m-marketplace, m-permits-inspections (jurisdictions)

**Flow:**
1. User selects subscription tier
2. Create Stripe Checkout session (mode: 'subscription')
3. User completes payment
4. Webhook creates subscription record
5. Monthly charges handled by Stripe

**Implementation:**
- Use `/billing/stripe/checkout-session` endpoint
- Set `mode: 'subscription'` in Stripe session
- Handle `customer.subscription.created` webhook

---

### **Pattern 2: One-Time Payment (Checkout)**
**Used by:** m-permits-inspections (fees), m-architect (design fees), m-engineer (engineering fees)

**Flow:**
1. Calculate fee amount
2. Create Stripe Checkout session (mode: 'payment')
3. User completes payment
4. Webhook confirms payment
5. Update record status

**Implementation:**
- Use `/payments/intents` endpoint
- Or create Stripe Checkout session with `mode: 'payment'`
- Handle `checkout.session.completed` webhook

---

### **Pattern 3: Platform Fee (Percentage)**
**Used by:** m-project-owner, m-architect, m-engineer

**Flow:**
1. Calculate 3% of contract/project value
2. Add fee to total amount
3. Collect payment (upfront or via milestones)
4. Track fee separately for reporting

**Implementation:**
- Calculate fee: `platformFee = contractValue * 0.03`
- Add to payment intent or milestone release
- Track in separate `platformFee` field

---

### **Pattern 4: Milestone Release (Escrow)**
**Used by:** m-project-owner, m-finance-trust

**Flow:**
1. Contractor submits milestone evidence
2. Project owner approves milestone
3. Calculate release amount (90% of milestone, 10% holdback)
4. Release from escrow via Stripe transfer
5. Update milestone status to PAID

**Implementation:**
- Use `/payments/milestones/:id/release` endpoint
- Stripe transfer to contractor's connected account
- Update escrow balance

---

## 📋 IMPLEMENTATION CHECKLIST

### **✅ Completed:**
- [x] m-ops-services: Package subscription checkout
- [x] m-project-owner: Milestone payment releases
- [x] m-finance-trust: Escrow and transfers

### **⚠️ Partial:**
- [ ] m-marketplace: Subscription structure exists, needs checkout UI
- [ ] m-permits-inspections: Fee structure in API, needs checkout flows

### **❌ Not Implemented:**
- [ ] m-architect: Platform fee calculation and collection
- [ ] m-engineer: Platform fee calculation and collection
- [ ] m-permits-inspections: Jurisdiction subscription management
- [ ] m-permits-inspections: Expedited processing checkout
- [ ] m-permits-inspections: Document prep checkout
- [ ] m-permits-inspections: Integration fee subscriptions

---

## 🎯 PRIORITY IMPLEMENTATION ORDER

1. **m-permits-inspections** (Highest revenue: $800K-$1.2M)
   - Permit fee payment checkout
   - Expedited processing checkout
   - Document prep checkout
   - Jurisdiction subscription management

2. **m-marketplace** ($400K-$1.1M)
   - Subscription checkout (similar to m-ops-services)
   - Lead purchase checkout

3. **m-architect** ($50K-$150K)
   - Platform fee calculation
   - Design approval payment collection

4. **m-engineer** ($30K-$100K)
   - Platform fee calculation
   - Engineering approval payment collection

---

## 📝 NOTES

- All fees should be tracked separately for revenue reporting
- Platform fees (3%) should be clearly displayed to users
- Transaction fees should be transparent
- Recurring subscriptions should support upgrade/downgrade
- All payments should use Stripe for consistency
- Webhook handling should be centralized in `services/api/src/modules/webhooks/stripe.webhook.ts`

---

**Last Updated:** January 21, 2026  
**Next Review:** After implementing m-permits-inspections payment flows


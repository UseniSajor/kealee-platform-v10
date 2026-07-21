# 🚀 MVP to Full Automation - Complete Implementation Roadmap

## Overview

Comprehensive step-by-step guide to transform the current lead generation system into a fully automated, AI-powered service delivery platform.

**Current State:** Professional lead capture (Phase 1 - 25% complete)
**Goal:** Full automation with Command Center + AI agents (100% complete)

---

## 📊 Implementation Phases

| Phase | Focus | Steps | Outcome |
|-------|-------|-------|---------|
| **Phase 1** | Marketing & Leads | ✅ Complete | Lead generation working |
| **Phase 2** | User Onboarding | 6 steps | Users can sign up & login |
| **Phase 3** | Billing & Subscriptions | 4 steps | Revenue collection working |
| **Phase 4** | Basic Service Delivery | 5 steps | MVP services functional |
| **Phase 5** | Command Center | 10 steps | Automation infrastructure |
| **Phase 6** | AI Agents | 9 steps | Full AI automation |
| **Phase 7** | Polish & Scale | 3 steps | Production-ready |

**Total Steps:** 37 implementation steps

---

# PHASE 2: User Onboarding & Authentication

## Goal
Enable automatic user account creation, authentication, and basic workspace access.

---

## 2.1 Supabase Authentication Setup

### Step 1: Configure Supabase Auth

**Tasks:**
```bash
# 1. Supabase project already exists
# 2. Enable email auth in Supabase dashboard
# 3. Configure email templates
# 4. Set up JWT secrets
```

**Files to create:**
```
packages/auth/
├── src/
│   ├── supabase-client.ts     # Supabase client initialization
│   ├── auth-helpers.ts        # Login, signup, logout functions
│   ├── session-manager.ts     # Session handling
│   └── middleware.ts          # Auth middleware for API
```

**Code example:**
```typescript
// packages/auth/src/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function signUp(email: string, password: string, metadata: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    }
  });
  return { data, error };
}
```

---

### Step 2: Auto User Creation on Lead Conversion
**Time:** 2 days

**Endpoint:**
```typescript
// apps/m-ops-services/app/api/gc-ops-leads/[id]/convert/route.ts
import { signUp } from '@kealee/auth';
import { prisma } from '@prisma/client';

export async function POST(request, { params }) {
  const { id } = params;
  const lead = await prisma.gCOpsLead.findUnique({ where: { id } });
  
  // 1. Generate temporary password
  const tempPassword = generateSecurePassword();
  
  // 2. Create Supabase user
  const { data: authUser, error } = await signUp(
    lead.email,
    tempPassword,
    {
      fullName: lead.fullName,
      company: lead.company,
      role: 'CONTRACTOR'
    }
  );
  
  // 3. Create User record in database
  const user = await prisma.user.create({
    data: {
      supabaseId: authUser.user.id,
      email: lead.email,
      name: lead.fullName,
      role: 'CONTRACTOR'
    }
  });
  
  // 4. Create Org record
  const org = await prisma.org.create({
    data: {
      name: lead.company,
      type: 'GC_FIRM',
      ownerId: user.id
    }
  });
  
  // 5. Send welcome email with login link
  await sendWelcomeEmail(lead.email, tempPassword);
  
  // 6. Update lead status
  await prisma.gCOpsLead.update({
    where: { id },
    data: {
      status: 'CONVERTED',
      convertedDate: new Date()
    }
  });
  
  return { success: true, userId: user.id };
}
```

**Files to create:**
- `/api/gc-ops-leads/[id]/convert/route.ts`
- `/api/development-leads/[id]/convert/route.ts`
- `/api/permit-service-leads/[id]/convert/route.ts`

---

### Step 3: Login Pages

**Create login/signup pages:**
```
apps/m-ops-services/app/
├── auth/
│   ├── login/page.tsx          # Login form
│   ├── signup/page.tsx         # Signup form (if needed)
│   ├── callback/page.tsx       # Auth callback handler
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
```

**Login page example:**
```typescript
'use client';
import { useState } from 'react';
import { supabase } from '@kealee/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  async function handleLogin(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error) {
      router.push('/dashboard');
    }
  }
  
  return (/* Login form UI */);
}
```

---

### Step 4: Protected Routes Middleware

**File:**
```typescript
// apps/m-ops-services/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Protect /portal/* routes (admin only)
  if (req.nextUrl.pathname.startsWith('/portal')) {
    if (!session || session.user.user_metadata.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }
  
  // Protect /dashboard routes (authenticated users)
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/portal/:path*', '/dashboard/:path*']
};
```

---

## 2.2 Basic User Workspace

### Step 5: User Dashboard Shell

**Create:**
```
apps/m-ops-services/app/(dashboard)/
├── layout.tsx                  # Dashboard layout with nav
├── dashboard/
│   ├── page.tsx               # Main dashboard
│   ├── profile/page.tsx       # User profile
│   ├── projects/page.tsx      # Project list
│   └── settings/page.tsx      # Account settings
```

**Dashboard page:**
```typescript
export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userRecord = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      org: true,
      projects: { take: 5, orderBy: { createdAt: 'desc' } }
    }
  });
  
  return (
    <div>
      <h1>Welcome, {userRecord.name}</h1>
      <div>Recent Projects: {userRecord.projects.length}</div>
      {/* Dashboard widgets */}
    </div>
  );
}
```

---

### Step 6: Email Verification Flow

**Create verification system:**
```typescript
// app/auth/verify/page.tsx
export default async function VerifyPage({ searchParams }) {
  const { token } = searchParams;
  
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'signup'
  });
  
  if (!error) {
    // Redirect to complete profile
    redirect('/onboarding');
  }
}
```

---

## Phase 2 Deliverables

✅ User can sign up with email/password
✅ Email verification working
✅ User can login
✅ User sees basic dashboard after login
✅ Protected routes (admin dashboards require admin role)
✅ Session management working

**Outcome:** Users can create accounts and access the platform

---

# PHASE 3: Billing & Subscriptions (2-3 weeks)

## Goal
Enable payment collection, trial management, and recurring billing.

---

## 3.1 Stripe Connect Integration (Week 3)

### Step 7: Stripe Setup
**Time:** 2 days

**Tasks:**
1. Create Stripe account
2. Get API keys (test + production)
3. Set up webhook endpoint
4. Create products in Stripe

**Products to create in Stripe:**

**GC Operations:**
- Package A: $1,750/month
- Package B: $3,750/month (with 14-day trial)
- Package C: $9,500/month
- Package D: $16,500/month

**Development:**
- Tier 1: One-time $7,500-$15,000
- Tier 2: $5,000-$15,000/month

**Permits:**
- Per-permit products (12 types)
- Monthly Unlimited: $1,250/month
- Premium: $2,500/month

---

### Step 8: Checkout Flow

**Create:**
```typescript
// app/api/checkout/session/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request) {
  const { priceId, userId, metadata } = await request.json();
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: metadata.email,
    subscription_data: {
      trial_period_days: 14, // For Package B
      metadata: {
        userId,
        packageTier: metadata.package,
        leadId: metadata.leadId
      }
    },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=true`
  });
  
  return NextResponse.json({ sessionId: session.id });
}
```

**Pages:**
```
app/checkout/
├── page.tsx                    # Checkout page with package selection
└── success/page.tsx            # Post-checkout success page
```

---

### Step 9: Subscription Management
**Time:** 3 days

**Webhook handler:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
      
    case 'customer.subscription.trial_will_end':
      await handleTrialEnding(event.data.object);
      break;
      
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
  }
  
  return NextResponse.json({ received: true });
}

async function handleSubscriptionCreated(subscription) {
  // 1. Create subscription record in database
  await prisma.gCOpsSubscription.create({
    data: {
      userId: subscription.metadata.userId,
      stripeSubscriptionId: subscription.id,
      packageTier: subscription.metadata.packageTier,
      status: 'TRIAL',
      trialEnd: new Date(subscription.trial_end * 1000),
      amount: subscription.items.data[0].price.unit_amount / 100
    }
  });
  
  // 2. Update lead status
  await prisma.gCOpsLead.update({
    where: { id: subscription.metadata.leadId },
    data: { status: 'TRIAL_ACTIVE', trialStartDate: new Date() }
  });
  
  // 3. Provision service access
  await provisionGCOpsAccess(subscription.metadata.userId, 'PACKAGE_B');
  
  // 4. Send welcome email
  await sendWelcomeEmail(subscription.metadata.userId);
}
```

---

### Step 10: Trial Management

**Create trial tracking:**
```typescript
// packages/automation/src/apps/trial-manager/worker.ts
import { createWorker } from '../../infrastructure/queues';

const worker = createWorker('trial-manager', async (job) => {
  const { action, userId, subscriptionId } = job.data;
  
  if (action === 'trial-ending-soon') {
    // 3 days before trial ends
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await sendTrialEndingEmail(user.email, 3);
  }
  
  if (action === 'trial-ended') {
    // Trial ended - convert or cancel
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (subscription.status === 'active') {
      // Converted! Update database
      await prisma.gCOpsSubscription.update({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'ACTIVE', convertedAt: new Date() }
      });
    } else {
      // Canceled - cleanup
      await handleTrialCancellation(userId);
    }
  }
});

// Schedule trial reminders
export async function scheduleTrial Reminders(subscriptionId, trialEndDate) {
  const threeDaysBefore = new Date(trialEndDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  
  await trialQueue.add('trial-ending-soon', 
    { action: 'trial-ending-soon', subscriptionId },
    { delay: threeDaysBefore.getTime() - Date.now() }
  );
  
  await trialQueue.add('trial-ended',
    { action: 'trial-ended', subscriptionId },
    { delay: trialEndDate.getTime() - Date.now() }
  );
}
```

---

## Phase 2 Deliverables

✅ Supabase Auth configured
✅ User signup flow working
✅ Email verification functional
✅ Login system operational
✅ Basic user dashboard
✅ Protected routes with middleware
✅ Auto user creation on lead conversion

**Test:** GC can sign up, verify email, login, see dashboard

---

# PHASE 3: Billing & Subscriptions (2-3 weeks)

## Goal
Enable payment collection, subscription management, and revenue tracking.

---

## 3.1 Stripe Products & Pricing (Week 4)

### Step 11: Create All Stripe Products
**Time:** 1 day

**Products to create:**
```typescript
// scripts/seed-stripe-products.ts
const products = [
  // GC Operations
  { name: 'Package A - Solo GC', price: 175000, interval: 'month' },
  { name: 'Package B - Growing Team', price: 375000, interval: 'month', trial: 14 },
  { name: 'Package C - Multiple Projects', price: 950000, interval: 'month' },
  { name: 'Package D - Enterprise', price: 1650000, interval: 'month' },
  
  // Development
  { name: 'Tier 1 - Feasibility', price: 1000000, type: 'one_time' },
  { name: 'Tier 2 - Owners Rep', price: 1000000, interval: 'month' },
  
  // Permits
  { name: 'Monthly Unlimited', price: 125000, interval: 'month' },
  { name: 'Premium', price: 250000, interval: 'month' },
  // ... 12 per-permit products
];

for (const product of products) {
  const stripeProduct = await stripe.products.create({
    name: product.name,
    description: product.description
  });
  
  const price = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: product.price,
    currency: 'usd',
    recurring: product.interval ? { interval: product.interval } : undefined
  });
  
  // Save to database
  await prisma.stripeProduct.create({
    data: {
      stripeProductId: stripeProduct.id,
      stripePriceId: price.id,
      name: product.name,
      amount: product.price
    }
  });
}
```

---

### Step 12: Checkout Pages
**Time:** 3 days

**Create complete checkout flow:**
```
apps/m-ops-services/app/
├── pricing/checkout/
│   ├── [packageId]/page.tsx   # Package-specific checkout
│   └── success/page.tsx        # Success page
```

**Checkout page:**
```typescript
'use client';
import { loadStripe } from '@stripe/stripe-js';

export default function CheckoutPage({ params }) {
  async function handleCheckout() {
    // 1. Create checkout session
    const response = await fetch('/api/checkout/session', {
      method: 'POST',
      body: JSON.stringify({
        priceId: params.packageId,
        userId: session.user.id,
        metadata: {
          package: 'PACKAGE_B',
          leadId: leadId
        }
      })
    });
    
    const { sessionId } = await response.json();
    
    // 2. Redirect to Stripe Checkout
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
    await stripe.redirectToCheckout({ sessionId });
  }
  
  return (
    <div>
      <h1>Package B - Growing Team</h1>
      <p>$3,750/month</p>
      <p>14-day free trial</p>
      <button onClick={handleCheckout}>Start Free Trial</button>
    </div>
  );
}
```

---

### Step 13: Webhook Processing
**Time:** 2 days

**Complete webhook handling:**
```typescript
// app/api/webhooks/stripe/route.ts

async function handleInvoicePaid(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  // 1. Record payment
  await prisma.payment.create({
    data: {
      userId: subscription.metadata.userId,
      amount: invoice.amount_paid / 100,
      stripeInvoiceId: invoice.id,
      status: 'PAID'
    }
  });
  
  // 2. Extend service period
  await prisma.gCOpsSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: 'ACTIVE'
    }
  });
  
  // 3. Send receipt email
  await sendReceiptEmail(subscription.metadata.userId, invoice);
}

async function handleSubscriptionCanceled(subscription) {
  // 1. Update database
  await prisma.gCOpsSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date()
    }
  });
  
  // 2. Schedule access removal (grace period)
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30);
  
  await accessQueue.add('remove-access', {
    userId: subscription.metadata.userId,
    reason: 'subscription_canceled'
  }, { delay: gracePeriodEnd.getTime() - Date.now() });
  
  // 3. Send cancellation email
  await sendCancellationEmail(subscription.metadata.userId);
}
```

---

### Step 14: Subscription Management UI
**Time:** 2 days

**Create:**
```
app/dashboard/billing/
├── page.tsx                    # Current subscription
├── change-plan/page.tsx        # Upgrade/downgrade
└── cancel/page.tsx             # Cancellation flow
```

---

## Phase 3 Deliverables

✅ Stripe products created (all packages)
✅ Checkout flow functional
✅ Payment collection working
✅ Webhooks processing events
✅ Trial period managed automatically
✅ Subscription status tracked
✅ Billing UI for users

**Test:** GC can start trial, get billed automatically, manage subscription

---

# PHASE 4: Basic Service Delivery

## Goal
Deliver core services manually (before full automation).

---

## 4.1 GC Operations Service Features

### Step 15: Project Import & Setup

**Create:**
```
app/dashboard/projects/
├── import/page.tsx             # Import existing projects
├── new/page.tsx                # Create new project
└── [id]/page.tsx               # Project detail view
```

**Project model already exists in schema - use it:**
```typescript
// app/api/projects/route.ts
export async function POST(request) {
  const { name, address, client, startDate, budget } = await request.json();
  const { user } = await getUser(request);
  
  const project = await prisma.project.create({
    data: {
      name,
      address,
      clientName: client,
      startDate: new Date(startDate),
      budget,
      orgId: user.orgId,
      status: 'ACTIVE'
    }
  });
  
  // Create initial milestone structure
  await createDefaultMilestones(project.id);
  
  return NextResponse.json(project);
}
```

---

### Step 16: Permit Tracking Interface
**Time:** 4 days

**Create permit management:**
```
app/dashboard/projects/[id]/
├── permits/page.tsx            # Permit list
└── permits/[permitId]/page.tsx # Permit detail
```

**Permit tracker:**
```typescript
export default async function PermitsPage({ params }) {
  const permits = await prisma.permit.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' }
  });
  
  return (
    <div>
      <h2>Project Permits</h2>
      {permits.map(permit => (
        <PermitCard
          key={permit.id}
          permit={permit}
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
      <AddPermitButton />
    </div>
  );
}

// Manual update by ops team
async function handleStatusUpdate(permitId, newStatus) {
  await fetch(`/api/permits/${permitId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  });
  
  // Log activity
  await logActivity(permitId, 'STATUS_CHANGED', `Status updated to ${newStatus}`);
}
```

---

### Step 17: Weekly Report Interface (Manual)

**Create report management:**
```
app/dashboard/projects/[id]/
└── reports/
    ├── page.tsx                # Report list
    ├── new/page.tsx            # Create report (manual)
    └── [reportId]/page.tsx     # View report
```

**Manual report creation:**
```typescript
export default function CreateReportPage({ params }) {
  const [reportData, setReportData] = useState({
    progressSummary: '',
    completedTasks: [],
    upcomingTasks: [],
    issues: [],
    photos: []
  });
  
  async function generateReport() {
    // 1. Create report in database
    const report = await prisma.weeklyReport.create({
      data: {
        projectId: params.id,
        weekEnding: new Date(),
        content: reportData,
        createdBy: user.id
      }
    });
    
    // 2. Send to client
    await sendReportEmail(params.id, report.id);
    
    // 3. Archive in documents
    await archiveReport(report.id);
  }
  
  return (/* Report creation form */);
}
```

---

### Step 18: Document Management
**Time:** 3 days

**Create:**
```
app/dashboard/projects/[id]/
└── documents/
    ├── page.tsx                # Document library
    └── upload/page.tsx         # File upload
```

**File upload with categorization:**
```typescript
async function handleFileUpload(file, projectId) {
  // 1. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('project-documents')
    .upload(`${projectId}/${file.name}`, file);
  
  // 2. Create document record
  await prisma.document.create({
    data: {
      projectId,
      fileName: file.name,
      fileUrl: data.path,
      fileType: file.type,
      category: 'PO', // Or 'INVOICE', 'CONTRACT', etc.
      uploadedBy: user.id
    }
  });
  
  // 3. OCR if invoice/receipt (for budget tracking)
  if (file.type === 'application/pdf' && isInvoice(file.name)) {
    await ocrQueue.add('extract-invoice', { documentId: document.id });
  }
}
```

---

### Step 19: Client Communication

**Create messaging system:**
```
app/dashboard/projects/[id]/
└── messages/page.tsx           # Project messaging
```

**Basic messaging:**
```typescript
export default function MessagesPage({ params }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  async function sendMessage() {
    // 1. Create message
    await prisma.message.create({
      data: {
        projectId: params.id,
        senderId: user.id,
        content: newMessage,
        type: 'PROJECT_UPDATE'
      }
    });
    
    // 2. Notify recipients (email)
    await notifyProjectTeam(params.id, newMessage);
    
    // 3. Update UI
    fetchMessages();
  }
  
  return (/* Messaging UI */);
}
```

---

## Phase 4 Deliverables

✅ Projects can be created/imported
✅ Permits tracked (manually updated by ops team)
✅ Reports created (manual form, not AI-generated)
✅ Documents uploaded and organized
✅ Basic client communication
✅ GC can see their projects and status

**Outcome:** Services delivered manually through web interface (ops team does the work, platform tracks it)

---

# PHASE 5: Command Center Infrastructure (4-6 weeks)

## Goal
Build automation infrastructure for the 15 mini-apps.

---

## 5.1 Infrastructure Setup (Week 7-8)

### Step 20: Redis & BullMQ Setup
**Time:** 2 days

**Install dependencies:**
```bash
pnpm add bullmq ioredis
pnpm add -D @types/ioredis
```

**Create infrastructure:**
```typescript
// packages/automation/src/infrastructure/queues.ts
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

export function createQueue(name: string) {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 }
    }
  });
}

export function createWorker(
  name: string,
  processor: (job: Job) => Promise<any>,
  concurrency = 5
) {
  return new Worker(name, processor, { connection, concurrency });
}

// Export common queues
export const reportQueue = createQueue('report-generator');
export const permitQueue = createQueue('permit-tracker');
export const budgetQueue = createQueue('budget-tracker');
export const riskQueue = createQueue('risk-analyzer');
```

---

### Step 21: Event Bus

**Create pub/sub system:**
```typescript
// packages/automation/src/infrastructure/event-bus.ts
import Redis from 'ioredis';
import { prisma } from '@kealee/database';

const pub = new Redis(process.env.REDIS_URL!);
const sub = new Redis(process.env.REDIS_URL!);

export const eventBus = {
  async publish(event: string, data: any, source: string) {
    const payload = {
      event,
      data,
      source,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };
    
    // 1. Publish to Redis
    await pub.publish('kealee:events', JSON.stringify(payload));
    
    // 2. Store in database (audit trail)
    await prisma.automationEvent.create({
      data: {
        eventType: event,
        sourceApp: source,
        payload: data
      }
    });
    
    console.log(`📢 Event published: ${event} from ${source}`);
  },
  
  subscribe(handler: (event: string, data: any, source: string) => void) {
    sub.subscribe('kealee:events');
    
    sub.on('message', (channel, msg) => {
      const { event, data, source } = JSON.parse(msg);
      handler(event, data, source);
    });
    
    console.log('👂 Event bus subscriber active');
  }
};
```

---

### Step 22: Worker Manager
**Time:** 1 day

**Create worker startup:**
```typescript
// packages/automation/src/workers/index.ts
import { reportWorker } from '../apps/report-generator/worker';
import { permitWorker } from '../apps/permit-tracker/worker';
import { budgetWorker } from '../apps/budget-tracker/worker';
// ... import all 15 workers

const workers = [
  reportWorker,
  permitWorker,
  budgetWorker,
  // ... all 15 workers
];

async function startAllWorkers() {
  console.log('🚀 Starting Command Center workers...');
  
  for (const worker of workers) {
    await worker.waitUntilReady();
    console.log(`✅ ${worker.name} ready`);
  }
  
  console.log('✅ All 15 Command Center apps operational');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down workers...');
  await Promise.all(workers.map(w => w.close()));
  process.exit(0);
});

startAllWorkers().catch(console.error);
```

---

## 5.2 Build First 5 Critical Apps

### Step 23: APP-04 - Report Generator

**Purpose:** Auto-generate weekly client reports

**Files:**
```
packages/automation/src/apps/report-generator/
├── index.ts                    # App configuration
├── worker.ts                   # BullMQ worker
├── report-generator.ts         # Core logic
└── templates/
    ├── weekly-report.ts        # Report template
    └── executive-summary.ts    # Summary template
```

**Worker implementation:**
```typescript
// packages/automation/src/apps/report-generator/worker.ts
import { createWorker } from '../../infrastructure/queues';
import { generateWeeklyReport } from './report-generator';

export const reportWorker = createWorker('report-generator', async (job) => {
  const { projectId, weekEnding } = job.data;
  
  console.log(`📊 Generating report for project ${projectId}`);
  
  // 1. Collect data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: { where: { completedAt: { gte: weekEnding } } },
      photos: { where: { createdAt: { gte: weekEnding } } },
      budget: true,
      schedule: true
    }
  });
  
  // 2. Generate report (will add AI in Phase 6)
  const reportContent = await generateWeeklyReport(project);
  
  // 3. Save to database
  const report = await prisma.weeklyReport.create({
    data: {
      projectId,
      weekEnding,
      content: reportContent,
      generatedBy: 'APP-04'
    }
  });
  
  // 4. Send to client
  await sendReportEmail(project.clientEmail, report);
  
  // 5. Publish event
  await eventBus.publish('report.generated', { reportId: report.id }, 'APP-04');
  
  return { reportId: report.id };
}, 10); // 10 concurrent reports

// Schedule weekly reports for all active projects
export async function scheduleWeeklyReports() {
  const activeProjects = await prisma.project.findMany({
    where: { status: 'ACTIVE' }
  });
  
  for (const project of activeProjects) {
    await reportQueue.add(`weekly-${project.id}`, {
      projectId: project.id,
      weekEnding: getNextMonday()
    }, {
      repeat: { pattern: '0 6 * * 1' } // Every Monday at 6am
    });
  }
}
```

---

### Step 24: APP-05 - Permit Tracker
**Time:** 3 days

**Purpose:** Automated permit status tracking

```typescript
// packages/automation/src/apps/permit-tracker/worker.ts
export const permitWorker = createWorker('permit-tracker', async (job) => {
  const { permitId } = job.data;
  
  // 1. Fetch permit
  const permit = await prisma.permit.findUnique({ where: { id: permitId } });
  
  // 2. Check status with jurisdiction (API or scraping)
  const currentStatus = await checkPermitStatus(
    permit.jurisdictionId,
    permit.permitNumber
  );
  
  // 3. If status changed
  if (currentStatus !== permit.status) {
    await prisma.permit.update({
      where: { id: permitId },
      data: { status: currentStatus, lastChecked: new Date() }
    });
    
    // 4. Notify if approved or rejected
    if (currentStatus === 'APPROVED') {
      await eventBus.publish('permit.approved', { permitId }, 'APP-05');
      await notifyPermitApproved(permit);
    }
    
    if (currentStatus === 'REJECTED') {
      await eventBus.publish('permit.rejected', { permitId }, 'APP-05');
      await createCorrectionsTask(permit);
    }
  }
  
  return { permitId, status: currentStatus };
}, 20);

// Check all active permits daily
export async function schedulePermitChecks() {
  const activePermits = await prisma.permit.findMany({
    where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } }
  });
  
  for (const permit of activePermits) {
    await permitQueue.add(`check-${permit.id}`, {
      permitId: permit.id
    }, {
      repeat: { pattern: '0 9 * * *' } // Daily at 9am
    });
  }
}
```

---

### Step 25: APP-07 - Budget Tracker

**Purpose:** Real-time budget monitoring

```typescript
// packages/automation/src/apps/budget-tracker/worker.ts
export const budgetWorker = createWorker('budget-tracker', async (job) => {
  const { projectId } = job.data;
  
  // 1. Get project budget
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      budget: true,
      expenses: true,
      changeOrders: true
    }
  });
  
  // 2. Calculate totals
  const totalSpent = project.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCOs = project.changeOrders
    .filter(co => co.status === 'APPROVED')
    .reduce((sum, co) => sum + co.amount, 0);
  const adjustedBudget = project.budget.total + totalCOs;
  const variance = adjustedBudget - totalSpent;
  const percentSpent = (totalSpent / adjustedBudget) * 100;
  
  // 3. Update budget record
  await prisma.projectBudget.update({
    where: { id: project.budget.id },
    data: {
      spent: totalSpent,
      remaining: variance,
      percentComplete: percentSpent,
      lastUpdated: new Date()
    }
  });
  
  // 4. Check for overruns
  if (variance < 0) {
    await eventBus.publish('budget.overrun', {
      projectId,
      amount: Math.abs(variance)
    }, 'APP-07');
    
    await createAlert({
      projectId,
      type: 'BUDGET_OVERRUN',
      severity: 'HIGH',
      message: `Budget overrun: $${Math.abs(variance).toLocaleString()}`
    });
  }
  
  // 5. Check contingency burn rate
  const burnRate = calculateContingencyBurn(project);
  if (burnRate > 75) {
    await createAlert({
      projectId,
      type: 'CONTINGENCY_WARNING',
      severity: 'MEDIUM',
      message: `Contingency ${burnRate}% depleted`
    });
  }
  
  return { projectId, variance, percentSpent };
}, 15);
```

---

### Step 26: APP-08 - Communication Hub

**Purpose:** Automated email/SMS notifications

```typescript
// packages/automation/src/apps/communication-hub/worker.ts
export const communicationWorker = createWorker('communication-hub', async (job) => {
  const { type, recipients, data } = job.data;
  
  switch (type) {
    case 'WEEKLY_REPORT':
      await sendWeeklyReport(recipients, data);
      break;
      
    case 'PERMIT_APPROVED':
      await sendPermitApprovedNotification(recipients, data);
      break;
      
    case 'MILESTONE_COMPLETE':
      await sendMilestoneNotification(recipients, data);
      break;
      
    case 'BUDGET_ALERT':
      await sendBudgetAlert(recipients, data);
      break;
  }
  
  // Log delivery
  await prisma.communicationLog.create({
    data: {
      type,
      recipients: recipients.map(r => r.email),
      status: 'SENT',
      sentAt: new Date()
    }
  });
  
  return { delivered: true };
}, 50); // High concurrency for communications

async function sendWeeklyReport(recipients, data) {
  const html = renderReportTemplate(data.reportId);
  
  for (const recipient of recipients) {
    if (recipient.emailEnabled) {
      await resend.emails.send({
        from: 'reports@kealee.com',
        to: recipient.email,
        subject: `Weekly Progress Report - ${data.projectName}`,
        html
      });
    }
    
    if (recipient.smsEnabled) {
      await twilio.messages.create({
        to: recipient.phone,
        from: process.env.TWILIO_PHONE,
        body: `Your weekly project report is ready. View at: ${data.reportUrl}`
      });
    }
  }
}
```

---

### Step 27: APP-09 - Task Queue Manager

**Purpose:** Auto-assign tasks to PM team

```typescript
// packages/automation/src/apps/task-queue/worker.ts
export const taskWorker = createWorker('task-queue', async (job) => {
  const { projectId, phase } = job.data;
  
  // 1. Get project phase
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { assignedPM: true }
  });
  
  // 2. Generate phase-appropriate tasks
  const tasks = getTasksForPhase(phase);
  
  // 3. Create tasks in database
  for (const taskTemplate of tasks) {
    await prisma.task.create({
      data: {
        projectId,
        title: taskTemplate.title,
        description: taskTemplate.description,
        assignedTo: project.assignedPM.id,
        dueDate: calculateDueDate(taskTemplate.daysFromStart),
        priority: taskTemplate.priority,
        status: 'PENDING'
      }
    });
  }
  
  // 4. Publish event
  await eventBus.publish('tasks.created', {
    projectId,
    count: tasks.length
  }, 'APP-09');
  
  return { tasksCreated: tasks.length };
});

function getTasksForPhase(phase: string) {
  const taskLibrary = {
    'PERMIT': [
      { title: 'Submit building permit', daysFromStart: 0, priority: 'HIGH' },
      { title: 'Follow up with jurisdiction', daysFromStart: 3, priority: 'MEDIUM' },
      { title: 'Schedule pre-construction meeting', daysFromStart: 5, priority: 'HIGH' }
    ],
    'CONSTRUCTION': [
      { title: 'Schedule rough-in inspection', daysFromStart: 14, priority: 'HIGH' },
      { title: 'Coordinate sub schedules', daysFromStart: 0, priority: 'HIGH' },
      { title: 'Weekly site visit', daysFromStart: 7, priority: 'MEDIUM' }
    ],
    // ... more phases
  };
  
  return taskLibrary[phase] || [];
}
```

---

## 5.3 Event-Driven Workflows (Week 9)

### Step 28: Cross-App Event Handling
**Time:** 3 days

**Setup event listeners:**
```typescript
// packages/automation/src/infrastructure/event-handlers.ts
import { eventBus } from './event-bus';

export function setupEventHandlers() {
  eventBus.subscribe(async (event, data, source) => {
    console.log(`📨 Received event: ${event} from ${source}`);
    
    switch (event) {
      case 'project.milestone.completed':
        // Trigger multiple apps
        await reportQueue.add('milestone-report', { 
          projectId: data.projectId,
          milestoneId: data.milestoneId 
        });
        await budgetQueue.add('update-forecast', {
          projectId: data.projectId
        });
        // APP-06 schedules inspection
        break;
        
      case 'permit.approved':
        // Update project status, notify team
        await taskQueue.add('permit-approved-tasks', {
          projectId: data.projectId
        });
        await communicationQueue.add('send-notification', {
          type: 'PERMIT_APPROVED',
          projectId: data.projectId
        });
        break;
        
      case 'budget.overrun':
        // Risk alert, decision needed
        await alertQueue.add('create-alert', {
          projectId: data.projectId,
          type: 'BUDGET',
          severity: 'HIGH'
        });
        break;
    }
  });
}
```

---

## 5.4 Command Center Dashboard

### Step 29: Build os-admin Command Center UI

**Create:**
```
apps/os-admin/app/(dashboard)/command-center/
├── page.tsx                    # Main dashboard
├── layout.tsx                  # Sidebar with 15 apps
├── [appId]/
│   ├── page.tsx               # Individual app view
│   └── jobs/page.tsx          # Job history
└── components/
    ├── AppStatusCard.tsx       # Health status card
    ├── JobQueueChart.tsx       # Queue depth chart
    ├── PerformanceMetrics.tsx  # Processing time metrics
    └── AlertsFeed.tsx          # Real-time alerts
```

**Main dashboard:**
```typescript
export default async function CommandCenterPage() {
  // 1. Fetch status of all 15 apps
  const appsStatus = await Promise.all(
    ALL_APPS.map(app => fetchAppStatus(app.id))
  );
  
  // 2. Aggregate metrics
  const totalJobs = appsStatus.reduce((sum, app) => sum + app.jobsProcessed, 0);
  const totalFailed = appsStatus.reduce((sum, app) => sum + app.failedJobs, 0);
  const avgProcessingTime = calculateAverage(appsStatus.map(a => a.avgTime));
  
  return (
    <div className="p-6">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Jobs" value={totalJobs} />
        <StatCard title="Success Rate" value={`${((totalJobs - totalFailed) / totalJobs * 100).toFixed(1)}%`} />
        <StatCard title="Avg Processing" value={`${avgProcessingTime}ms`} />
        <StatCard title="Active Apps" value={`${appsStatus.filter(a => a.healthy).length}/15`} />
      </div>
      
      {/* Apps Grid */}
      <div className="grid grid-cols-3 gap-4">
        {appsStatus.map(app => (
          <AppStatusCard
            key={app.id}
            name={app.name}
            status={app.status}
            jobsProcessed={app.jobsProcessed}
            queueDepth={app.queueDepth}
            href={`/command-center/${app.id}`}
          />
        ))}
      </div>
      
      {/* Real-time Alerts */}
      <AlertsFeed />
    </div>
  );
}
```

---

## Phase 5 Deliverables

✅ Redis + BullMQ infrastructure operational
✅ Event bus publishing/subscribing
✅ Worker manager starting all apps
✅ First 5 apps built and running:
  - APP-04: Report Generator
  - APP-05: Permit Tracker
  - APP-07: Budget Tracker
  - APP-08: Communication Hub
  - APP-09: Task Queue Manager
✅ Command Center dashboard showing status
✅ Event-driven workflows functional

**Outcome:** Basic automation working - reports generate, permits track, budgets monitor

---

# PHASE 6: AI Integration (3-4 weeks)

## Goal
Add real AI analysis to make features intelligent and predictive.

---

## 6.1 AI Infrastructure (Week 11)

### Step 30: Claude API Integration
**Time:** 2 days

**Setup:**
```typescript
// packages/automation/src/infrastructure/ai.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export async function analyzeWithClaude(
  prompt: string,
  context: any,
  maxTokens = 2000
) {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: maxTokens,
    messages: [{
      role: "user",
      content: prompt
    }]
  });
  
  return response.content[0].text;
}

export async function analyzeImage(imageBase64: string, prompt: string) {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: imageBase64
          }
        },
        {
          type: "text",
          text: prompt
        }
      ]
    }]
  });
  
  return response.content[0].text;
}

// Response caching for code databases and repeated queries
export async function analyzeWithCache(prompt: string, cacheKey: string) {
  const cached = await redis.get(`ai:cache:${cacheKey}`);
  if (cached) return JSON.parse(cached);
  
  const result = await analyzeWithClaude(prompt, {});
  await redis.setex(`ai:cache:${cacheKey}`, 3600, JSON.stringify(result));
  
  return result;
}
```

---

### Step 31: APP-11 - Predictive Engine (AI)

**Purpose:** ML-driven risk prediction

```typescript
// packages/automation/src/apps/predictive-engine/worker.ts
import { analyzeWithClaude } from '../../infrastructure/ai';

export const predictiveWorker = createWorker('predictive-engine', async (job) => {
  const { projectId } = job.data;
  
  // 1. Gather project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      schedule: true,
      budget: true,
      permits: true,
      tasks: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } },
      weather: { where: { date: { gte: new Date() } } }
    }
  });
  
  // 2. Build analysis prompt
  const prompt = `
    Analyze this construction project for risks:
    
    Project: ${project.name}
    Budget: $${project.budget.total} (${project.budget.percentComplete}% spent)
    Schedule: ${project.schedule.percentComplete}% complete
    Days remaining: ${calculateDaysRemaining(project.schedule.endDate)}
    
    Permits: ${project.permits.length} total
    - Pending: ${project.permits.filter(p => p.status === 'SUBMITTED').length}
    - Approved: ${project.permits.filter(p => p.status === 'APPROVED').length}
    
    Open tasks: ${project.tasks.length}
    - Overdue: ${project.tasks.filter(t => t.dueDate < new Date()).length}
    
    Weather forecast: ${project.weather.map(w => w.condition).join(', ')}
    
    Analyze and provide:
    1. Top 3 risks (with probability %)
    2. Specific recommendations
    3. Priority actions
    4. Predicted completion date
    5. Budget forecast
    
    Format as JSON.
  `;
  
  // 3. Get AI analysis
  const analysisText = await analyzeWithClaude(prompt, project);
  const analysis = JSON.parse(analysisText);
  
  // 4. Store predictions
  await prisma.projectPrediction.create({
    data: {
      projectId,
      risks: analysis.risks,
      recommendations: analysis.recommendations,
      predictedCompletion: analysis.completionDate,
      budgetForecast: analysis.budgetForecast,
      confidence: analysis.confidence || 0.85,
      generatedAt: new Date()
    }
  });
  
  // 5. Create alerts for high-risk items
  for (const risk of analysis.risks.filter(r => r.probability > 0.7)) {
    await eventBus.publish('risk.detected', {
      projectId,
      riskType: risk.type,
      probability: risk.probability,
      impact: risk.impact
    }, 'APP-11');
    
    await createAlert({
      projectId,
      type: 'PREDICTED_RISK',
      severity: risk.impact === 'HIGH' ? 'HIGH' : 'MEDIUM',
      message: risk.description,
      recommendation: risk.mitigation
    });
  }
  
  return { projectId, risksFound: analysis.risks.length };
}, 5); // Lower concurrency for AI (expensive)

// Run predictions daily for active projects
export async function schedulePredictions() {
  const activeProjects = await prisma.project.findMany({
    where: { status: 'ACTIVE' }
  });
  
  for (const project of activeProjects) {
    await predictiveQueue.add(`predict-${project.id}`, {
      projectId: project.id
    }, {
      repeat: { pattern: '0 7 * * *' } // Daily at 7am
    });
  }
}
```

---

### Step 32: AI-Powered Report Generation
**Time:** 4 days

**Enhance APP-04 with AI:**
```typescript
// packages/automation/src/apps/report-generator/ai-report.ts
import { analyzeWithClaude } from '../../infrastructure/ai';

export async function generateAIReport(project: Project) {
  // 1. Collect all project data
  const data = {
    name: project.name,
    weekData: await getWeekData(project.id),
    photos: await getRecentPhotos(project.id),
    budget: await getBudgetStatus(project.id),
    schedule: await getScheduleStatus(project.id),
    issues: await getOpenIssues(project.id),
    milestones: await getUpcomingMilestones(project.id)
  };
  
  // 2. Build AI prompt
  const prompt = `
    Generate a professional weekly progress report for this construction project.
    
    Project: ${data.name}
    Week Ending: ${data.weekData.weekEnding}
    
    Progress Summary:
    - Tasks completed this week: ${data.weekData.completedTasks.length}
    - Overall completion: ${data.schedule.percentComplete}%
    - Budget status: ${data.budget.percentSpent}% spent
    
    Photos taken: ${data.photos.length}
    Open issues: ${data.issues.length}
    Upcoming milestones: ${data.milestones.length}
    
    Create a professional report with:
    1. Executive Summary (3-4 sentences)
    2. Progress This Week (narrative paragraph)
    3. Schedule Status (on track / delayed / ahead)
    4. Budget Status (within budget / variance)
    5. Quality Observations (from photos)
    6. Action Items for Next Week (5-7 items)
    7. Concerns or Risks (if any)
    
    Tone: Professional, concise, client-friendly
    Format: Markdown
  `;
  
  // 3. Generate report with AI
  const reportMarkdown = await analyzeWithClaude(prompt, data);
  
  // 4. Enhance with photo analysis if available
  if (data.photos.length > 0) {
    const photoAnalysis = await analyzePhotos(data.photos);
    reportMarkdown += `\n\n## Visual Progress\n${photoAnalysis}`;
  }
  
  // 5. Convert to PDF
  const reportPdf = await markdownToPdf(reportMarkdown);
  
  // 6. Upload to storage
  const fileUrl = await uploadReport(project.id, reportPdf);
  
  return {
    markdown: reportMarkdown,
    pdfUrl: fileUrl,
    generatedAt: new Date()
  };
}

async function analyzePhotos(photos: Photo[]) {
  const analyses = await Promise.all(
    photos.slice(0, 5).map(async (photo) => {
      const base64 = await fetchPhotoBase64(photo.url);
      const analysis = await analyzeImage(
        base64,
        "Describe construction progress visible in this photo. Note any quality issues or concerns."
      );
      return `**${photo.description}**: ${analysis}`;
    })
  );
  
  return analyses.join('\n\n');
}
```

---

### Step 33: AI Permit Compliance Engine

**Real AI compliance checking:**
```typescript
// apps/m-permits-inspections/lib/ai/compliance-engine.ts
import { analyzeWithClaude } from '@kealee/automation';

export async function runComplianceCheck(permitApplication: any) {
  // 1. Load local code database for jurisdiction
  const codes = await loadCodeDatabase(permitApplication.jurisdictionId);
  
  // 2. Extract text from plans (OCR if needed)
  const planText = await extractPlanText(permitApplication.plans);
  
  // 3. Build compliance check prompt
  const prompt = `
    Review this building permit application for code compliance issues:
    
    Jurisdiction: ${permitApplication.jurisdiction}
    Permit Type: ${permitApplication.type}
    Project: ${permitApplication.description}
    
    Applicable Codes:
    ${codes.map(c => `- ${c.code}: ${c.title}`).join('\n')}
    
    Plan Details:
    ${planText}
    
    Application Data:
    - Lot size: ${permitApplication.lotSize}
    - Building area: ${permitApplication.buildingArea}
    - Setbacks: Front ${permitApplication.setbackFront}, Rear ${permitApplication.setbackRear}
    - Stories: ${permitApplication.stories}
    - Occupancy: ${permitApplication.occupancy}
    
    Check for violations of:
    1. Zoning requirements (lot coverage, height, setbacks)
    2. Building code issues
    3. Fire code requirements
    4. ADA compliance (if commercial)
    5. Energy code compliance
    6. Missing required information
    
    Provide:
    - List of violations found (with code references)
    - Severity (Critical / Major / Minor)
    - Specific recommendations to fix
    - Overall approval likelihood (%)
    
    Format as JSON.
  `;
  
  // 4. Run AI analysis
  const analysisText = await analyzeWithClaude(prompt, permitApplication, 4000);
  const compliance = JSON.parse(analysisText);
  
  // 5. Store results
  await prisma.permitReview.create({
    data: {
      permitId: permitApplication.id,
      reviewType: 'AI_COMPLIANCE',
      findings: compliance.violations,
      recommendations: compliance.recommendations,
      approvalLikelihood: compliance.approvalLikelihood,
      reviewedAt: new Date()
    }
  });
  
  return compliance;
}
```

---

### Step 34: AI Schedule Optimization (APP-12)
**Time:** 4 days

```typescript
// packages/automation/src/apps/smart-scheduler/worker.ts
export const schedulerWorker = createWorker('smart-scheduler', async (job) => {
  const { projectId } = job.data;
  
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      milestones: true,
      resources: true,
      weather: true
    }
  });
  
  const prompt = `
    Optimize this construction schedule:
    
    Project duration: ${project.duration} days
    Tasks: ${project.tasks.length}
    Critical path: ${identifyCriticalPath(project.tasks)}
    
    Current issues:
    - ${project.tasks.filter(t => t.isDelayed).length} delayed tasks
    - Weather delays: ${project.weather.filter(w => w.workable === false).length} days
    - Resource conflicts: ${findResourceConflicts(project.tasks)}
    
    Provide:
    1. Optimized schedule (task order, durations)
    2. Critical path analysis
    3. Resource leveling recommendations
    4. Weather mitigation strategies
    5. New estimated completion date
    
    Format as JSON with specific task adjustments.
  `;
  
  const optimization = await analyzeWithClaude(prompt, project);
  const schedule = JSON.parse(optimization);
  
  // Apply optimizations
  for (const adjustment of schedule.taskAdjustments) {
    await prisma.task.update({
      where: { id: adjustment.taskId },
      data: {
        startDate: adjustment.newStartDate,
        duration: adjustment.newDuration,
        aiOptimized: true
      }
    });
  }
  
  return { projectId, tasksOptimized: schedule.taskAdjustments.length };
});
```

---

### Step 35: AI QA Inspector (APP-13)

**Vision-based quality inspection:**
```typescript
// packages/automation/src/apps/qa-inspector/worker.ts
import { analyzeImage } from '../../infrastructure/ai';

export const qaWorker = createWorker('qa-inspector', async (job) => {
  const { photoId } = job.data;
  
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { project: true }
  });
  
  // 1. Fetch image
  const imageBase64 = await fetchImageBase64(photo.url);
  
  // 2. AI analysis prompt
  const prompt = `
    You are a construction quality inspector. Analyze this construction site photo.
    
    Project type: ${photo.project.type}
    Phase: ${photo.project.phase}
    Trade: ${photo.category}
    
    Identify:
    1. Quality issues or defects
    2. Safety violations
    3. Code compliance concerns
    4. Missing items or incomplete work
    5. Materials or workmanship problems
    
    For each issue found:
    - Severity (Critical / Major / Minor)
    - Specific location in photo
    - Corrective action needed
    - Code reference (if applicable)
    
    Format as JSON.
  `;
  
  // 3. Run AI vision analysis
  const analysisText = await analyzeImage(imageBase64, prompt);
  const inspection = JSON.parse(analysisText);
  
  // 4. Store findings
  await prisma.qaInspection.create({
    data: {
      photoId,
      projectId: photo.projectId,
      findings: inspection.issues,
      severity: calculateMaxSeverity(inspection.issues),
      inspectedBy: 'APP-13',
      inspectedAt: new Date()
    }
  });
  
  // 5. Create punch list items for critical issues
  for (const issue of inspection.issues.filter(i => i.severity === 'CRITICAL')) {
    await prisma.punchListItem.create({
      data: {
        projectId: photo.projectId,
        description: issue.description,
        location: issue.location,
        severity: 'HIGH',
        status: 'OPEN',
        photoId: photo.id,
        aiDetected: true
      }
    });
    
    // Alert PM immediately
    await eventBus.publish('qa.critical_issue', {
      projectId: photo.projectId,
      issueId: issue.id
    }, 'APP-13');
  }
  
  return { photoId, issuesFound: inspection.issues.length };
}, 3); // Low concurrency (vision is expensive)
```

---

## 6.2 Build Remaining AI Apps

### Step 36: APP-01 - Bid Engine (AI)

**AI bid evaluation:**
```typescript
export const bidWorker = createWorker('bid-engine', async (job) => {
  const { projectId } = job.data;
  
  const bids = await prisma.bid.findMany({
    where: { projectId },
    include: { contractor: { include: { reviews: true, projects: true } } }
  });
  
  const prompt = `
    Evaluate these contractor bids:
    
    ${bids.map(bid => `
    Contractor: ${bid.contractor.name}
    Bid Amount: $${bid.amount}
    Timeline: ${bid.timeline} days
    Rating: ${bid.contractor.rating}/5
    Projects Completed: ${bid.contractor.projects.length}
    Recent Reviews: ${bid.contractor.reviews.slice(0, 3).map(r => r.text).join('; ')}
    `).join('\n\n')}
    
    Score each bid on:
    - Price (30%): Compare to project budget and other bids
    - Timeline (25%): Realistic and meets needs
    - Quality (25%): Based on reviews and portfolio
    - Proximity (10%): Distance to project
    - Availability (10%): Start date alignment
    
    Provide:
    1. Score for each bid (0-100)
    2. Ranking (1st, 2nd, 3rd)
    3. Recommendation with reasoning
    4. Red flags for any bidder
    
    Format as JSON.
  `;
  
  const evaluation = await analyzeWithClaude(prompt, bids);
  const scores = JSON.parse(evaluation);
  
  // Store scores
  for (const score of scores.bids) {
    await prisma.bidEvaluation.create({
      data: {
        bidId: score.bidId,
        aiScore: score.totalScore,
        priceScore: score.priceScore,
        timelineScore: score.timelineScore,
        qualityScore: score.qualityScore,
        recommendation: score.recommendation,
        redFlags: score.redFlags
      }
    });
  }
  
  return { projectId, bidsEvaluated: bids.length };
});
```

---

### Step 37: APP-03 - Change Order Processor (AI)
**Time:** 3 days

**AI change order analysis:**
```typescript
export const changeOrderWorker = createWorker('change-order-processor', async (job) => {
  const { changeOrderId } = job.data;
  
  const co = await prisma.changeOrder.findUnique({
    where: { id: changeOrderId },
    include: {
      project: { include: { budget: true, schedule: true } }
    }
  });
  
  const prompt = `
    Analyze this change order request:
    
    Project: ${co.project.name}
    Original scope: ${co.originalScope}
    Proposed change: ${co.proposedChange}
    
    Contractor quote:
    - Amount: $${co.quotedAmount}
    - Time impact: ${co.timeImpact} days
    - Reason: ${co.reason}
    
    Project context:
    - Current budget: $${co.project.budget.total}
    - Spent to date: $${co.project.budget.spent}
    - Remaining: $${co.project.budget.remaining}
    - Schedule: ${co.project.schedule.percentComplete}% complete
    
    Evaluate:
    1. Is the change necessary or optional?
    2. Is the price reasonable? (compare to industry standards)
    3. Is the time impact realistic?
    4. Are there alternative approaches?
    5. What's the risk of NOT doing this change?
    6. Recommend: Approve / Negotiate / Reject
    
    Format as JSON with detailed reasoning.
  `;
  
  const analysis = await analyzeWithClaude(prompt, co, 2000);
  const evaluation = JSON.parse(analysis);
  
  // Store analysis
  await prisma.changeOrderAnalysis.create({
    data: {
      changeOrderId,
      necessity: evaluation.necessity,
      priceReasonable: evaluation.priceReasonable,
      timeImpactReasonable: evaluation.timeImpactReasonable,
      alternatives: evaluation.alternatives,
      recommendation: evaluation.recommendation,
      reasoning: evaluation.reasoning,
      analyzedAt: new Date()
    }
  });
  
  // Route for decision
  await eventBus.publish('change_order.analyzed', {
    changeOrderId,
    recommendation: evaluation.recommendation
  }, 'APP-03');
  
  return { changeOrderId, recommendation: evaluation.recommendation };
});
```

---

### Step 38: APP-14 - Decision Support (AI)
**Time:** 3 days

**One-click decision dashboard:**
```typescript
export const decisionWorker = createWorker('decision-support', async (job) => {
  const { userId } = job.data;
  
  // 1. Gather all pending decisions for user's projects
  const decisions = await gatherPendingDecisions(userId);
  
  // 2. For each decision, get AI recommendation
  const decisionsWithAI = await Promise.all(
    decisions.map(async (decision) => {
      const recommendation = await getAIRecommendation(decision);
      return {
        ...decision,
        aiRecommendation: recommendation,
        confidence: recommendation.confidence
      };
    })
  );
  
  // 3. Prioritize by urgency and impact
  const prioritized = decisionsWithAI.sort((a, b) => {
    return (b.urgency * b.impact) - (a.urgency * a.impact);
  });
  
  // 4. Create decision queue dashboard
  await prisma.decisionQueue.create({
    data: {
      userId,
      decisions: prioritized,
      generatedAt: new Date()
    }
  });
  
  return { decisionsQueued: prioritized.length };
});

async function gatherPendingDecisions(userId: string) {
  const [
    pendingBids,
    pendingCOs,
    pendingPayments,
    pendingScheduleChanges
  ] = await Promise.all([
    prisma.bid.findMany({ where: { status: 'PENDING', pmId: userId } }),
    prisma.changeOrder.findMany({ where: { status: 'PENDING_APPROVAL', pmId: userId } }),
    prisma.paymentRequest.findMany({ where: { status: 'PENDING', pmId: userId } }),
    prisma.scheduleChange.findMany({ where: { status: 'PENDING', pmId: userId } })
  ]);
  
  return [
    ...pendingBids.map(b => ({ type: 'BID', data: b, urgency: 8 })),
    ...pendingCOs.map(co => ({ type: 'CHANGE_ORDER', data: co, urgency: 7 })),
    ...pendingPayments.map(p => ({ type: 'PAYMENT', data: p, urgency: 9 })),
    ...pendingScheduleChanges.map(s => ({ type: 'SCHEDULE', data: s, urgency: 6 }))
  ];
}
```

---

## Phase 6 Deliverables

✅ Claude API integrated and functional
✅ AI infrastructure (caching, rate limiting)
✅ APP-04: AI-powered report generation
✅ APP-05: Smart permit tracking with AI
✅ APP-11: Predictive risk engine
✅ APP-12: AI schedule optimization
✅ APP-13: Vision-based QA inspection
✅ APP-01: AI bid evaluation
✅ APP-03: AI change order analysis
✅ APP-14: AI decision support

**Outcome:** AI actively analyzing, predicting, and recommending across all projects

---

# PHASE 7: Build Remaining 6 Apps (Week 14-15)

## Step 39: Complete All 15 Apps

### APP-02: Visit Scheduler
**Time:** 2 days
- Auto-schedule PM site visits
- Google Calendar integration
- Route optimization

### APP-06: Inspection Coordinator
**Time:** 3 days
- Auto-schedule inspections based on milestones
- Coordinate with inspectors
- Track pass/fail results

### APP-10: Document Generator
**Time:** 3 days
- Generate contracts, proposals, SOWs
- DocuSign integration
- Template system

### Remaining Time: Polish, Testing, Bug Fixes

---

# COMPLETE IMPLEMENTATION CHECKLIST

## Phase 1: Marketing & Lead Gen ✅ COMPLETE
- [x] Development marketing site (5 pages)
- [x] GC Operations marketing site (5 pages)
- [x] Permits marketing site (5 pages)
- [x] Lead capture forms (3 forms)
- [x] Database models (9 models)
- [x] API endpoints (31 endpoints)
- [x] Admin dashboards (3 dashboards)

## Phase 2: User Onboarding (6 steps)
- [ ] Supabase Auth configuration
- [ ] User signup/login pages
- [ ] Email verification flow
- [ ] Auto user creation on lead conversion
- [ ] Protected routes middleware
- [ ] Basic user dashboard
- [ ] Profile management

**Files to create:** ~15 files

## Phase 3: Billing & Subscriptions (4 steps)
- [ ] Stripe products setup (43 products)
- [ ] Checkout flow pages
- [ ] Payment method collection
- [ ] Subscription creation
- [ ] Webhook handling
- [ ] Trial management
- [ ] Recurring billing
- [ ] Subscription management UI

**Files to create:** ~20 files

## Phase 4: Basic Service Delivery (5 steps)
- [ ] Project import/creation
- [ ] Permit tracking UI (manual updates)
- [ ] Report creation interface (manual)
- [ ] Document upload & organization
- [ ] Task lists
- [ ] Budget tracking UI
- [ ] Client communication
- [ ] Basic os-pm workspace

**Files to create:** ~40 files

## Phase 5: Command Center (10 steps)
- [ ] Redis setup (Railway)
- [ ] BullMQ infrastructure
- [ ] Event bus system
- [ ] Queue manager
- [ ] Worker startup scripts
- [ ] Build 5 core apps (Report, Permit, Budget, Comm, Task)
- [ ] Command Center dashboard (os-admin)
- [ ] Monitoring & alerts
- [ ] Event-driven workflows

**Files to create:** ~60 files

## Phase 6: AI Integration (9 steps)
- [ ] Claude API integration
- [ ] AI infrastructure (caching, rate limiting)
- [ ] APP-04: AI report generation
- [ ] APP-11: Predictive risk engine
- [ ] APP-12: AI schedule optimization
- [ ] APP-13: Vision QA inspector
- [ ] APP-01: AI bid evaluation
- [ ] APP-03: AI change order analysis
- [ ] APP-14: AI decision support
- [ ] Permit compliance engine (real AI)

**Files to create:** ~50 files

## Phase 7: Complete Remaining Apps (3 steps)
- [ ] APP-02: Visit Scheduler
- [ ] APP-06: Inspection Coordinator
- [ ] APP-10: Document Generator
- [ ] Polish all features
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Production deployment

**Files to create:** ~30 files

---

# DEPLOYMENT ARCHITECTURE

## Development Environment (Current)
```
Local Servers:
- Port 3005: Development marketing + admin
- Port 3006: GC Operations marketing + admin  
- Port 5173: Permits marketing + admin
- Port 5555: Prisma Studio

Database: Supabase PostgreSQL
```

## Production Architecture (Target)

```
Vercel (Frontends):
├── development.kealee.com      → m-ops-services (Development)
├── operations.kealee.com       → m-ops-services (GC Ops)
├── permits.kealee.com          → m-permits-inspections
├── app.kealee.com              → m-project-owner (client dashboards)
├── pm.kealee.com               → os-pm (PM workspace)
└── admin.kealee.com            → os-admin (command center)

Railway (Backend):
├── api.kealee.com              → Fastify API
├── workers                     → 15 Command Center apps
└── redis                       → Event bus + queues

Supabase:
├── PostgreSQL                  → Database
├── Auth                        → Authentication
└── Storage                     → Files/documents

External Services:
├── Stripe                      → Payments
├── Anthropic (Claude)          → AI analysis
├── Resend                      → Email
├── Twilio                      → SMS
└── DocuSign                    → E-signatures
```

---

# SUMMARY

## Current State ✅
- **25% Complete**
- Lead generation working
- Admin tools functional
- Ready for Phase 2

## To MVP (Phases 2-4)
- **Weeks:** 7-10 weeks
- **Outcome:** Basic services deliverable (manual)
- **Revenue:** Can start collecting payments

## To Full Automation (Phases 2-7)
- **Weeks:** 16-23 weeks (4-6 months)
- **Outcome:** Complete platform with AI automation
- **Scale:** Can serve hundreds of clients with minimal ops team

---

## Implementation Approach

**Sequential Development (37 steps total):**

### MVP Track (Steps 1-19):
- Phase 2: User Onboarding (6 steps)
- Phase 3: Billing & Subscriptions (4 steps)
- Phase 4: Basic Service Delivery (5 steps)
- **Result:** Can deliver services manually, start generating revenue

### Full Automation Track (Steps 20-39):
- Phase 5: Command Center Infrastructure (10 steps)
- Phase 6: AI Integration (9 steps)
- Phase 7: Complete Platform (3 steps)
- **Result:** Fully automated, AI-powered service delivery

**Note:** With AI assistance, development can be significantly accelerated. Traditional timeline estimates don't apply when using AI for code generation and implementation.

---

## Quick Win Strategy

**Option: Launch with Manual Service Delivery**

Build Phases 2-4 first (19 steps):
- Users can sign up ✅
- Billing works ✅
- Basic interface for tracking ✅
- Ops team delivers services manually ✅
- **Revenue starts flowing** 💰

Then build Phases 5-7 while generating revenue:
- Automation reduces ops cost
- AI improves service quality
- Scale without hiring

**This gets you to market faster and validates demand before full automation investment.**

**With AI-assisted development, implementation speed can be significantly accelerated.**

---

**Roadmap saved to:** `MVP_TO_FULL_AUTOMATION_ROADMAP.md`

**Next step:** Decide if you want MVP (7-10 weeks) or full automation (16-23 weeks)

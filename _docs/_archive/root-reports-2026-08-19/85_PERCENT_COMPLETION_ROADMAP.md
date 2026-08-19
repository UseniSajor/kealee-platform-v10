# 🎯 85% Completion Roadmap
## Item-by-Item Action Plan for All Apps

**Target:** Get all 8 apps from current completion (20-70%) to 85% completion  
**Priority:** Revenue-critical apps first, then internal tools  
**Estimated Time:** 3-4 weeks focused development

---

## 📊 Current Status Summary

| App | Current % | Target % | Gap | Priority |
|-----|-----------|----------|-----|----------|
| **m-ops-services** | 45% | 85% | +40% | 🔴 **CRITICAL** (Primary revenue) |
| **m-project-owner** | 50% | 85% | +35% | 🔴 **CRITICAL** (Platform fees) |
| **os-admin** | 60% | 85% | +25% | 🟡 **HIGH** (Internal ops) |
| **os-pm** | 55% | 85% | +30% | 🟡 **HIGH** (Internal ops) |
| **API Service** | 70% | 85% | +15% | 🔴 **CRITICAL** (Backend) |
| **m-architect** | 35% | 85% | +50% | 🟠 **MEDIUM** (Revenue stream) |
| **m-permits-inspections** | 30% | 85% | +55% | 🟠 **MEDIUM** (Revenue stream) |
| **m-marketplace** | 20% | 85% | +65% | 🟢 **LOW** (Landing page done) |

---

## 🔴 PRIORITY 1: Revenue-Critical Apps

### 1. m-ops-services (45% → 85%) - **PRIMARY REVENUE STREAM**

**Current:** $1.9M-$2.2M Year 1 revenue target  
**Blocker:** Stripe webhook handler is placeholder

#### ✅ Items to Complete (40% gap):

**A. Payment Processing (30% → 100%)**
- [ ] **1.1** Implement Stripe webhook handler (`services/api/src/modules/billing/billing.routes.ts`)
  - Handle `checkout.session.completed` event
  - Create subscription record in database
  - Link subscription to organization
  - Set subscription status (active, canceled, past_due)
  - Store Stripe customer ID and subscription ID
  - **File:** `services/api/src/modules/billing/billing.routes.ts`
  - **Time:** 4 hours

- [ ] **1.2** Implement `customer.subscription.updated` webhook handler
  - Update subscription status in database
  - Handle plan changes (upgrade/downgrade)
  - Update billing period dates
  - **File:** `services/api/src/modules/billing/billing.routes.ts`
  - **Time:** 2 hours

- [ ] **1.3** Implement `customer.subscription.deleted` webhook handler
  - Mark subscription as canceled
  - Disable organization entitlements
  - Send cancellation notification
  - **File:** `services/api/src/modules/billing/billing.routes.ts`
  - **Time:** 1 hour

- [ ] **1.4** Implement `invoice.payment_succeeded` webhook handler
  - Create invoice record in database
  - Update subscription billing status
  - Send invoice email notification
  - **File:** `services/api/src/modules/billing/billing.routes.ts`
  - **Time:** 2 hours

- [ ] **1.5** Implement `invoice.payment_failed` webhook handler
  - Mark subscription as past_due
  - Send payment failure notification
  - Disable features if grace period expired
  - **File:** `services/api/src/modules/billing/billing.routes.ts`
  - **Time:** 2 hours

- [ ] **1.6** Add webhook signature verification
  - Verify Stripe webhook signature
  - Reject invalid signatures
  - Log verification failures
  - **File:** `services/api/src/modules/billing/billing.routes.ts`
  - **Time:** 1 hour

**B. Subscription Management (20% → 100%)**
- [ ] **1.7** Create subscription service (`services/api/src/modules/billing/subscription.service.ts`)
  - `getSubscriptionByOrgId(orgId)` - Get org subscription
  - `getSubscriptionByStripeId(stripeSubscriptionId)` - Get by Stripe ID
  - `updateSubscriptionStatus()` - Update status
  - `cancelSubscription()` - Cancel subscription
  - **Time:** 3 hours

- [ ] **1.8** Create subscription API routes
  - `GET /billing/subscriptions/:orgId` - Get subscription
  - `PUT /billing/subscriptions/:orgId/cancel` - Cancel subscription
  - `GET /billing/subscriptions/:orgId/invoices` - List invoices
  - **File:** `services/api/src/modules/billing/billing.routes.ts`
  - **Time:** 2 hours

- [ ] **1.9** Connect customer portal to subscription API
  - Replace mock subscription data with API call
  - Display real subscription status
  - Show billing history
  - **File:** `apps/m-ops-services/app/(portal)/portal/page.tsx`
  - **Time:** 2 hours

**C. Service Request Backend (20% → 100%)**
- [ ] **1.10** Connect service request form to API
  - Replace placeholder with `POST /ops-services/requests`
  - Save request to database
  - Link to organization
  - **File:** `apps/m-ops-services/components/portal/ServiceRequestWizard.tsx`
  - **Time:** 2 hours

- [ ] **1.11** Create service request API routes
  - `POST /ops-services/requests` - Create request
  - `GET /ops-services/requests` - List requests (filtered by org)
  - `GET /ops-services/requests/:id` - Get request
  - `PUT /ops-services/requests/:id` - Update request
  - **File:** `services/api/src/modules/ops-services/ops-services.routes.ts` (create if needed)
  - **Time:** 3 hours

- [ ] **1.12** Create service request service
  - `createServiceRequest()` - Create request
  - `listServiceRequests()` - List with filtering
  - `updateServiceRequest()` - Update request
  - **File:** `services/api/src/modules/ops-services/ops-services.service.ts` (create if needed)
  - **Time:** 2 hours

**D. Weekly Reports Backend (15% → 100%)**
- [ ] **1.13** Create weekly report generation API
  - `POST /ops-services/reports/generate` - Generate report
  - `GET /ops-services/reports` - List reports
  - `GET /ops-services/reports/:id` - Get report
  - **File:** `services/api/src/modules/ops-services/ops-services.routes.ts`
  - **Time:** 3 hours

- [ ] **1.14** Connect weekly report viewer to API
  - Replace mock data with API call
  - Display real reports from database
  - **File:** `apps/m-ops-services/components/portal/WeeklyReportViewer.tsx`
  - **Time:** 2 hours

- [ ] **1.15** Implement report generation logic
  - Aggregate project data for week
  - Generate PDF report
  - Store report in database
  - **File:** `services/api/src/modules/ops-services/report-generator.service.ts` (create)
  - **Time:** 4 hours

**E. Billing Page Integration (10% → 100%)**
- [ ] **1.16** Connect billing page to subscription API
  - Display real invoices
  - Show payment history
  - Display current plan
  - **File:** `apps/m-ops-services/app/(portal)/portal/billing/page.tsx` (create if needed)
  - **Time:** 2 hours

**Total Time:** ~35 hours (1 week focused)

---

### 2. m-project-owner (50% → 85%) - **PLATFORM FEES REVENUE**

**Current:** 3% platform fees on all transactions  
**Blocker:** Payment processing incomplete

#### ✅ Items to Complete (35% gap):

**A. Payment Processing (20% → 100%)**
- [ ] **2.1** Implement milestone payment processing
  - Connect milestone approval to payment release
  - Calculate 3% platform fee
  - Create Stripe payment intent
  - Release payment to contractor
  - **File:** `services/api/src/modules/payments/payment.routes.ts`
  - **Time:** 4 hours

- [ ] **2.2** Implement platform fee calculation service
  - Calculate 3% fee on milestone amount
  - Store fee in database
  - Create fee invoice
  - **File:** `services/api/src/modules/payments/platform-fee.service.ts` (create)
  - **Time:** 2 hours

- [ ] **2.3** Connect payment release UI to API
  - Replace placeholder with `POST /payments/milestones/:id/release`
  - Show platform fee breakdown
  - Display payment status
  - **File:** `apps/m-project-owner/components/PaymentReleasePanel.tsx`
  - **Time:** 2 hours

- [ ] **2.4** Implement escrow deposit processing
  - Connect deposit form to `POST /escrow/:id/deposit`
  - Process Stripe payment
  - Update escrow balance
  - **File:** `apps/m-project-owner/app/projects/[id]/contracts/[contractId]/escrow/page.tsx` (if exists)
  - **Time:** 3 hours

**B. Contract Integration (30% → 100%)**
- [ ] **2.5** Implement DocuSign integration
  - Replace placeholder with real DocuSign API calls
  - Create envelope from contract template
  - Send for signature
  - Track signature status
  - **File:** `services/api/src/modules/docusign/docusign.routes.ts`
  - **Time:** 6 hours

- [ ] **2.6** Connect contract signing workflow
  - Replace mock workflow with real DocuSign integration
  - Update contract status on signature
  - Notify parties on completion
  - **File:** `apps/m-project-owner/app/projects/[id]/contracts/[contractId]/page.tsx`
  - **Time:** 3 hours

- [ ] **2.7** Implement contract status polling
  - Poll DocuSign for signature status
  - Update UI when signed
  - Trigger next workflow step
  - **File:** `apps/m-project-owner/components/ContractStatus.tsx` (create if needed)
  - **Time:** 2 hours

**C. Frontend API Integration (50% → 100%)**
- [ ] **2.8** Connect project creation to API
  - Replace any mock data with `POST /projects`
  - Save project to database
  - Link to user organization
  - **File:** `apps/m-project-owner/app/projects/new/page.tsx`
  - **Time:** 2 hours

- [ ] **2.9** Connect milestone submission to API
  - Replace placeholder with `POST /milestones/:id/submit`
  - Upload evidence files
  - Update milestone status
  - **File:** `apps/m-project-owner/components/MilestoneSubmissionForm.tsx`
  - **Time:** 2 hours

- [ ] **2.10** Connect milestone approval to API
  - Replace placeholder with `POST /milestones/:id/approve`
  - Trigger payment release
  - Update project status
  - **File:** `apps/m-project-owner/components/EvidenceReviewPanel.tsx`
  - **Time:** 2 hours

- [ ] **2.11** Connect dispute initiation to API
  - Replace placeholder with `POST /disputes`
  - Create dispute record
  - Freeze payments
  - **File:** `apps/m-project-owner/components/DisputeInitiationForm.tsx`
  - **Time:** 2 hours

**D. File Upload Integration (40% → 100%)**
- [ ] **2.12** Connect file uploads to S3/R2
  - Replace placeholder with real upload
  - Store file URLs in database
  - Display uploaded files
  - **File:** `apps/m-project-owner/components/EvidenceUpload.tsx` (if exists)
  - **Time:** 3 hours

**Total Time:** ~33 hours (1 week focused)

---

### 3. API Service (70% → 85%) - **BACKEND FOUNDATION**

**Current:** Core routes complete, payment/file storage partial  
**Blocker:** SSL issue, payment/file storage incomplete

#### ✅ Items to Complete (15% gap):

**A. Payment Processing (40% → 100%)**
- [ ] **3.1** Complete Stripe webhook handler (see m-ops-services 1.1-1.6)
  - **Time:** 12 hours (shared with m-ops-services)

- [ ] **3.2** Implement payment routes
  - `POST /payments/milestones/:id/release` - Release milestone payment
  - `POST /payments/escrow/:id/deposit` - Deposit to escrow
  - `GET /payments/transactions` - List transactions
  - **File:** `services/api/src/modules/payments/payment.routes.ts`
  - **Time:** 4 hours

- [ ] **3.3** Implement payment service
  - `processMilestonePayment()` - Process milestone payment
  - `calculatePlatformFee()` - Calculate 3% fee
  - `createPaymentTransaction()` - Record transaction
  - **File:** `services/api/src/modules/payments/payment.service.ts` (create if needed)
  - **Time:** 3 hours

**B. File Storage (30% → 100%)**
- [ ] **3.4** Configure S3/R2 storage
  - Set up bucket configuration
  - Add environment variables
  - Test connection
  - **File:** `services/api/src/modules/storage/storage.service.ts` (create)
  - **Time:** 2 hours

- [ ] **3.5** Implement file upload routes
  - `POST /files/upload` - Upload file
  - `GET /files/:id` - Get file
  - `DELETE /files/:id` - Delete file
  - **File:** `services/api/src/modules/storage/storage.routes.ts` (create)
  - **Time:** 3 hours

- [ ] **3.6** Implement file upload service
  - `uploadFile()` - Upload to S3/R2
  - `getFileUrl()` - Get signed URL
  - `deleteFile()` - Delete from S3/R2
  - **File:** `services/api/src/modules/storage/storage.service.ts`
  - **Time:** 3 hours

**C. SSL Certificate Fix**
- [ ] **3.7** Resolve Railway SSL certificate issue
  - Check Railway dashboard for certificate status
  - Verify domain configuration
  - Test SSL connection
  - **Action:** Manual verification in Railway
  - **Time:** 1 hour

**Total Time:** ~25 hours (3-4 days focused)

---

## 🟡 PRIORITY 2: Internal Operations Apps

### 4. os-admin (60% → 85%) - **PLATFORM MANAGEMENT**

**Current:** UI complete, API integration partial  
**Blocker:** Many pages using mock data

#### ✅ Items to Complete (25% gap):

**A. API Integration (30% → 100%)**
- [ ] **4.1** Connect dashboard to API
  - Replace mock metrics with `GET /events/stats`
  - Display real organization count
  - Display real user count
  - Display real project count
  - **File:** `apps/os-admin/app/dashboard/page.tsx`
  - **Time:** 3 hours

- [ ] **4.2** Connect organizations page to API
  - Replace mock data with `GET /orgs`
  - Implement pagination
  - Add search/filtering
  - **File:** `apps/os-admin/app/orgs/page.tsx`
  - **Time:** 2 hours

- [ ] **4.3** Connect organization detail to API
  - Replace mock data with `GET /orgs/:id`
  - Display real members
  - Display real entitlements
  - **File:** `apps/os-admin/app/orgs/[id]/page.tsx`
  - **Time:** 2 hours

- [ ] **4.4** Connect organization create/edit to API
  - Replace placeholder with `POST /orgs` and `PUT /orgs/:id`
  - Save to database
  - Show success/error messages
  - **File:** `apps/os-admin/app/orgs/new/page.tsx` and `apps/os-admin/app/orgs/[id]/edit/page.tsx`
  - **Time:** 3 hours

- [ ] **4.5** Connect users page to API
  - Replace mock data with `GET /users`
  - Implement pagination
  - Add search/filtering
  - **File:** `apps/os-admin/app/users/page.tsx`
  - **Time:** 2 hours

- [ ] **4.6** Connect user detail to API
  - Replace mock data with `GET /users/:id`
  - Display real user data
  - Display real organizations
  - **File:** `apps/os-admin/app/users/[id]/page.tsx`
  - **Time:** 2 hours

- [ ] **4.7** Connect user create to API
  - Replace placeholder with `POST /users` (or signup endpoint)
  - Save to database
  - Show success/error messages
  - **File:** `apps/os-admin/app/users/new/page.tsx`
  - **Time:** 2 hours

- [ ] **4.8** Connect RBAC page to API
  - Replace mock data with `GET /rbac/roles` and `GET /rbac/permissions`
  - Display real roles and permissions
  - Connect role assignment to `POST /rbac/roles/:roleKey/permissions/:permissionKey`
  - **File:** `apps/os-admin/app/rbac/page.tsx`
  - **Time:** 3 hours

- [ ] **4.9** Connect audit logs page to API
  - Replace mock data with `GET /audit`
  - Implement filtering
  - Add pagination
  - **File:** `apps/os-admin/app/audit/page.tsx`
  - **Time:** 2 hours

- [ ] **4.10** Connect financials page to API
  - Replace placeholder data with real billing data
  - Display real subscriptions
  - Display real invoices
  - **File:** `apps/os-admin/app/financials/page.tsx` (if exists)
  - **Time:** 3 hours

- [ ] **4.11** Connect disputes page to API
  - Replace placeholder data with `GET /disputes`
  - Display real disputes
  - Connect dispute resolution to API
  - **File:** `apps/os-admin/app/disputes/page.tsx` (if exists)
  - **Time:** 3 hours

**B. Error Handling (40% → 100%)**
- [ ] **4.12** Add error boundaries to all pages
  - Wrap pages in error boundary
  - Display user-friendly error messages
  - **File:** Multiple files
  - **Time:** 2 hours

- [ ] **4.13** Add loading states to all API calls
  - Show loading spinner during API calls
  - Disable buttons during submission
  - **File:** Multiple files
  - **Time:** 3 hours

- [ ] **4.14** Add comprehensive error messages
  - Display API error messages
  - Show validation errors
  - **File:** Multiple files
  - **Time:** 2 hours

**Total Time:** ~32 hours (1 week focused)

---

### 5. os-pm (55% → 85%) - **PROJECT MANAGER DASHBOARD**

**Current:** UI complete, backend integration partial  
**Blocker:** Workflow features incomplete

#### ✅ Items to Complete (30% gap):

**A. Backend Integration (40% → 100%)**
- [ ] **5.1** Connect work queue to API
  - Replace mock data with `GET /pm/tasks`
  - Implement filtering and sorting
  - Add pagination
  - **File:** `apps/os-pm/app/(dashboard)/work-queue/page.tsx`
  - **Time:** 3 hours

- [ ] **5.2** Connect task detail to API
  - Replace mock data with `GET /pm/tasks/:id`
  - Display real task data
  - Connect task updates to `PUT /pm/tasks/:id`
  - **File:** `apps/os-pm/app/(dashboard)/work-queue/[taskId]/page.tsx`
  - **Time:** 3 hours

- [ ] **5.3** Connect client assignment to API
  - Replace placeholder with `POST /pm/tasks/:id/assign`
  - Update task assignment
  - Update workload
  - **File:** `apps/os-pm/app/(dashboard)/clients/assign/page.tsx`
  - **Time:** 2 hours

- [ ] **5.4** Connect clients page to API
  - Replace mock data with `GET /projects` (filtered by PM)
  - Display real clients
  - **File:** `apps/os-pm/app/(dashboard)/clients/page.tsx`
  - **Time:** 2 hours

- [ ] **5.5** Connect reports page to API
  - Replace placeholder with real report generation
  - Generate reports from database
  - **File:** `apps/os-pm/app/(dashboard)/reports/page.tsx`
  - **Time:** 4 hours

**B. Workflow Features (30% → 100%)**
- [ ] **5.6** Implement workload balancing algorithm
  - Replace placeholder with real algorithm
  - Calculate PM workload
  - Suggest optimal assignments
  - **File:** `apps/os-pm/lib/workload-balancer.ts` (create)
  - **Time:** 4 hours

- [ ] **5.7** Implement bulk reassign functionality
  - Replace placeholder with real bulk assignment
  - Update multiple tasks at once
  - **File:** `apps/os-pm/components/workload/BulkReassign.tsx`
  - **Time:** 3 hours

- [ ] **5.8** Connect SOP execution workflow
  - Replace placeholder with real SOP execution
  - Trigger SOP steps
  - Track SOP progress
  - **File:** `apps/os-pm/components/sop/SOPExecutor.tsx` (create if needed)
  - **Time:** 4 hours

- [ ] **5.9** Implement WebSocket integration
  - Replace placeholder with real WebSocket connection
  - Receive real-time task updates
  - Update UI in real-time
  - **File:** `apps/os-pm/lib/websocket-client.ts` (create)
  - **Time:** 4 hours

**C. Data Persistence (30% → 100%)**
- [ ] **5.10** Connect task updates to API
  - Replace partial implementation with full API integration
  - Save all task changes
  - **File:** Multiple files
  - **Time:** 3 hours

- [ ] **5.11** Connect client data to API
  - Replace mock data with real API calls
  - Display real client data
  - **File:** `apps/os-pm/app/(dashboard)/clients/[clientId]/page.tsx`
  - **Time:** 2 hours

**Total Time:** ~34 hours (1 week focused)

---

## 🟠 PRIORITY 3: Client-Facing Revenue Apps

### 6. m-architect (35% → 85%) - **ARCHITECT SERVICES**

**Current:** UI structure complete, backend integration minimal  
**Blocker:** File upload and version control incomplete

#### ✅ Items to Complete (50% gap):

**A. Backend Integration (10% → 100%)**
- [ ] **6.1** Connect design project creation to API
  - Replace placeholder with `POST /architect/projects`
  - Save project to database
  - **File:** `apps/m-architect/app/projects/new/page.tsx`
  - **Time:** 2 hours

- [ ] **6.2** Connect project list to API
  - Replace mock data with `GET /architect/projects`
  - Display real projects
  - **File:** `apps/m-architect/app/projects/page.tsx` (if exists)
  - **Time:** 2 hours

- [ ] **6.3** Connect project detail to API
  - Replace mock data with `GET /architect/projects/:id`
  - Display real project data
  - **File:** `apps/m-architect/app/projects/[id]/page.tsx`
  - **Time:** 2 hours

- [ ] **6.4** Connect design phase creation to API
  - Replace placeholder with `POST /architect/phases`
  - Save phase to database
  - **File:** `apps/m-architect/app/projects/[id]/phases/new/page.tsx` (if exists)
  - **Time:** 2 hours

- [ ] **6.5** Connect review workflow to API
  - Replace placeholder with `POST /architect/reviews`
  - Process review workflow
  - Update project status
  - **File:** `apps/m-architect/app/projects/[id]/reviews/[reviewId]/page.tsx`
  - **Time:** 3 hours

**B. File Upload (0% → 100%)**
- [ ] **6.6** Connect file upload to API
  - Replace placeholder with `POST /architect/files/upload`
  - Upload to S3/R2
  - Store file metadata
  - **File:** `apps/m-architect/components/FileUpload.tsx` (if exists)
  - **Time:** 3 hours

- [ ] **6.7** Connect file display to API
  - Replace placeholder with `GET /architect/files/:id`
  - Display uploaded files
  - **File:** Multiple files
  - **Time:** 2 hours

**C. Version Control (0% → 100%)**
- [ ] **6.8** Connect version control to API
  - Replace placeholder with `POST /architect/versions`
  - Track file versions
  - Display version history
  - **File:** `apps/m-architect/components/VersionControl.tsx` (if exists)
  - **Time:** 4 hours

- [ ] **6.9** Implement version comparison
  - Compare file versions
  - Display differences
  - **File:** `apps/m-architect/components/VersionCompare.tsx` (create)
  - **Time:** 3 hours

**D. Quality Control (20% → 100%)**
- [ ] **6.10** Connect quality control to API
  - Replace placeholder with `POST /architect/quality-control`
  - Save checklist results
  - Track quality metrics
  - **File:** `apps/m-architect/app/projects/[id]/quality-control/page.tsx`
  - **Time:** 3 hours

**Total Time:** ~29 hours (4-5 days focused)

---

### 7. m-permits-inspections (30% → 85%) - **PERMITS & INSPECTIONS**

**Current:** Complex UI structure, many placeholders  
**Blocker:** 405+ TODO/FIXME/placeholder matches

#### ✅ Items to Complete (55% gap):

**A. Permit Application (40% → 100%)**
- [ ] **7.1** Connect permit application wizard to API
  - Replace placeholder with `POST /permits/applications`
  - Save application to database
  - **File:** `apps/m-permits-inspections/src/components/permit/application-wizard.tsx`
  - **Time:** 4 hours

- [ ] **7.2** Connect permit submission to API
  - Replace placeholder with `POST /permits/:id/submit`
  - Submit to jurisdiction
  - Update application status
  - **File:** `apps/m-permits-inspections/src/app/api/permits/[id]/submit/route.ts`
  - **Time:** 3 hours

- [ ] **7.3** Connect permit list to API
  - Replace mock data with `GET /permits`
  - Display real permits
  - **File:** `apps/m-permits-inspections/src/app/dashboard/permits/page.tsx` (if exists)
  - **Time:** 2 hours

**B. Inspection Scheduling (30% → 100%)**
- [ ] **7.4** Connect inspection scheduling to API
  - Replace placeholder with `POST /permits/inspections/schedule`
  - Create inspection record
  - **File:** `apps/m-permits-inspections/src/components/inspection/inspection-request-form.tsx`
  - **Time:** 3 hours

- [ ] **7.5** Connect inspection list to API
  - Replace mock data with `GET /permits/inspections`
  - Display real inspections
  - **File:** Multiple files
  - **Time:** 2 hours

**C. Plan Review (20% → 100%)**
- [ ] **7.6** Connect plan review to API
  - Replace placeholder with `POST /permits/reviews`
  - Process review workflow
  - **File:** `apps/m-permits-inspections/src/services/review-workflow/approval-workflow.ts`
  - **Time:** 4 hours

- [ ] **7.7** Connect review comments to API
  - Replace placeholder with `POST /permits/reviews/:id/comments`
  - Save comments to database
  - **File:** `apps/m-permits-inspections/src/components/reviews/review-comments.tsx`
  - **Time:** 2 hours

**D. Jurisdiction Management (30% → 100%)**
- [ ] **7.8** Connect jurisdiction onboarding to API
  - Replace placeholder with `POST /permits/jurisdictions`
  - Save jurisdiction to database
  - **File:** `apps/m-permits-inspections/src/components/jurisdiction/onboarding-wizard.tsx`
  - **Time:** 3 hours

- [ ] **7.9** Connect jurisdiction configuration to API
  - Replace placeholder with `PUT /permits/jurisdictions/:id`
  - Save configuration
  - **File:** Multiple files
  - **Time:** 3 hours

**E. Remove Placeholders (Priority)**
- [ ] **7.10** Audit and remove critical placeholders
  - Identify critical placeholders (payment, submission, etc.)
  - Replace with real API calls
  - **File:** Multiple files
  - **Time:** 8 hours

**Total Time:** ~38 hours (1 week focused)

---

## 🟢 PRIORITY 4: Marketing/Landing

### 8. m-marketplace (20% → 85%) - **MARKETPLACE LANDING PAGE**

**Current:** Landing page complete (Phase 1)  
**Note:** Full marketplace (Phase 2) is Stage 6 feature

#### ✅ Items to Complete (65% gap - but only if building full marketplace):

**If building full marketplace (Stage 6):**
- [ ] **8.1** Build contractor directory
- [ ] **8.2** Implement search and filtering
- [ ] **8.3** Create contractor profiles
- [ ] **8.4** Implement lead distribution
- [ ] **8.5** Build quote workflows
- [ ] **8.6** Implement subscription tiers

**If keeping as landing page only:**
- ✅ **Already at 85%** - Landing page is complete
- Future marketplace features are Stage 6 (not required for 85%)

**Total Time:** N/A (landing page already complete)

---

## 📋 Implementation Priority Order

### Week 1: Revenue-Critical Backend
1. **API Service** - Payment processing, file storage, SSL fix (25 hours)
2. **m-ops-services** - Stripe webhooks, subscription management (35 hours)

### Week 2: Revenue-Critical Frontend
3. **m-ops-services** - Service requests, reports, billing (remaining)
4. **m-project-owner** - Payment processing, contracts (33 hours)

### Week 3: Internal Operations
5. **os-admin** - API integration, error handling (32 hours)
6. **os-pm** - Backend integration, workflows (34 hours)

### Week 4: Client-Facing Apps
7. **m-architect** - Backend integration, file upload (29 hours)
8. **m-permits-inspections** - Remove placeholders, API integration (38 hours)

---

## 🎯 Success Criteria for 85% Completion

### Each App Must Have:
- ✅ **85%+ of UI pages functional** (not just displaying)
- ✅ **All critical revenue flows working** (payments, subscriptions)
- ✅ **Backend API fully integrated** (no mock data in production paths)
- ✅ **Error handling comprehensive** (user-friendly error messages)
- ✅ **Loading states implemented** (good UX during API calls)
- ✅ **Data persistence working** (CRUD operations save to database)

### Platform-Wide Requirements:
- ✅ **All apps deployable to Vercel**
- ✅ **All domains configured and SSL working**
- ✅ **API service fully operational** (all routes working)
- ✅ **Payment processing functional** (Stripe webhooks working)
- ✅ **File storage operational** (S3/R2 uploads working)

---

## 📊 Estimated Total Time

| Priority | Apps | Hours | Weeks |
|----------|------|-------|-------|
| **P1: Revenue-Critical** | 3 apps | 93 hours | 2.5 weeks |
| **P2: Internal Ops** | 2 apps | 66 hours | 1.5 weeks |
| **P3: Client-Facing** | 2 apps | 67 hours | 1.5 weeks |
| **P4: Marketing** | 1 app | 0 hours | Already done |
| **Total** | **8 apps** | **~226 hours** | **~5-6 weeks** |

**With focused development (40 hours/week):** ~6 weeks  
**With aggressive development (60 hours/week):** ~4 weeks

---

## 🚀 Quick Start Checklist

### Before Starting:
- [ ] Review this roadmap
- [ ] Set up development environment
- [ ] Verify API service is running
- [ ] Test Stripe webhook endpoint (use Stripe CLI)
- [ ] Configure S3/R2 credentials
- [ ] Set up Railway SSL certificate

### Daily Workflow:
1. Pick highest priority item from roadmap
2. Implement feature
3. Test locally
4. Commit and push
5. Mark item complete
6. Move to next item

### Weekly Review:
- Review completion percentage
- Identify blockers
- Adjust priorities if needed
- Deploy to staging for testing

---

**Last Updated:** January 19, 2026  
**Status:** Ready for implementation  
**Next Step:** Start with Priority 1, Item 1.1 (Stripe webhook handler)

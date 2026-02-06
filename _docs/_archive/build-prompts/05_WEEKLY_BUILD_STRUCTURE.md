# WEEKLY BUILD STRUCTURE
## Complete 27-Week Breakdown with Daily Tasks

**Version:** 2.0.0  
**Date:** January 13, 2026  
**Total Duration:** 27 weeks (7 months)  
**Stages:** 10 (including Permits & Inspections)

---

## 📅 WEEK-BY-WEEK OVERVIEW

### **WEEK 1: STAGE 0 - DESIGN REVIEW & APPROVAL**

**Goal:** Review all Stage 0 deliverables and approve to proceed

**Daily Tasks:**

**Monday:**
- Read 00_README_START_HERE.md
- Read 01_MASTER_BUILD_GUIDE_V2.md (Parts 1-2)
- Understand OS Foundation vs Ops OS Core

**Tuesday:**
- Review 02_STAGE_0_COMPLETE.md
- Read all 8 journey maps
- Understand user workflows

**Wednesday:**
- Review all wireframes (70+ screens)
- Visualize each hub's UI

**Thursday:**
- Review all user flows
- Review complete ERD and data models
- Review API contracts

**Friday:**
- Final review of any sections needing clarification
- Request changes from Claude (if needed)
- **APPROVE DESIGNS** ✅
- Install required tools (Cursor, Node.js, Docker, etc.)

**Deliverables:**
- ✅ All designs reviewed
- ✅ Any change requests submitted
- ✅ Final approval given
- ✅ Development environment ready

---

### **WEEKS 2-3: STAGE 1 - OS FOUNDATION**

---

### **WEEK 2: DATABASE & API CORE**

**Goal:** Set up monorepo, database, and core authentication

**Monday (Day 1):**
- **Task 1:** Initialize pnpm monorepo
  - Create package.json, pnpm-workspace.yaml, turbo.json
  - Set up .gitignore
  - Test: `pnpm install`
  
- **Task 2:** Create database package
  - Set up packages/database folder
  - Configure Prisma
  - Create .env.local
  - Test: `pnpm install` in packages/database

- **Task 3:** Create initial Prisma schema
  - Add User, Org, OrgMember models
  - Add Role, Permission, RolePermission models
  - Add ModuleEntitlement model
  - Test: `pnpm db:generate`

**Tuesday (Day 2):**
- **Task 4:** Add Event & Audit models to schema
  - Add Event model (append-only)
  - Add AuditLog model (append-only)
  - Test: `pnpm db:generate`

- **Task 5:** Set up Docker Compose
  - Create docker-compose.yml
  - PostgreSQL container
  - Redis container
  - Test: `docker-compose up -d`

- **Task 6:** Run first migration
  - Test: `pnpm db:push`
  - Verify tables created in database

**Wednesday (Day 3):**
- **Task 7:** Create API service structure
  - Set up services/api folder
  - Initialize Fastify server
  - Configure TypeScript
  - Test: Server starts

- **Task 8:** Create authentication service
  - Supabase Auth integration
  - JWT handling
  - Signup/login/logout endpoints
  - Test: Can create user

- **Task 9:** Create session middleware
  - JWT verification
  - User context injection
  - Test: Protected routes work

**Thursday (Day 4):**
- **Task 10:** Create organizations service
  - Org CRUD operations
  - Member management
  - Test: Can create org, add members

- **Task 11:** Create RBAC service
  - Role assignment
  - Permission checking
  - Enforcement middleware
  - Test: Permissions enforced

- **Task 12:** Create module entitlements service
  - Enable/disable modules
  - Check module access
  - Test: Module access restricted

**Friday (Day 5):**
- **Task 13:** Create event logging service
  - Event recording
  - Event retrieval
  - Test: Events logged on actions

- **Task 14:** Create audit logging service
  - Audit trail recording
  - Privileged action tracking
  - Test: Audits created

- **Task 15:** Testing & bug fixes
  - Integration tests
  - Fix any issues
  - Deploy to staging

**Week 2 Deliverables:**
- ✅ Monorepo initialized
- ✅ Database schema created (foundation models)
- ✅ Docker running (PostgreSQL + Redis)
- ✅ Fastify API server operational
- ✅ Authentication working (signup, login, logout)
- ✅ Organizations & RBAC functional
- ✅ Event & audit logging active

---

### **WEEK 3: WORKERS & API COMPLETION**

**Goal:** Complete OS Foundation with worker infrastructure

**Monday (Day 1):**
- **Task 16:** Set up BullMQ
  - Install dependencies
  - Configure Redis connection
  - Create queue infrastructure
  - Test: Can add jobs to queue

- **Task 17:** Create email queue
  - Email job processor
  - SendGrid integration
  - Test: Can send emails

- **Task 18:** Create webhook queue
  - Webhook delivery processor
  - Retry logic
  - Test: Webhooks delivered

**Tuesday (Day 2):**
- **Task 19:** Create ML processing queue
  - ML job structure
  - Anthropic Claude API integration
  - Test: Can process ML jobs

- **Task 20:** Create report generation queue
  - Report job processor
  - PDF generation
  - Test: Can generate reports

- **Task 21:** Create scheduled jobs (cron)
  - Daily digest cron
  - Performance calculation cron
  - Test: Cron jobs execute

**Wednesday (Day 3):**
- **Task 22:** Complete API routes
  - Auth routes
  - Org routes
  - User routes
  - Test: All routes working

- **Task 23:** Add request validation
  - Zod schemas
  - Validation middleware
  - Test: Invalid requests rejected

- **Task 24:** Add error handling
  - Global error handler
  - Structured error responses
  - Test: Errors handled gracefully

**Thursday (Day 4):**
- **Task 25:** Add rate limiting
  - Per-user rate limits
  - Per-org rate limits
  - Test: Rate limits enforced

- **Task 26:** Set up logging
  - Request logging
  - Error logging
  - Test: Logs viewable

- **Task 27:** Create API documentation
  - OpenAPI/Swagger docs
  - Endpoint documentation
  - Test: Docs accessible

**Friday (Day 5):**
- **Task 28:** Integration testing
  - Test all endpoints
  - Test worker queues
  - Test cron jobs

- **Task 29:** Performance testing
  - Load testing
  - Optimize slow queries
  - Test: Meets performance targets

- **Task 30:** Deploy to staging
  - Railway deployment
  - Environment variables
  - Test: Staging works

**Week 3 Deliverables:**
- ✅ BullMQ worker infrastructure operational
- ✅ All queues functional (email, webhook, ML, reports)
- ✅ Cron jobs running
- ✅ Complete API routes
- ✅ Validation, error handling, rate limiting
- ✅ Deployed to staging
- ✅ **OS FOUNDATION COMPLETE** 🎉

---

### **WEEKS 4-5: STAGE 2 - OPS OS CORE**

---

### **WEEK 4: ADMIN UI FOUNDATION**

**Goal:** Build internal platform tooling for Kealee staff (**os-admin = management**)

**os-admin tab structure (platform management):**
- Dashboard (overview)
- Organizations (org management)
- Users (user provisioning & RBAC)
- Financials ⭐ (platform-wide revenue, MRR, ARR, churn)
- Disputes (payment & service dispute resolution)
- Automation (ML governance & approvals)
- Monitoring (system health, uptime, errors)
- Jurisdictions ⭐ (permits jurisdiction setup & configuration)
- Project Managers (PM oversight & assignments)
- Analytics (platform-wide analytics)
- Settings (platform configuration)

**Monday (Day 1):**
- **Task 31:** Initialize os-admin Next.js app
  - Create apps/os-admin
  - Configure Tailwind + Shadcn/ui
  - Set up layouts
  - Test: App runs

- **Task 32:** Create authentication pages
  - Login page
  - Logout handler
  - Protected route wrapper
  - Test: Can login as admin

- **Task 33:** Create navigation
  - Sidebar navigation
  - Top header
  - Mobile responsive
  - Test: Navigation works

**Tuesday (Day 2):**
- **Task 34:** Create dashboard page
  - System metrics cards
  - Recent activity feed
  - Revenue metrics
  - Test: Dashboard displays data

- **Task 35:** Create organization list page
  - Fetch orgs from API
  - Display in table
  - Filters and search
  - Test: Orgs displayed

- **Task 36:** Create org detail page
  - Org information
  - Members list
  - Modules enabled
  - Test: Can view org details

**Wednesday (Day 3):**
- **Task 37:** Create org creation page
  - New org form
  - Validation
  - API integration
  - Test: Can create org

- **Task 38:** Create org edit page
  - Edit org details
  - Update API call
  - Test: Can update org

- **Task 39:** Create module enablement interface
  - Enable/disable modules
  - Module settings
  - Test: Modules can be toggled

**Thursday (Day 4):**
- **Task 40:** Create user list page
  - Fetch users from API
  - Display in table
  - Search and filters
  - Test: Users displayed

- **Task 41:** Create user detail page
  - User information
  - Organizations
  - Roles
  - Test: Can view user

- **Task 42:** Create user creation page
  - New user form
  - Role assignment
  - Test: Can create user

**Friday (Day 5):**
- **Task 43:** Create role assignment interface
  - Assign roles to users
  - Manage permissions
  - Test: Roles assignable

- **Task 44:** Create audit log viewer
  - Display audit logs
  - Filters (user, action, date)
  - Test: Audit logs viewable

- **Task 45:** Testing & bug fixes
  - Test all admin pages
  - Fix issues
  - Deploy to staging

**Week 4 Deliverables:**
- ✅ os-admin app initialized
- ✅ Authentication working
- ✅ Dashboard functional
- ✅ Org management complete
- ✅ User management complete
- ✅ Audit log viewer working

---

### **WEEK 5: MANAGEMENT INTERFACES**

**Goal:** Build execution tooling for PMs (**os-pm = execution**) + management interfaces

**Clarification (critical):**
- **os-admin = Platform Management (meta-level)**: config + oversight (financials, jurisdictions, monitoring, governance)
- **os-pm = Work Execution (operational)**: tasks, clients, reports, SOP execution

**Monday (Day 1):**
- **Task 46:** Create **os-pm** dashboard (execution)
  - PM work overview
  - Task summary
  - Client list
  - Test: PM sees assigned clients

- **Task 47:** Create **os-pm** task queue page
  - Display tasks
  - Filter by client, status
  - Sort by priority
  - Test: Tasks displayed

- **Task 48:** Create **os-pm** task detail page
  - Task information
  - Mark in-progress/complete
  - Add notes
  - Test: Tasks updatable

**Tuesday (Day 2):**
- **Task 49:** Create **os-pm** SOP template library
  - List templates
  - Template editor
  - Test: Templates viewable

- **Task 50:** Create **os-admin** client assignment interface (management)
  - Assign PM to client
  - Workload balancing
  - Test: Assignments work

- **Task 51:** Create **os-pm** reports page (execution)
  - Weekly activity
  - Client summaries
  - Test: Reports generated

**Wednesday (Day 3):**
- **Task 52:** Create dispute queue page
  - List all disputes
  - Filter by status
  - Priority flagging
  - Test: Disputes displayed

- **Task 53:** Create dispute detail page
  - Dispute information
  - Evidence from both parties
  - Timeline
  - Test: Can view dispute

- **Task 54:** Create dispute resolution interface
  - Investigation workflow
  - Decision making
  - Payment freeze/unfreeze
  - Test: Disputes resolvable

**Thursday (Day 4):**
- **Task 55:** Create automation dashboard
  - ML events summary
  - Pending approvals
  - Active rules
  - Test: Automation visible

- **Task 56:** Create automation rule approval interface
  - Review ML suggestions
  - Approve/reject rules
  - Set thresholds
  - Test: Rules approvable

- **Task 57:** Create integration monitoring page
  - Active integrations
  - Webhook logs
  - Retry failed webhooks
  - Test: Integrations monitored

**Friday (Day 5):**
- **Task 58:** Integration testing
  - **Test os-admin (platform management) tabs:**
    - Dashboard, Organizations, Users
    - Financials ⭐ (platform-wide revenue rollups only)
    - Disputes, Automation, Monitoring
    - Jurisdictions ⭐ (setup/config only; link-out to permits ops)
    - Project Managers (oversight/assignments), Analytics, Settings
  - **Test os-pm (work execution) flows:**
    - PM dashboard → task queue → task detail
    - SOP templates → task execution steps
    - Weekly report page + generation flow (stubbed initially)
  - Test dispute workflows (queue → detail → resolution actions)
  - Test automation governance (dashboard → rules approvals → integrations)
  - Verify **no 404s** across new routes

- **Task 59:** Bug fixes and polish
  - Fix any issues
  - Improve UX
  - Test: Everything works smoothly

- **Task 60:** Deploy to staging
  - Deploy updated **os-admin** (management console)
  - Deploy **os-pm** execution console (if split; otherwise keep execution routes under os-admin temporarily)
  - Test in staging
  - **OPS OS CORE COMPLETE** 🎉

**Week 5 Deliverables:**
- ✅ os-admin management console expanded (Financials ⭐, Jurisdictions ⭐, Monitoring, PM oversight)
- ✅ os-pm execution surfaces (PM dashboard, tasks, SOPs, reports)
- ✅ Dispute resolution operational
- ✅ Automation governance tools ready
- ✅ Integration monitoring active
- ✅ **OPS OS CORE COMPLETE** 🎉

---

### **WEEKS 6-8: STAGE 3 - OPS SERVICES MVP** 💰

---

### **WEEK 6: CUSTOMER PORTAL**

**Goal:** Launch customer-facing Ops Services app

**Monday (Day 1):**
- **Task 61:** Initialize m-ops-services app
  - Create Next.js app
  - Configure Tailwind
  - Set up routing
  - Test: App runs

- **Task 62:** Create landing page
  - Hero section
  - Package comparison
  - Pricing
  - Test: Landing page loads

- **Task 63:** Create package comparison page
  - Packages A-D detailed
  - Feature comparison table
  - Test: Packages displayed

**Tuesday (Day 2):**
- **Task 64:** Create signup flow
  - Email/password signup
  - Create account
  - Test: Can sign up

- **Task 65:** Create package selection page
  - Select Package A/B/C/D
  - Pricing display
  - Test: Can select package

- **Task 66:** Create payment integration
  - Stripe checkout
  - Subscription creation
  - Test: Can subscribe

**Wednesday (Day 3):**
- **Task 67:** Create customer dashboard
  - Account overview
  - Active projects
  - Service requests
  - Test: Dashboard displays

- **Task 68:** Create package management page
  - Current package details
  - Upgrade/downgrade
  - Cancel subscription
  - Test: Package manageable

- **Task 69:** Add project creation
  - New project form
  - Link to package
  - Test: Projects created

**Thursday (Day 4):**
- **Task 70:** Create service request form
  - Request type selection
  - Description
  - Submit to PM
  - Test: Requests submitted

- **Task 71:** Create request list page
  - All requests
  - Status tracking
  - Test: Requests displayed

- **Task 72:** Create request detail page
  - Request information
  - Status updates
  - PM communication
  - Test: Can view request

**Friday (Day 5):**
- **Task 73:** Create project detail page
  - Project overview
  - Documents
  - Reports
  - Test: Project viewable

- **Task 74:** Testing
  - Test signup → package selection → project creation → service request
  - Fix bugs

- **Task 75:** Deploy to staging
  - Deploy m-ops-services
  - Test end-to-end

**Week 6 Deliverables:**
- ✅ m-ops-services app launched
- ✅ Landing page live
- ✅ Signup and package selection working
- ✅ Stripe subscriptions functional
- ✅ Customer dashboard operational
- ✅ Service requests submittable

---

### **WEEK 7: SERVICE WORKFLOWS**

**Goal:** Build PM execution workflows

**Monday (Day 1):**
- **Task 76:** Add Prisma models for Ops Services
  - ServicePlan model
  - ServiceRequest model
  - Task model
  - Test: Models generated

- **Task 77:** Create service API endpoints
  - Create plan
  - Create request
  - Update request status
  - Test: API works

- **Task 78:** Auto-assign PM on signup
  - Assignment algorithm
  - Notify PM
  - Test: PM assigned automatically

**Tuesday (Day 2):**
- **Task 79:** Create SOP-driven task creation
  - Request triggers SOP template
  - Tasks auto-created
  - Test: Tasks generated

- **Task 80:** PM task assignment integration
  - Tasks appear in os-admin PM queue
  - PM can claim/complete
  - Test: PM sees tasks

- **Task 81:** Customer notification system
  - Email notifications
  - Status updates
  - Test: Notifications sent

**Wednesday (Day 3):**
- **Task 82:** Create weekly report generation
  - Report template
  - Auto-populate data
  - PDF generation
  - Test: Reports created

- **Task 83:** Create report viewing page
  - Report list
  - Report detail/download
  - Test: Reports viewable

- **Task 84:** Create warranty intake form
  - Submit warranty claim
  - Link to project
  - Test: Claims submitted

**Thursday (Day 4):**
- **Task 85:** Create warranty tracking page
  - List all warranty claims
  - Status tracking
  - Test: Claims displayed

- **Task 86:** Create document management
  - Upload documents
  - Organize by project
  - Test: Documents uploaded

- **Task 87:** Create PM communication panel
  - In-app messaging
  - Notifications
  - Test: Can message PM

**Friday (Day 5):**
- **Task 88:** Integration testing
  - Full service request workflow
  - PM execution workflow
  - Report generation

- **Task 89:** Bug fixes
  - Fix any issues
  - UX improvements

- **Task 90:** Deploy updates
  - Deploy to staging
  - Test end-to-end

**Week 7 Deliverables:**
- ✅ Service request workflows operational
- ✅ PM task auto-creation working
- ✅ Weekly reports generating
- ✅ Warranty intake functional
- ✅ Document management working
- ✅ PM communication active

---

### **WEEK 8: LAUNCH** 💰

**Goal:** Go live with Ops Services MVP

**Monday (Day 1):**
- **Task 91:** Beta testing with 3 customers
  - Real customer signups
  - Real PM execution
  - Monitor for issues

**Tuesday (Day 2):**
- **Task 92:** Fix critical bugs from beta
  - Address user feedback
  - Resolve technical issues

**Wednesday (Day 3):**
- **Task 93:** Create onboarding documentation
  - Customer guide
  - PM guide
  - Test: Guides clear

- **Task 94:** Marketing page updates
  - Live pricing
  - Testimonials
  - Test: Marketing accurate

**Thursday (Day 4):**
- **Task 95:** Production deployment
  - Deploy to production
  - Configure domains
  - SSL certificates
  - Test: Production live

- **Task 96:** Launch announcement
  - Email existing leads
  - Social media
  - Industry forums

**Friday (Day 5):**
- **Task 97:** Monitor launch
  - Watch for issues
  - Support first customers
  - Track metrics

- **Task 98:** **FIRST REVENUE!** 🎉
  - First subscription payments
  - Celebrate milestone

- **Task 99:** Plan next stage
  - Review Stage 4 requirements
  - Prepare for Project Owner MVP

**Week 8 Deliverables:**
- ✅ Beta testing complete
- ✅ Production deployment live
- ✅ First customers onboarded
- ✅ **FIRST REVENUE GENERATED!** 💰
- ✅ **OPS SERVICES MVP COMPLETE** 🎉

---

### **WEEKS 9-11: STAGE 4 - PROJECT OWNER MVP** 💰

[Continue with detailed breakdown for remaining stages...]

---

## 📊 STAGE SUMMARY

```
✅ Stage 0 (Week 1): Design Review
✅ Stage 1 (Weeks 2-3): OS Foundation
✅ Stage 2 (Weeks 4-5): Ops OS Core
✅ Stage 3 (Weeks 6-8): Ops Services MVP 💰
⏳ Stage 4 (Weeks 9-11): Project Owner MVP 💰
⏳ Stage 5 (Weeks 12-14): Finance & Trust MVP 💰
⏳ Stage 6 (Weeks 15-17): Marketplace MVP 💰
⏳ Stage 7 (Weeks 18-19): Architect MVP 💰
⏳ Stage 7.5 (Weeks 19-20): Permits & Inspections MVP 💰
⏳ Stage 8 (Weeks 21-22): Engineer MVP 💰
⏳ Stage 9 (Weeks 23-27): Automation & ML
```

---

**END OF WEEKLY BUILD STRUCTURE**

For complete cursor prompts for each task, see:
- 06_CURSOR_PROMPTS_STAGES_1_3.md
- 06.5_CURSOR_PROMPTS_PERMITS_INSPECTIONS.md
- 07_CURSOR_PROMPTS_STAGES_4_6.md
- 08_CURSOR_PROMPTS_STAGES_7_9.md


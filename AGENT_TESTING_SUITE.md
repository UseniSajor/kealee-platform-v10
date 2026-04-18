# 🤖 AUTONOMOUS AGENT TESTING SUITE

**Date:** April 5, 2026  
**Purpose:** Test agents' ability to autonomously complete all platform workflows  
**Scope:** AI Agents, Conversations, Intake, Permits, Checkout, Command Center Operations  

---

## 🎯 TESTING OBJECTIVES

Verify that agents (automation scripts/bots) can:

1. ✅ **AI Agents** - 13 KeaBots respond to queries and execute domain-specific tasks
2. ✅ **Conversations** - Create conversations, send messages, @mention KeaBot, track context
3. ✅ **Intake Analysis** - Submit intake forms and trigger AI analysis workflows
4. ✅ **Permit Operations** - File permits and check compliance
5. ✅ **Checkout** - Process payments via Stripe
6. ✅ **Command Center** - Dashboard widgets, job queues, job scheduling, system config, credentials, AI conversation history

---

## 📋 PREREQUISITE CHECKS

Before running tests, verify:

### API Baseline (No Failures Expected)

```bash
# Test 1: API Health
curl -I https://arstic-kindness.up.railway.app/health
# Expected: 200 OK or similar

# Test 2: Database Ready
# Check PostgreSQL is online in Railway (green status)

# Test 3: Redis (for BullMQ job queue)
# Check Redis is configured in Railway

# Test 4: Stripe Keys
# Verify STRIPE_PRICE_* env vars are set in Railway dashboard
```

### Expected Responses

| Service | Endpoint | Expected | Status |
|---------|----------|----------|--------|
| API | /health | 200 | ✅ or 🔴 |
| Database | PostgreSQL | Online | ✅ |
| Redis | BullMQ queue | Ready | ✅ |
| Stripe | STRIPE_PRICE_* vars | Set | ✅ |

---

## 🧪 TEST 1: AI AGENTS (13 KeaBots)

**Location:** `bots/keabot-*/src/bot.ts` (13 bot domains)

### 1a. Command Bot Routing

**Test:** Send query to keabot-command, verify it routes correctly

```bash
# Script: test-command-bot.sh
curl -X POST https://arstic-kindness.up.railway.app/keabots/command \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of project ABC-001?",
    "projectId": "ABC-001",
    "userId": "test-user-1"
  }'

# Expected Response:
# - status: 200
# - body: { "response": "...", "action": "route_to_owner_bot" }
```

**Verification Checklist:**
- [ ] Request succeeds (200)
- [ ] Response contains routing decision
- [ ] Message logged to conversation history

---

### 1b. Domain Bot Capabilities - Permit Bot

**Test:** Permit bot responds to permit-related queries

```bash
# Script: test-permit-bot.sh
curl -X POST https://arstic-kindness.up.railway.app/keabots/permit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What permits do I need for a kitchen remodel in Fairfax?",
    "projectId": "ABC-001",
    "userId": "test-user-1",
    "context": {
      "jurisdiction": "fairfax-county",
      "projectType": "kitchen_remodel"
    }
  }'

# Expected Response:
# - status: 200
# - body: { "response": "Based on Fairfax County requirements: ...", "permits": [...] }
```

**Verification Checklist:**
- [ ] Bot recognizes permit query
- [ ] Returns jurisdiction-specific requirements
- [ ] Calls tool: `check_requirements`
- [ ] Response logged in AIConversation table

---

### 1c. Domain Bot Capabilities - Estimate Bot

**Test:** Estimate bot performs RSMeans lookup and cost analysis

```bash
# Script: test-estimate-bot.sh
curl -X POST https://arstic-kindness.up.railway.app/keabots/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create estimate for 500 sq ft kitchen remodel with new layout and cabinets",
    "projectId": "ABC-001",
    "userId": "test-user-1"
  }'

# Expected Response:
# - status: 200
# - body: { 
#     "response": "...",
#     "estimate": {
#       "items": [...],
#       "laborCost": 12500,
#       "materialCost": 8500,
#       "total": 21000
#     }
#   }
```

**Verification Checklist:**
- [ ] Bot calls RSMeans cost database
- [ ] Returns itemized estimate
- [ ] Includes labor + material breakdown
- [ ] Estimate saved to database

---

### 1d. All 13 Bots Quick Test

**Test:** Verify all bots are registered and callable

| Bot | Domain | Query | Expected Tool Call |
|-----|--------|-------|-------------------|
| keabot-command | command | "Route to design bot" | route_to_bot |
| keabot-permit | permit | "What permits needed?" | check_requirements |
| keabot-estimate | estimate | "Create estimate" | create_estimate |
| keabot-design | design | "Review floorplan" | review_design |
| keabot-developer | developer | "Portfolio status" | get_portfolio |
| keabot-feasibility | feasibility | "Run proforma" | run_analysis |
| keabot-finance | finance | "Capital stack review" | analyze_stack |
| keabot-gc | gc | "Bid management" | manage_bids |
| keabot-land | land | "Zoning analysis" | check_zoning |
| keabot-marketplace | marketplace | "Find contractors" | search_contractors |
| keabot-operations | operations | "Warranty tracking" | get_warranty |
| keabot-owner | owner | "Project status" | get_project_status |
| keabot-payments | payments | "Payment tracking" | track_payments |

**Script to Test All Bots:**

```bash
# Script: test-all-bots.sh
for bot in command permit estimate design developer feasibility finance gc land marketplace operations owner payments; do
  echo "Testing keabot-$bot..."
  curl -s -X POST https://arstic-kindness.up.railway.app/keabots/$bot \
    -H "Content-Type: application/json" \
    -d '{"message":"Hello","userId":"test"}' | jq '.status'
done

# Expected: All return 200
```

**Verification Checklist:**
- [ ] All 13 bots respond (HTTP 200)
- [ ] Bot registration in startup logs
- [ ] Each bot has system prompt configured
- [ ] Tool registry populated for each bot

---

## 🧪 TEST 2: CONVERSATIONS & MESSAGING

**Location:** `services/command-center/claws/conversations/routes/`

### 2a. Create Conversation

**Test:** Start a new project conversation

```bash
# Script: test-create-conversation.sh
curl -X POST https://arstic-kindness.up.railway.app/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "ABC-001",
    "userId": "test-user-1",
    "type": "project_intake",
    "title": "Kitchen Remodel Discussion"
  }'

# Expected Response:
# - status: 201 Created
# - body: { "id": "conv-123", "projectId": "ABC-001", "messages": [] }
```

**Verification Checklist:**
- [ ] Conversation created (201)
- [ ] Stored in AIConversation table
- [ ] Has unique ID
- [ ] Linked to projectId and userId

---

### 2b. Send Message Without @kealee (No AI)

**Test:** User sends regular message (no AI processing)

```bash
# Script: test-send-message-user.sh
curl -X POST https://arstic-kindness.up.railway.app/conversations/conv-123/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "content": "Let me gather the photos first"
  }'

# Expected Response:
# - status: 201 Created
# - body: { "id": "msg-456", "content": "...", "role": "user", "usedAI": false }
```

**Verification Checklist:**
- [ ] Message created (201)
- [ ] `usedAI: false` (no LLM call)
- [ ] Stored in messages array
- [ ] User is message author

---

### 2c. Send Message With @kealee (AI Processing)

**Test:** Message mentions @kealee, triggers AI response

```bash
# Script: test-send-message-kealee.sh
curl -X POST https://arstic-kindness.up.railway.app/conversations/conv-123/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "content": "@kealee what permits do we need for this kitchen remodel?"
  }'

# Expected Response:
# - status: 201 Created
# - body: {
#     "id": "msg-457",
#     "content": "@kealee what permits do we need for this kitchen remodel?",
#     "usedAI": true,
#     "aiResponse": "Based on your kitchen remodel scope, you will need...",
#     "botUsed": "keabot-permit"
#   }
```

**Verification Checklist:**
- [ ] Message parsed for @kealee mention
- [ ] AI triggered (usedAI: true)
- [ ] Appropriate bot selected (permit bot for this query)
- [ ] AI response included
- [ ] Both user + AI messages in conversation history

---

### 2d. Retrieve Conversation History

**Test:** Fetch full conversation with message limit

```bash
# Script: test-get-conversation.sh
curl -X GET "https://arstic-kindness.up.railway.app/conversations/conv-123?limit=50" \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: {
#     "id": "conv-123",
#     "projectId": "ABC-001",
#     "messages": [
#       { "id": "msg-456", "role": "user", "content": "..." },
#       { "id": "msg-457", "role": "user", "content": "@kealee..." },
#       { "id": "msg-458", "role": "assistant", "content": "AI response..." }
#     ]
#   }
```

**Verification Checklist:**
- [ ] Full conversation history returned (200)
- [ ] Messages in chronological order
- [ ] Limit applied (max 50)
- [ ] All message metadata included (id, role, timestamp)

---

## 🧪 TEST 3: INTAKE SUBMISSION & AI ANALYSIS

**Location:** `services/keacore/src/routes/intake.routes.ts`

### 3a. Submit Intake Form - Primary Route

**Test:** Submit kitchen remodel intake with AI analysis

```bash
# Script: test-intake-submit.sh
curl -X POST https://arstic-kindness.up.railway.app/keacore/intake/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "projectType": "kitchen_remodel",
    "projectScope": "New layout, cabinets, countertops, appliances, lighting",
    "estimatedBudget": 75000,
    "timeline": "6 months",
    "zipCode": "22101",
    "location": "Fairfax County, VA",
    "metadata": {
      "existingSquareFeet": 250,
      "newSquareFeet": 300,
      "photos": ["photo-1.jpg", "photo-2.jpg"],
      "isHistoric": false
    }
  }'

# Expected Response:
# - status: 201 Created
# - body: {
#     "intakeId": "intake-789",
#     "sessionId": "session-abc",
#     "status": "ANALYZING",
#     "analysis": {
#       "intent": "kitchen_remodel",
#       "riskFactors": ["historic_consideration"],
#       "estimatedPermitPath": "standard",
#       "scope": {
#         "structural": false,
#         "electrical": true,
#         "plumbing": false,
#         "mechanical": false
#       }
#     },
#     "workflowPlan": [
#       { "step": 1, "action": "AI_CONCEPT_GENERATION", "description": "Generate design concept" },
#       { "step": 2, "action": "PERMIT_ANALYSIS", "description": "Analyze permit requirements" },
#       { "step": 3, "action": "COST_ESTIMATION", "description": "Create cost estimate" }
#     ]
#   }
```

**Verification Checklist:**
- [ ] Intake created (201)
- [ ] AI analysis runs (status: ANALYZING or COMPLETE)
- [ ] Intent classified correctly (kitchen_remodel)
- [ ] Scope computed (electrical=true, structural=false, etc.)
- [ ] Workflow plan generated with at least 3 steps
- [ ] Risk factors identified (if any)
- [ ] Session created for tracking

---

### 3b. Retrieve Execution Context

**Test:** Fetch full workflow execution context

```bash
# Script: test-get-execution-context.sh
curl -X GET https://arstic-kindness.up.railway.app/keacore/sessions/session-abc/execution-context \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: {
#     "sessionId": "session-abc",
#     "intakeId": "intake-789",
#     "currentStep": 1,
#     "analysis": { ... },
#     "workflowPlan": [ ... ],
#     "executedSteps": [],
#     "pendingSteps": [
#       { "step": 1, "action": "AI_CONCEPT_GENERATION", ... },
#       { "step": 2, "action": "PERMIT_ANALYSIS", ... }
#     ]
#   }
```

**Verification Checklist:**
- [ ] Full context returned (200)
- [ ] Current step tracked
- [ ] Workflow plan accessible
- [ ] Execution history available

---

### 3c. Web-Main Intake Submission (Fallback Route)

**Test:** Save intake to Supabase via web-main

```bash
# Script: test-web-intake-submit.sh
curl -X POST https://web-main-*.up.railway.app/api/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "productSlug": "kitchen-remodel",
    "formData": {
      "name": "Test User",
      "email": "test@example.com",
      "scope": "Kitchen remodel with new layout",
      "budget": 75000
    }
  }'

# Expected Response:
# - status: 200
# - body: { "intakeId": "intake-789", "saved": true }
```

**Verification Checklist:**
- [ ] Data saved to Supabase (200)
- [ ] IntakeId generated
- [ ] Ready for checkout payment

---

## 🧪 TEST 4: PERMIT OPERATIONS & COMMAND CENTER

**Location:** `services/command-center/claws/permits-compliance/routes/`

### 4a. Create Permit (Draft Status)

**Test:** File permit for kitchen remodel in Fairfax

```bash
# Script: test-create-permit.sh
curl -X POST https://arstic-kindness.up.railway.app/permits \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "ABC-001",
    "userId": "test-user-1",
    "jurisdiction": "fairfax-county",
    "permitType": "electrical",
    "scope": "Electrical upgrade for kitchen - new circuits, outlets, lighting",
    "estimatedCost": 15000,
    "metadata": {
      "squareFeet": 300,
      "constructionType": "residential_addition"
    }
  }'

# Expected Response:
# - status: 201 Created
# - body: {
#     "permitId": "permit-001",
#     "status": "DRAFT",
#     "jurisdiction": "fairfax-county",
#     "createdAt": "2026-04-05T...",
#     "trackingNumber": null
#   }
```

**Verification Checklist:**
- [ ] Permit created (201)
- [ ] Status is DRAFT
- [ ] Stored in database
- [ ] Ready for submission to agency

---

### 4b. Check Permit Status (Queue Job)

**Test:** Queue background job to check permit status with building dept

```bash
# Script: test-check-permit-status.sh
curl -X POST https://arstic-kindness.up.railway.app/permits/permit-001/check-status \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1"
  }'

# Expected Response:
# - status: 202 Accepted
# - body: {
#     "jobId": "job-123",
#     "action": "check_permit_status",
#     "permitId": "permit-001",
#     "status": "queued"
#   }
```

**Verification Checklist:**
- [ ] Job queued (202)
- [ ] JobId returned (for polling)
- [ ] BullMQ job created with permit context
- [ ] Background worker will process asynchronously

---

### 4c. Job Queue Operations (BullMQ)

**Test:** Verify job queue executes background tasks

```bash
# Script: test-job-queue.sh

# Step 1: Check job status
curl -X GET https://arstic-kindness.up.railway.app/jobs/job-123/status \
  -H "Content-Type: application/json"

# Expected Response:
# - body: { "jobId": "job-123", "status": "processing|completed|failed" }

# Step 2: If completed, check result
if [[ $status == "completed" ]]; then
  curl -X GET https://arstic-kindness.up.railway.app/jobs/job-123/result \
    -H "Content-Type: application/json"
  
  # Expected Response:
  # - body: {
  #     "permitStatus": "approved",
  #     "trackingNumber": "FAIRFAX-2026-001234",
  #     "lastUpdated": "2026-04-05T..."
  #   }
fi
```

**Verification Checklist:**
- [ ] Job status endpoint works (200)
- [ ] Job transitions: queued → processing → completed
- [ ] Results accessible after completion
- [ ] Failed jobs return error details

---

### 4d. Get Permit Inspections

**Test:** Retrieve inspection list for a permit

```bash
# Script: test-get-inspections.sh
curl -X GET https://arstic-kindness.up.railway.app/permits/permit-001/inspections \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: {
#     "permitId": "permit-001",
#     "inspections": [
#       {
#         "inspectionId": "insp-001",
#         "type": "rough_electrical",
#         "scheduledDate": "2026-04-20",
#         "status": "scheduled",
#         "notes": "Waiting for framing completion"
#       }
#     ]
#   }
```

**Verification Checklist:**
- [ ] Inspections retrieved (200)
- [ ] Current status reflects jurisdiction records
- [ ] Includes scheduling information
- [ ] Allows tracking of inspection progress

---

## 🧪 TEST 5: COMMAND CENTER OPERATIONS

**Location:** `services/command-center/claws/*/routes/`

### 5a. Dashboard Widget Management

**Test:** Create and retrieve dashboard widgets

```bash
# Script: test-dashboard-widgets.sh

# Create widget
curl -X POST https://arstic-kindness.up.railway.app/dashboard-widgets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "type": "project_status",
    "position": { "x": 0, "y": 0, "width": 2, "height": 1 },
    "config": {
      "projectId": "ABC-001",
      "showTimeline": true,
      "refreshInterval": 300
    }
  }'

# Expected Response:
# - status: 201
# - body: { "widgetId": "widget-001", "type": "project_status", "position": {...} }

# Retrieve all widgets for user
curl -X GET https://arstic-kindness.up.railway.app/dashboard-widgets?userId=test-user-1 \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: { "widgets": [{ "widgetId": "widget-001", "type": "project_status", ... }] }
```

**Verification Checklist:**
- [ ] Widgets created (201)
- [ ] Widget positions stored
- [ ] All widgets retrieved for user (200)
- [ ] Configuration preserved
- [ ] Multiple WidgetTypes supported (project_status, timeline, financials, etc.)

---

### 5b. System Configuration (Key-Value Store)

**Test:** Set and retrieve system configuration

```bash
# Script: test-system-config.sh

# Set config
curl -X POST https://arstic-kindness.up.railway.app/system-config \
  -H "Content-Type: application/json" \
  -d '{
    "key": "PERMIT_PROCESSING_TIME_DAYS_FAIRFAX",
    "value": "30",
    "group": "jurisdiction",
    "description": "Average permit processing time for Fairfax County"
  }'

# Expected Response:
# - status: 201

# Get config
curl -X GET "https://arstic-kindness.up.railway.app/system-config/PERMIT_PROCESSING_TIME_DAYS_FAIRFAX" \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: { "key": "PERMIT_PROCESSING_TIME_DAYS_FAIRFAX", "value": "30" }

# Get all configs by group
curl -X GET "https://arstic-kindness.up.railway.app/system-config?group=jurisdiction" \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: {
#     "configs": [
#       { "key": "PERMIT_PROCESSING_TIME_DAYS_FAIRFAX", "value": "30" },
#       { "key": "PERMIT_PROCESSING_TIME_DAYS_DC", "value": "45" }
#     ]
#   }
```

**Verification Checklist:**
- [ ] Config values stored (201)
- [ ] Retrieved correctly (200)
- [ ] Grouped retrieval works
- [ ] Used for jurisdiction-specific logic

---

### 5c. Integration Credentials

**Test:** Store and use third-party integration credentials

```bash
# Script: test-integration-credentials.sh

# Create credential (e.g., Stripe)
curl -X POST https://arstic-kindness.up.railway.app/integration-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "service": "stripe",
    "accountId": "test-user-1",
    "credential": {
      "apiKey": "sk_test_...",
      "publishableKey": "pk_test_..."
    },
    "status": "active"
  }'

# Expected Response:
# - status: 201
# - body: { "credentialId": "cred-001", "service": "stripe", "status": "active" }

# Test credential
curl -X POST https://arstic-kindness.up.railway.app/integration-credentials/cred-001/test \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: { "valid": true, "service": "stripe", "lastTested": "2026-04-05T..." }
```

**Verification Checklist:**
- [ ] Credentials encrypted and stored (201)
- [ ] Retrieved with access control
- [ ] Test endpoint validates credentials
- [ ] Status tracked (active/inactive)
- [ ] Supports multiple services (stripe, resend, etc.)

---

### 5d. Job Scheduling (Cron)

**Test:** Create recurring job schedule

```bash
# Script: test-job-schedule.sh

# Create schedule (e.g., daily permit status check)
curl -X POST https://arstic-kindness.up.railway.app/job-schedules \
  -H "Content-Type: application/json" \
  -d '{
    "jobType": "check_permit_status",
    "cronExpression": "0 9 * * *",
    "description": "Check all active permits daily at 9 AM",
    "enabled": true,
    "metadata": {
      "jurisdiction": "fairfax-county",
      "permitTypes": ["electrical", "structural"]
    }
  }'

# Expected Response:
# - status: 201
# - body: {
#     "scheduleId": "sched-001",
#     "jobType": "check_permit_status",
#     "cronExpression": "0 9 * * *",
#     "nextRun": "2026-04-06T09:00:00Z"
#   }

# Get all schedules
curl -X GET https://arstic-kindness.up.railway.app/job-schedules \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: {
#     "schedules": [
#       { "scheduleId": "sched-001", "jobType": "check_permit_status", "nextRun": "..." }
#     ]
#   }
```

**Verification Checklist:**
- [ ] Schedule created (201)
- [ ] Cron expression validated
- [ ] Next run calculated correctly
- [ ] Enabled schedules trigger jobs automatically
- [ ] All schedules retrievable (200)

---

### 5e. AI Conversation History (Persistent Storage)

**Test:** Verify conversation logging to database

```bash
# Script: test-ai-conversation-history.sh

# After sending @kealee message (from Test 2c), verify storage
curl -X GET "https://arstic-kindness.up.railway.app/conversations/conv-123/ai-interactions" \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: {
#     "conversationId": "conv-123",
#     "aiInteractions": [
#       {
#         "interactionId": "ai-int-001",
#         "userMessage": "@kealee what permits do we need for this kitchen remodel?",
#         "botUsed": "keabot-permit",
#         "toolsCalled": ["check_requirements"],
#         "aiResponse": "Based on your kitchen remodel scope...",
#         "tokensUsed": 450,
#         "timestamp": "2026-04-05T12:34:56Z"
#       }
#     ]
#   }
```

**Verification Checklist:**
- [ ] AI interactions logged (200)
- [ ] User messages and AI responses paired
- [ ] Bot selection tracked
- [ ] Tool calls recorded
- [ ] Token usage tracked (for billing)
- [ ] Timestamps recorded

---

## 🧪 TEST 6: CHECKOUT INTEGRATION

**Location:** `apps/web-main/app/api/product/checkout/route.ts`

### 6a. Create Checkout Session

**Test:** Create Stripe checkout session for permit product

```bash
# Script: test-checkout-session.sh
curl -X POST https://web-main-*.up.railway.app/api/product/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "productSlug": "permit-package",
    "customerEmail": "test@example.com",
    "successUrl": "https://web-main-*.up.railway.app/products/success",
    "cancelUrl": "https://web-main-*.up.railway.app/products/permit-package"
  }'

# Expected Response:
# - status: 200
# - body: {
#     "sessionId": "cs_test_...",
#     "url": "https://checkout.stripe.com/pay/cs_test_...",
#     "productSlug": "permit-package",
#     "amount": 14900
#   }
```

**Verification Checklist:**
- [ ] Checkout session created (200)
- [ ] Stripe session ID returned
- [ ] Price updated from env var (STRIPE_PRICE_OD_PERMIT_APP)
- [ ] Product slug recognized (27 products all mapped)
- [ ] Customer email stored

---

### 6b. Success Page Redirect

**Test:** Verify success page after payment

```bash
# Script: test-checkout-success.sh

# Simulate success redirect from Stripe
curl -X GET "https://web-main-*.up.railway.app/products/success?session_id=cs_test_..." \
  -H "Content-Type: application/json"

# Expected Response:
# - status: 200
# - body: HTML page with "Thank you for your purchase"
# - Contains order ID, product name, amount
```

**Verification Checklist:**
- [ ] Success page loads (200)
- [ ] Order details displayed
- [ ] Session ID converted to order
- [ ] Order saved to database

---

## 📊 COMPREHENSIVE TEST RESULTS TABLE

Track all test results here:

| Test | Endpoint | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| 1a. Command Bot | /keabots/command | 200 | ? | ⏳ |
| 1b. Permit Bot | /keabots/permit | 200 | ? | ⏳ |
| 1c. Estimate Bot | /keabots/estimate | 200 | ? | ⏳ |
| 1d. All 13 Bots | /keabots/* | 200 x 13 | ? | ⏳ |
| 2a. Create Conversation | POST /conversations | 201 | ? | ⏳ |
| 2b. Send Message (User) | POST /conversations/*/messages | 201 | ? | ⏳ |
| 2c. Send Message (@kealee) | POST /conversations/*/messages | 201 + AI | ? | ⏳ |
| 2d. Get Conversation | GET /conversations/* | 200 | ? | ⏳ |
| 3a. Submit Intake | POST /keacore/intake/start | 201 | ? | ⏳ |
| 3b. Get Execution Context | GET /keacore/sessions/*/execution-context | 200 | ? | ⏳ |
| 3c. Web Intake Submit | POST /api/intake/submit | 200 | ? | ⏳ |
| 4a. Create Permit | POST /permits | 201 | ? | ⏳ |
| 4b. Check Permit Status | POST /permits/*/check-status | 202 | ? | ⏳ |
| 4c. Job Queue | GET /jobs/*/status | 200 | ? | ⏳ |
| 4d. Get Inspections | GET /permits/*/inspections | 200 | ? | ⏳ |
| 5a. Dashboard Widgets | POST/GET /dashboard-widgets | 201/200 | ? | ⏳ |
| 5b. System Config | POST/GET /system-config | 201/200 | ? | ⏳ |
| 5c. Integration Creds | POST/GET /integration-credentials | 201/200 | ? | ⏳ |
| 5d. Job Schedule | POST/GET /job-schedules | 201/200 | ? | ⏳ |
| 5e. AI Conversation History | GET /conversations/*/ai-interactions | 200 | ? | ⏳ |
| 6a. Checkout Session | POST /api/product/checkout | 200 | ? | ⏳ |
| 6b. Success Page | GET /products/success | 200 | ? | ⏳ |

---

## 🚀 EXECUTION STRATEGY

### Phase 1: Prerequisites (No Failures Expected)
1. Verify API health endpoints
2. Confirm database online
3. Check Stripe variables in Railway

### Phase 2: Core Agents (13 KeaBots)
1. Test command routing
2. Test domain-specific bots (permit, estimate, design)
3. Verify all 13 bots callable

### Phase 3: Conversations & Context
1. Create conversation
2. Send user message (no AI)
3. Send @kealee message (with AI)
4. Retrieve full history

### Phase 4: Intake & Analysis
1. Submit intake form
2. Verify AI analysis runs
3. Check workflow plan generated
4. Retrieve execution context

### Phase 5: Permits & Jobs
1. Create permit
2. Queue status check
3. Verify job queue execution
4. Get inspection history

### Phase 6: Command Center Ops
1. Create and manage dashboard widgets
2. Store system configuration
3. Test integration credentials
4. Create job schedules
5. Verify AI conversation logging

### Phase 7: Checkout (Last)
1. Create checkout session
2. Verify Stripe integration
3. Confirm success page

---

## 📝 SUCCESS CRITERIA

**Platform is READY when:**

- ✅ All 22 test endpoints return expected HTTP status
- ✅ All 13 KeaBots respond to messages
- ✅ AI analysis runs on intake submission
- ✅ Permit status check jobs execute
- ✅ Dashboard widgets CRUD works
- ✅ System config and credentials stored
- ✅ Cron schedules created
- ✅ AI conversation history persisted
- ✅ Checkout creates Stripe sessions
- ✅ No 500 errors in any test
- ✅ All database operations complete

**Platform is LIVE when:**
- ✅ Above + all manual Railway Stripe variables configured
- ✅ Stripe test payments process
- ✅ Real user can complete full workflow

---

## 🤖 AUTONOMOUS EXECUTION

These tests can be run by an automation agent with:
- Shared testing credentials
- API base URL
- Stripe test keys
- Database read access
- No manual intervention required

**Example bot pseudo-code:**

```python
class PlatformTester:
    def run_all_tests(self):
        results = {}
        
        # Phase 1: Prerequisites
        results['prereqs'] = self.check_prerequisites()
        
        # Phase 2: Agents
        results['agents'] = self.test_all_13_bots()
        
        # Phase 3-7: Full workflows
        for phase in ['conversations', 'intake', 'permits', 'command_center', 'checkout']:
            results[phase] = self.run_phase(phase)
        
        # Report
        return self.generate_report(results)
```

---

**Status:** Ready for autonomous agent execution with documented endpoints and expected responses. 🤖✅

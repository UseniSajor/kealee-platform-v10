✅ BETA TEST PROMPTS — AI Concept & Permits Complete End-to-End Testing
April 6, 2026

---

## CRITICAL: This Guide Ensures

✅ AI Concept bot works perfectly  
✅ Permits bot works perfectly  
✅ User flow is seamless (intake → concept → permits)  
✅ All integrations working (Stripe, Resend, Prisma, Claude)  
✅ No bugs or failures  
✅ Database transactions valid  
✅ API responses correct  
✅ Front-end rendering correct  
✅ User experience smooth  
✅ Error handling robust  

---

## 📋 TEST OVERVIEW

| Test # | Name | Duration | Goal |
|--------|------|----------|------|
| 1 | AI Concept Bot Verification | 30 min | Verify design generation works for all project types |
| 2 | Permits Bot Verification | 30 min | Verify permit workflows and jurisdiction integration |
| 3 | End-to-End User Flow | 45 min | Test complete user journey from intake to permits |
| 4 | Data Integrity & Validation | 30 min | Verify database consistency and transaction safety |
| 5 | Stress Test & Load Testing | 45 min | Test system under load and concurrent bots |

**Total Time: ~2.5 hours**

---

## 🚀 SETUP BEFORE TESTING

### 1. Start Services
```bash
cd ~/kealee-platform-v10

# In Terminal 1: Start all services
pnpm dev

# In Terminal 2: Watch logs
railway logs

# In Terminal 3: Monitor database
psql $DATABASE_URL --watch
```

### 2. Verify Services Running
```bash
# Check API health
curl http://localhost:3000/health
# Expected: { "status": "ok", "timestamp": "..." }

# Check KeaBot chat availability
curl -X POST http://localhost:3000/api/v1/keabots/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello", "sessionId": "test"}'
# Expected: { "success": true, "data": {...} }
```

### 3. Prepare Test Data
```bash
# Create test user
curl -X POST http://localhost:3000/api/v1/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-user@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# Save returned userId for later tests: TEST_USER_ID="..."
```

### 4. Environment Variables for Testing
```bash
# Add to .env.test
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## ✅ BETA TEST PROMPT 1: AI CONCEPT BOT VERIFICATION

### TEST GOAL
Verify AI Concept bot generates designs correctly, handles all project types, and integrates properly with the marketplace.

### EXECUTION STEPS

#### **Step 1: Verify Bot Exists & Has Required Files**

```bash
# Check bot files
ls -la bots/keabot-design/
# Expected output:
# node_modules/
# src/
# package.json
# tsconfig.json
# README.md

ls -la bots/keabot-design/src/
# Expected output:
# bot.ts (main bot class)
# index.ts (exports)
# design.types.ts (TypeScript interfaces)
# design.prompts.ts (system prompts)
# scoring.ts (design scoring logic)
```

**✅ PASS CRITERIA:**
- ✅ All files present
- ✅ bot.ts > 300 lines
- ✅ design.types.ts includes ProjectDesignContext, DesignPackage, EstimateBotInput
- ✅ design.prompts.ts includes buildConceptPrompt, buildArchitectReviewPrompt, buildFullDesignPrompt

#### **Step 2: Verify Claude Opus Configuration**

```bash
# Check bot config
grep -A 10 "const DESIGN_BOT_CONFIG" bots/keabot-design/src/bot.ts
```

**Expected output:**
```typescript
const DESIGN_BOT_CONFIG: BotConfig = {
  name:         'DesignBot',
  description:  'Generates preliminary design concepts...',
  domain:       'design',
  systemPrompt: DESIGN_BOT_SYSTEM_PROMPT,
  model:        'claude-opus-4-6',    // ← MUST BE OPUS
  maxTokens:    8192,
  temperature:  0.4,
};
```

**✅ PASS CRITERIA:**
- ✅ model is 'claude-opus-4-6' (not Sonnet)
- ✅ maxTokens is 8192 (sufficient for design output)
- ✅ temperature is 0.4 (balanced creativity)

#### **Step 3: Verify Database Setup for Concepts**

```bash
# Check Prisma schema
grep -n "model DesignConcept\|model Project\|model ProjectIntake" \
  packages/database/prisma/schema.prisma

# Expected: Models exist with proper fields
```

**Check for required fields:**
```bash
# Project model must have:
grep -A 20 "^model Project {" packages/database/prisma/schema.prisma | \
  grep -E "projectType|ownerEmail|address|description|status"

# Expected output includes:
# projectType String (or similar)
# ownerEmail String @unique
# address String
# status String? @default("INTAKE")
```

**✅ PASS CRITERIA:**
- ✅ Project model exists with all required fields
- ✅ DesignConcept model exists with images[], description, materials[], cost_estimate
- ✅ ProjectIntake model exists for form capture
- ✅ Relations properly set up (Project → DesignConcept)

#### **Step 4: Deploy Bot to Local**

```bash
cd bots/keabot-design
pnpm install
pnpm build
cd ../..

# Verify bot compiles
pnpm run build --filter=keabot-design

# Check for TypeScript errors
pnpm run type-check --filter=keabot-design
```

**✅ PASS CRITERIA:**
- ✅ No compilation errors
- ✅ No TypeScript errors
- ✅ Build succeeds

#### **Step 5: Test Design Generation - Kitchen Remodel**

**Test Input:**
```json
{
  "projectType": "kitchen",
  "address": "123 Main St, Washington DC 20001",
  "budget": 50000,
  "squareFeet": 200,
  "description": "Outdated kitchen, need modern design with island",
  "preferences": ["modern", "open concept", "white cabinets", "quartz counters"]
}
```

**Execute Test:**
```bash
# Call bot directly or via API
curl -X POST http://localhost:3000/api/v1/design/generate-concept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -d '{
    "projectType": "kitchen",
    "address": "123 Main St, Washington DC 20001",
    "budget": 50000,
    "squareFeet": 200,
    "description": "Outdated kitchen with island",
    "preferences": ["modern", "open concept", "white cabinets"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-kitchen-001",
    "designs": [
      {
        "id": "design-001",
        "name": "Modern Open Concept",
        "description": "Clean modern design with large island...",
        "images": [
          "https://storage.example.com/design-001-1.jpg",
          "https://storage.example.com/design-001-2.jpg",
          "https://storage.example.com/design-001-3.jpg"
        ],
        "materials": {
          "cabinetry": "White shaker cabinets",
          "countertops": "Quartz white",
          "flooring": "Wide plank oak",
          "backsplash": "White subway tile"
        },
        "costEstimate": {
          "low": 42000,
          "high": 58000,
          "currency": "USD"
        },
        "timeline": {
          "duration": "10-12 weeks",
          "phases": ["Design", "Permits", "Demolition", "Rough-in", "Final"]
        }
      },
      {
        "id": "design-002",
        "name": "Contemporary Minimalist",
        // ... similar structure
      },
      {
        "id": "design-003",
        "name": "Classic Transitional",
        // ... similar structure
      }
    ],
    "durationMs": 28500,
    "tokensUsed": {
      "input": 3420,
      "output": 2156,
      "total": 5576
    },
    "estimatedCost": 0.28
  }
}
```

**✅ PASS CRITERIA:**
- ✅ Status 200 OK
- ✅ success: true
- ✅ 3+ design variations returned
- ✅ Each design has images (valid URLs, not broken)
- ✅ Cost estimate is within budget ±20% ($40K-$60K for $50K budget)
- ✅ Materials are realistic for kitchen
- ✅ Timeline is reasonable (8-12 weeks for kitchen)
- ✅ durationMs < 60000 (reasonable response time)
- ✅ tokensUsed calculated correctly
- ✅ estimatedCost is accurate (typical: $0.15-$0.35)
- ✅ No null/undefined values in response

#### **Step 6: Test Design Generation - Other Project Types**

Repeat Step 5 with these test cases:

**Test Case B: Bathroom Remodel**
```json
{
  "projectType": "bathroom",
  "address": "456 Oak Ave, Silver Spring MD 20901",
  "budget": 25000,
  "squareFeet": 75,
  "description": "Master bathroom renovation, add steam shower"
}
```

**Expected Cost Range:** $20K-$30K  
**Expected Timeline:** 4-6 weeks  
**Expected Materials:** Fixtures, tiles, flooring, lighting  

**Test Case C: Basement Conversion**
```json
{
  "projectType": "basement",
  "address": "789 Pine Road, Arlington VA 22201",
  "budget": 80000,
  "squareFeet": 1200,
  "description": "Finish basement, add bathroom and bedroom",
  "preferences": ["family room", "wet bar", "home theater"]
}
```

**Expected Cost Range:** $70K-$90K  
**Expected Timeline:** 12-16 weeks  
**Expected Materials:** Framing, electrical, drywall, flooring, fixtures  

**Test Case D: Garden/Landscape**
```json
{
  "projectType": "garden",
  "address": "321 Elm Street, DC 20002",
  "budget": 15000,
  "squareFeet": 400,
  "description": "Backyard garden design with raised beds and patio"
}
```

**Expected Cost Range:** $12K-$18K  
**Expected Timeline:** 4-8 weeks  
**Expected Materials:** Plants, pavers, soil, hardscape materials  

**✅ PASS CRITERIA FOR ALL CASES:**
- ✅ Cost estimates match budget ±20%
- ✅ Timeline varies by project type (bathroom < kitchen < basement)
- ✅ Materials are realistic and appropriate
- ✅ Descriptions are detailed and relevant
- ✅ No errors or timeouts
- ✅ Response times consistent (<60 seconds)

#### **Step 7: Verify Database Storage**

```bash
# Check if design was saved to database
psql $DATABASE_URL -c "
SELECT id, projectId, name, description, createdAt 
FROM \"DesignConcept\" 
WHERE projectId = 'proj-kitchen-001'
LIMIT 1
"

# Expected: 1 row returned with proper data
```

**Database Checks:**
```sql
-- Verify Project record
SELECT id, projectType, address, status, createdAt 
FROM "Project" 
WHERE id = 'proj-kitchen-001';

-- Verify DesignConcept records
SELECT id, projectId, name, cost_estimate, createdAt 
FROM "DesignConcept" 
WHERE projectId = 'proj-kitchen-001';

-- Verify image URLs were saved
SELECT json_array_length(images) as image_count 
FROM "DesignConcept" 
WHERE id = 'design-001';
```

**✅ PASS CRITERIA:**
- ✅ Project record created
- ✅ Status updated (INTAKE → CONCEPT_GENERATED)
- ✅ 3+ DesignConcept records created
- ✅ Images array has 3+ valid URLs
- ✅ created_at timestamps are recent (within last minute)
- ✅ cost_estimate is valid JSON with low, high, currency
- ✅ No NULL values

#### **Step 8: Verify Frontend Display**

If frontend exists (apps/web-main/app/concepts/[projectId]/page.tsx):

```bash
# Open browser to:
# http://localhost:3000/projects/proj-kitchen-001/concepts

# Verify in browser:
# ✅ Page loads without errors
# ✅ 3+ design cards display
# ✅ Images load (no broken image icons)
# ✅ Cost estimates show as ranges ($42K-$58K)
# ✅ Materials list displays clearly
# ✅ Timeline visible
# ✅ "Approve Design" button works
# ✅ "Edit Design" button works
# ✅ "Get Permits" button visible
```

**✅ PASS CRITERIA:**
- ✅ No console errors
- ✅ All images load (check Network tab)
- ✅ Layout responsive on mobile
- ✅ Buttons are clickable
- ✅ Design descriptions render without formatting issues

#### **Step 9: Test Error Handling**

**Error Test 1: Missing Address**
```bash
curl -X POST http://localhost:3000/api/v1/design/generate-concept \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "kitchen",
    "budget": 50000
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Address is required",
  "code": "VALIDATION_ERROR"
}
```

❌ **FAIL CRITERIA:** Stack trace, generic "Internal Server Error", 500 status  
✅ **PASS CRITERIA:** User-friendly error, 400 status, specific error message

**Error Test 2: Invalid Project Type**
```bash
curl -X POST http://localhost:3000/api/v1/design/generate-concept \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "invalid-type",
    "address": "123 Main St",
    "budget": 50000
  }'
```

**Expected:** Error message "Invalid project type. Allowed: kitchen, bathroom, basement, garden, deck, roof, etc."

**Error Test 3: Negative Budget**
```bash
curl -X POST http://localhost:3000/api/v1/design/generate-concept \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "kitchen",
    "address": "123 Main St",
    "budget": -5000
  }'
```

**Expected:** Error message "Budget must be positive number"

**✅ PASS CRITERIA FOR ALL ERRORS:**
- ✅ Response status is 4xx (not 500)
- ✅ Error message is user-friendly (not technical)
- ✅ No stack traces exposed
- ✅ Error code is specific
- ✅ Suggestion provided (if applicable)

#### **Step 10: Performance Benchmarking**

```bash
# Test response time for design generation (3 iterations)
for i in {1..3}; do
  time curl -X POST http://localhost:3000/api/v1/design/generate-concept \
    -H "Content-Type: application/json" \
    -d '{
      "projectType": "kitchen",
      "address": "123 Main St, DC",
      "budget": 50000,
      "description": "Modern kitchen"
    }' > /dev/null
done
```

**✅ PASS CRITERIA:**
- ✅ Average response time < 45 seconds
- ✅ No timeouts (max 60 second timeout)
- ✅ Consistent response times (variance < 10%)
- ✅ Server doesn't hang or become unresponsive

---

## ✅ BETA TEST PROMPT 2: PERMITS BOT VERIFICATION

### TEST GOAL
Verify Permits bot correctly processes permit applications, integrates with jurisdictions, and handles the complete permit workflow.

### EXECUTION STEPS

#### **Step 1: Verify Bot Exists & Configuration**

```bash
# Check bot files
ls -la bots/keabot-permit/
ls -la bots/keabot-permit/src/

# Verify Claude Opus model
grep -A 10 "const PERMIT_BOT_CONFIG" bots/keabot-permit/src/bot.ts
```

**✅ PASS CRITERIA:**
- ✅ model: 'claude-opus-4-6'
- ✅ maxTokens: 8192
- ✅ Has tools: generate_permit_application, submit_to_jurisdiction, track_status, request_corrections

#### **Step 2: Verify Database Schema for Permits**

```bash
# Check Permit model
grep -A 50 "^model Permit {" packages/database/prisma/schema.prisma | head -40
```

**Required fields:**
- ✅ id (UUID)
- ✅ permitNumber (unique, nullable until submitted)
- ✅ projectId (foreign key)
- ✅ permitType (enum: BUILDING, ELECTRICAL, PLUMBING, etc.)
- ✅ jurisdictionId (foreign key)
- ✅ status (enum: DRAFT, SUBMITTED, APPROVED, ISSUED)
- ✅ kealeeStatus (internal status)
- ✅ jurisdictionStatus (external status)
- ✅ applicantName, applicantEmail, applicantPhone
- ✅ address, parcelNumber, zoning
- ✅ plans[] (array of S3 URLs)
- ✅ submittedAt (nullable)
- ✅ approvedAt (nullable)

#### **Step 3: Test Permit Application Generation**

**Test Input:**
```json
{
  "projectId": "proj-kitchen-001",
  "projectType": "KITCHEN_REMODEL",
  "address": "123 Main St, Washington DC 20001",
  "jurisdictionId": "dc-001",
  "applicantName": "John Smith",
  "applicantEmail": "john@example.com",
  "applicantPhone": "(202) 555-0100",
  "budget": 50000,
  "description": "Kitchen remodel with new island"
}
```

**Execute Test:**
```bash
curl -X POST http://localhost:3000/api/v1/permits/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -d '{
    "projectId": "proj-kitchen-001",
    "projectType": "KITCHEN_REMODEL",
    "address": "123 Main St, Washington DC 20001",
    "jurisdictionId": "dc-001",
    "applicantName": "John Smith",
    "applicantEmail": "john@example.com",
    "applicantPhone": "(202) 555-0100",
    "budget": 50000,
    "description": "Kitchen remodel"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "permitId": "permit-kitchen-001",
    "projectId": "proj-kitchen-001",
    "permitType": "BUILDING",
    "jurisdictionRefNumber": null,
    "status": "DRAFT",
    "estimatedFee": 450,
    "estimatedProcessingTime": "14 days",
    "application": {
      "summary": "Kitchen remodel with new island...",
      "scope": "Remove and replace kitchen...",
      "plans": [],
      "calculatedFee": 450
    },
    "nextSteps": [
      "Upload construction drawings",
      "Provide engineer calculations",
      "Submit to DC Building Permit Office"
    ]
  }
}
```

**✅ PASS CRITERIA:**
- ✅ Status 200 OK
- ✅ success: true
- ✅ Permit created with status DRAFT
- ✅ estimatedFee is realistic ($400-$500 for $50K project)
- ✅ processingTime is jurisdiction-appropriate (DC: 14 days)
- ✅ scope is detailed and relevant
- ✅ nextSteps are clear and actionable

#### **Step 4: Test Permit Submission to Jurisdiction**

```bash
curl -X POST http://localhost:3000/api/v1/permits/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -d '{
    "permitId": "permit-kitchen-001",
    "jurisdictionId": "dc-001",
    "submissionMethod": "API"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "permitId": "permit-kitchen-001",
    "submitResponse": {
      "confirmationNumber": "DC-2026-0001234",
      "submittedAt": "2026-04-06T14:23:00Z",
      "estimatedDecisionDate": "2026-04-20"
    },
    "status": "SUBMITTED",
    "trackingUrl": "https://dc-build.gov/permits/DC-2026-0001234"
  }
}
```

**✅ PASS CRITERIA:**
- ✅ confirmationNumber is unique and jurisdiction-formatted
- ✅ submittedAt is recent timestamp
- ✅ estimatedDecisionDate is reasonable (14+ days from submission)
- ✅ trackingUrl is valid and accessible
- ✅ Status changed to SUBMITTED

#### **Step 5: Test Permit Status Tracking**

```bash
# Query status
curl -X GET http://localhost:3000/api/v1/permits/permit-kitchen-001/status \
  -H "Authorization: Bearer $TEST_USER_TOKEN"

# Expected: Current status from jurisdiction
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "permitId": "permit-kitchen-001",
    "status": "UNDER_REVIEW",
    "jurisdictionStatus": "In Plan Review",
    "lastUpdated": "2026-04-06T12:00:00Z",
    "estimatedDecision": "2026-04-20",
    "nextMilestone": "Electrical review phase",
    "issues": []
  }
}
```

**✅ PASS CRITERIA:**
- ✅ Status matches jurisdiction query
- ✅ lastUpdated is recent
- ✅ estimatedDecision is future date
- ✅ nextMilestone is informative
- ✅ issues array (empty if no issues)

#### **Step 6: Test Corrections Handling**

**Simulate Jurisdiction Request for Corrections:**
```json
{
  "permitId": "permit-kitchen-001",
  "correction": "Electrical calculations must be stamped by PE",
  "affectedSheets": ["Sheet A2"],
  "dueDate": "2026-04-13"
}
```

```bash
curl -X POST http://localhost:3000/api/v1/permits/corrections \
  -H "Content-Type: application/json" \
  -d '{
    "permitId": "permit-kitchen-001",
    "correction": "Electrical calculations must be stamped by PE",
    "affectedSheets": ["Sheet A2"],
    "dueDate": "2026-04-13"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "correctionId": "corr-001",
    "permitId": "permit-kitchen-001",
    "issue": "Electrical calculations must be stamped by PE",
    "severity": "MAJOR",
    "dueDate": "2026-04-13",
    "assignedTo": "ARCHITECT",
    "status": "PENDING",
    "suggestedActions": [
      "Contact licensed PE for calculations review",
      "Obtain PE stamp and signature",
      "Resubmit with corrected calculations"
    ]
  }
}
```

**✅ PASS CRITERIA:**
- ✅ correctionId is unique
- ✅ severity is appropriate (MINOR, MAJOR, CRITICAL)
- ✅ assignedTo is correct (ARCHITECT, ENGINEER, CONTRACTOR, OWNER)
- ✅ suggestedActions are helpful
- ✅ dueDate is respected (< 30 days)

#### **Step 7: Test Multiple Jurisdictions**

Test with different jurisdictions to ensure bot adapts:

**Test Case: Maryland Jurisdiction**
```bash
curl -X POST http://localhost:3000/api/v1/permits/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-kitchen-002",
    "jurisdictionId": "md-montgomery",
    "projectType": "KITCHEN_REMODEL",
    "address": "456 Oak Ave, Silver Spring MD 20901",
    "budget": 45000,
    "applicantName": "Jane Doe",
    "applicantEmail": "jane@example.com"
  }'
```

**Verify:**
- ✅ Fee is calculated per Maryland rates (different from DC)
- ✅ Processing time is Maryland-standard (different from DC)
- ✅ Required documents match Maryland requirements
- ✅ Form fields match Maryland permit form

**✅ PASS CRITERIA:**
- ✅ Different jurisdictions have different requirements
- ✅ Fees vary by jurisdiction
- ✅ Processing times vary by jurisdiction
- ✅ All bot responses are jurisdiction-aware

#### **Step 8: Database Verification**

```bash
# Check Permit records
psql $DATABASE_URL -c "
SELECT id, permitNumber, status, jurisdictionStatus, submittedAt 
FROM \"Permit\" 
WHERE projectId = 'proj-kitchen-001'
"

# Check PermitSubmission records
psql $DATABASE_URL -c "
SELECT id, permitId, submittedVia, submittedAt, confirmationNumber 
FROM \"PermitSubmission\" 
WHERE permitId = 'permit-kitchen-001'
"

# Check PermitCorrection records
psql $DATABASE_URL -c "
SELECT id, permitId, source, severity, status, dueDate 
FROM \"PermitCorrection\" 
WHERE permitId = 'permit-kitchen-001'
"
```

**✅ PASS CRITERIA:**
- ✅ Permit record created with correct status
- ✅ PermitSubmission record exists with confirmationNumber
- ✅ submittedAt timestamp is valid
- ✅ PermitCorrection records properly linked
- ✅ All dates are in correct format
- ✅ No NULL values in required fields

#### **Step 9: Error Handling**

**Test: Submit with missing jurisdiction**
```bash
curl -X POST http://localhost:3000/api/v1/permits/submit \
  -H "Content-Type: application/json" \
  -d '{
    "permitId": "permit-invalid",
    "jurisdictionId": null
  }'
```

**Expected:** Error with message "Jurisdiction is required"

**Test: Submit permit twice (duplicate)**
```bash
# First submission
curl -X POST http://localhost:3000/api/v1/permits/submit \
  -H "Content-Type: application/json" \
  -d '{"permitId": "permit-kitchen-001", "jurisdictionId": "dc-001"}'

# Second submission (should fail)
curl -X POST http://localhost:3000/api/v1/permits/submit \
  -H "Content-Type: application/json" \
  -d '{"permitId": "permit-kitchen-001", "jurisdictionId": "dc-001"}'
```

**Expected:** Error "Permit already submitted"

**✅ PASS CRITERIA:**
- ✅ All error messages are user-friendly
- ✅ No duplicate submissions allowed
- ✅ No 500 errors (all 4xx)
- ✅ Helpful suggestions provided

---

## ✅ BETA TEST PROMPT 3: END-TO-END USER FLOW

### TEST GOAL
Test complete user journey from project intake through concept selection to permit filing, ensuring seamless integration and data flow.

### EXECUTION STEPS

#### **Step 1: Simulate User Intake Form**

```bash
# Step 1: User fills intake form on website
curl -X POST http://localhost:3000/api/v1/intake/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "homeowner@example.com",
    "phone": "(202) 555-0123",
    "firstName": "Robert",
    "lastName": "Johnson",
    "projectType": "kitchen",
    "address": "789 Maple Drive, Washington DC 20003",
    "budget": 60000,
    "timeline": "3-6 months",
    "description": "Update 1980s kitchen with modern design",
    "preferences": ["white cabinet style", "marble counters", "stainless steel appliances"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-e2e-001",
    "intakeId": "intake-e2e-001",
    "status": "CONCEPT_PENDING",
    "nextStep": "AI Concept Generation",
    "estimatedWaitTime": "5-10 minutes"
  }
}
```

**✅ PASS CRITERIA:**
- ✅ projectId created
- ✅ User data saved to database
- ✅ Status is CONCEPT_PENDING
- ✅ Confirmation sent to email

#### **Step 2: Verify Email Confirmation**

```bash
# Check if email was sent (Resend)
# In development, check logs or Resend dashboard
grep -i "homeowner@example.com" ~/.logs/resend.log

# Expected email content:
# Subject: "Your Kitchen Concept Design is Ready"
# Body: "We're creating your custom design concepts. View status: https://kealee.com/projects/proj-e2e-001"
```

**✅ PASS CRITERIA:**
- ✅ Email sent within 5 seconds
- ✅ Contains project link
- ✅ Contains next steps
- ✅ Professional template

#### **Step 3: Trigger AI Concept Generation**

```bash
# Backend: Trigger keabot-design
curl -X POST http://localhost:3000/api/v1/bots/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer system" \
  -d '{
    "botId": "design-bot",
    "projectId": "proj-e2e-001",
    "action": "generate_concepts"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "RUNNING",
    "jobId": "job-design-001",
    "estimatedDuration": "30 seconds"
  }
}
```

#### **Step 4: Wait for Concept Generation (Simulated)**

```bash
# Poll for completion
for i in {1..6}; do
  curl -X GET http://localhost:3000/api/v1/projects/proj-e2e-001/status \
    -H "Authorization: Bearer $TEST_USER_TOKEN"
  
  # Check if complete
  if [ "$(response | jq .status)" = "CONCEPT_READY" ]; then
    echo "✅ Concepts generated!"
    break
  fi
  
  echo "⏸ Waiting... checking in 5 seconds"
  sleep 5
done
```

**Expected Response (when complete):**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-e2e-001",
    "status": "CONCEPT_READY",
    "designs": [
      { "id": "design-001", "name": "Modern White", ... },
      { "id": "design-002", "name": "Classic Elegant", ... },
      { "id": "design-003", "name": "Contemporary", ... }
    ],
    "generatedAt": "2026-04-06T14:25:30Z"
  }
}
```

**✅ PASS CRITERIA:**
- ✅ Status changes to CONCEPT_READY
- ✅ 3+ designs returned
- ✅ Total generation time < 45 seconds
- ✅ User notified via email

#### **Step 5: User Selects Design**

```bash
curl -X POST http://localhost:3000/api/v1/projects/proj-e2e-001/select-design \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -d '{
    "designId": "design-001",
    "action": "APPROVE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-e2e-001",
    "selectedDesignId": "design-001",
    "status": "PERMITS_PENDING",
    "nextStep": "Generate Permit Applications"
  }
}
```

**✅ PASS CRITERIA:**
- ✅ Design selected
- ✅ Status updated to PERMITS_PENDING
- ✅ Next email sent: "Preparing your permit applications..."

#### **Step 6: Auto-Generate Permits**

```bash
curl -X POST http://localhost:3000/api/v1/permits/generate-for-project \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer system" \
  -d '{
    "projectId": "proj-e2e-001",
    "designId": "design-001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-e2e-001",
    "permits": [
      {
        "permitId": "permit-e2e-001",
        "permitType": "BUILDING",
        "status": "DRAFT",
        "estimatedFee": 500
      },
      {
        "permitId": "permit-e2e-002",
        "permitType": "ELECTRICAL",
        "status": "DRAFT",
        "estimatedFee": 300
      }
    ],
    "totalEstimatedFees": 800
  }
}
```

**✅ PASS CRITERIA:**
- ✅ Multiple permits generated (BUILDING, ELECTRICAL minimum)
- ✅ Each permit has DRAFT status
- ✅ Fees estimated correctly
- ✅ Permits linked to project

#### **Step 7: Review & Submit Permits**

```bash
# User reviews permits and submits
curl -X POST http://localhost:3000/api/v1/permits/submit-project-permits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -d '{
    "projectId": "proj-e2e-001",
    "permitIds": ["permit-e2e-001", "permit-e2e-002"],
    "paymentMethodId": "pm-1223"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-e2e-001",
    "submitted": 2,
    "totalFees": 800,
    "chargeId": "ch-e2e-001",
    "status": "PERMITS_SUBMITTED",
    "confirmations": [
      { "permitId": "permit-e2e-001", "confirmationNumber": "DC-2026-0009999" },
      { "permitId": "permit-e2e-002", "confirmationNumber": "DC-2026-0010000" }
    ]
  }
}
```

**✅ PASS CRITERIA:**
- ✅ Stripe charge processed ($800)
- ✅ Both permits submitted
- ✅ Confirmation numbers generated
- ✅ Project status updated

#### **Step 8: Send Completion Email**

```bash
# Verify final email sent
grep -i "homeowner@example.com" ~/.logs/resend.log | tail -1

# Expected:
# Subject: "Your Permits Have Been Submitted!"
# Body includes:
# - Confirmation numbers
# - Links to track status
# - Next steps (scheduling inspections)
```

**✅ PASS CRITERIA:**
- ✅ Email sent within 30 seconds
- ✅ All confirmation numbers included
- ✅ Tracking links provided
- ✅ Professional, clear formatting

#### **Step 9: Verify Database Transaction Integrity**

```bash
# Check complete flow in database
psql $DATABASE_URL << EOF

-- Verify Project
SELECT id, status, ownerEmail, createdAt FROM "Project" 
WHERE id = 'proj-e2e-001';

-- Verify DesignConcept
SELECT id, projectId, name, createdAt FROM "DesignConcept" 
WHERE projectId = 'proj-e2e-001';

-- Verify Permits
SELECT id, projectId, status, jurisdictionStatus, submittedAt FROM "Permit" 
WHERE projectId = 'proj-e2e-001';

-- Verify PermitSubmission
SELECT id, permitId, confirmationNumber, submittedAt FROM "PermitSubmission" 
WHERE permitId LIKE 'permit-e2e-%';

-- Verify Stripe Charge
SELECT id, amount, status, createdAt FROM "Payment" 
WHERE projectId = 'proj-e2e-001';

EOF
```

**✅ PASS CRITERIA:**
- ✅ All records created in correct sequence
- ✅ Foreign keys properly linked
- ✅ Timestamps show proper progression
- ✅ No orphaned records
- ✅ Payment status is COMPLETED
- ✅ No duplicate submissions

#### **Step 10: Test Dashboard Display**

```bash
# Open in browser: http://localhost:3000/projects/proj-e2e-001

# Verify display:
# ✅ Project title: "Update 1980s kitchen..."
# ✅ Status badge: "Permits Submitted"
# ✅ Timeline showing: Intake → Concept → Permits
# ✅ Design images display
# ✅ Cost estimates show
# ✅ Permit confirmations visible
# ✅ Next steps clear (scheduling)
# ✅ Contact contractor CTA visible
```

**✅ PASS CRITERIA:**
- ✅ All pages load without errors
- ✅ Proper responsive design (mobile, tablet, desktop)
- ✅ Images load correctly
- ✅ No broken links
- ✅ Data matches database exactly
- ✅ Professional UI/UX

---

## ✅ BETA TEST PROMPT 4: DATA INTEGRITY & VALIDATION

### TEST GOAL
Verify database consistency, transaction safety, and data validation across all operations.

### EXECUTION STEPS

#### **Step 1: Foreign Key Integrity**

```bash
# Test 1: Delete project - should cascade to designs
psql $DATABASE_URL << EOF

BEGIN;

-- Create test project
INSERT INTO "Project" (id, projectType, status) 
VALUES ('test-fk-001', 'kitchen', 'INTAKE');

-- Create related design
INSERT INTO "DesignConcept" (id, projectId) 
VALUES ('test-design-fk-001', 'test-fk-001');

-- Verify design exists
SELECT COUNT(*) as design_count FROM "DesignConcept" 
WHERE projectId = 'test-fk-001';

-- Delete project
DELETE FROM "Project" WHERE id = 'test-fk-001';

-- Verify design was cascade deleted
SELECT COUNT(*) as design_count FROM "DesignConcept" 
WHERE projectId = 'test-fk-001';

ROLLBACK;

EOF
```

**✅ PASS CRITERIA:**
- ✅ Design exists before deletion
- ✅ Design is deleted when project deleted (cascade works)
- ✅ No orphaned records

#### **Step 2: Unique Constraints**

```bash
# Test: Duplicate permit number not allowed
psql $DATABASE_URL << EOF

BEGIN;

INSERT INTO "Permit" (id, projectId, permitNumber, status) 
VALUES ('permit-001', 'proj-001', 'DC-2026-0001234', 'DRAFT');

-- Try to insert duplicate permitNumber
INSERT INTO "Permit" (id, projectId, permitNumber, status) 
VALUES ('permit-002', 'proj-002', 'DC-2026-0001234', 'DRAFT');

ROLLBACK;

EOF
```

**Expected:** Unique constraint violation  
**✅ PASS CRITERIA:**
- ✅ Second insert fails
- ✅ Error message mentions unique constraint
- ✅ Transaction rolled back safely

#### **Step 3: NOT NULL Constraints**

```bash
# Test: Cannot create permit without projectId
curl -X POST http://localhost:3000/api/v1/permits/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": null,
    "permitType": "BUILDING",
    "applicantName": "Test"
  }'
```

**Expected:** Validation error  
**✅ PASS CRITERIA:**
- ✅ API validation catches before database
- ✅ Error message: "projectId is required"
- ✅ Status 400

#### **Step 4: Enum Validation**

```bash
# Test: Invalid permit type
curl -X POST http://localhost:3000/api/v1/permits/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-001",
    "permitType": "INVALID_TYPE",
    "applicantName": "Test"
  }'
```

**Expected:** Validation error  
**✅ PASS CRITERIA:**
- ✅ Error message lists valid types
- ✅ Status 400
- ✅ No partial record created

#### **Step 5: Transaction Atomicity**

```bash
# Test: Payment + Permit submission must succeed together or fail together
psql $DATABASE_URL << EOF

BEGIN;

-- Create permit and payment
INSERT INTO "Permit" (id, projectId, status) 
VALUES ('permit-atomic-001', 'proj-001', 'SUBMITTED');

INSERT INTO "Payment" (id, projectId, amount, status) 
VALUES ('pay-atomic-001', 'proj-001', 800, 'COMPLETED');

-- Simulate payment failure (invalid Stripe charge)
UPDATE "Payment" SET status = 'FAILED' WHERE id = 'pay-atomic-001';

-- If transaction fails, both should rollback
ROLLBACK;

-- Verify both rolled back
SELECT COUNT(*) as permit_count FROM "Permit" 
WHERE id = 'permit-atomic-001';

EOF
```

**✅ PASS CRITERIA:**
- ✅ Both records rolled back together
- ✅ No partial transactions
- ✅ Database state is consistent

#### **Step 6: Date Validation**

```bash
# Test: Cannot set approval date before submission date
curl -X POST http://localhost:3000/api/v1/permits/update \
  -H "Content-Type: application/json" \
  -d '{
    "permitId": "permit-001",
    "submittedAt": "2026-04-10",
    "approvedAt": "2026-04-05"
  }'
```

**Expected:** Validation error  
**✅ PASS CRITERIA:**
- ✅ Error: "Approval date cannot be before submission date"
- ✅ Status 400
- ✅ Record not updated

#### **Step 7: Amount Validation**

```bash
# Test: Negative amounts not allowed
curl -X POST http://localhost:3000/api/v1/permits/update-fee \
  -H "Content-Type: application/json" \
  -d '{
    "permitId": "permit-001",
    "fee": -500
  }'
```

**Expected:** Validation error  
**✅ PASS CRITERIA:**
- ✅ Error: "Fee must be positive"
- ✅ Fee not updated
- ✅ Status 400

#### **Step 8: Data Type Validation**

```bash
# Test: Email format validation
curl -X POST http://localhost:3000/api/v1/permits/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-001",
    "permitType": "BUILDING",
    "applicantEmail": "not-an-email"
  }'
```

**Expected:** Validation error  
**✅ PASS CRITERIA:**
- ✅ Error: "Invalid email format"
- ✅ Status 400
- ✅ Record not created

#### **Step 9: Concurrent Update Safety**

```bash
# Simulate two users updating same permit simultaneously
# Terminal 1:
curl -X PUT http://localhost:3000/api/v1/permits/permit-001 \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}' &

# Terminal 2:
curl -X PUT http://localhost:3000/api/v1/permits/permit-001 \
  -H "Content-Type: application/json" \
  -d '{"status": "REJECTED"}' &

wait

# Check final state
curl -X GET http://localhost:3000/api/v1/permits/permit-001
```

**✅ PASS CRITERIA:**
- ✅ One update wins (last write wins, or optimistic locking)
- ✅ No data corruption
- ✅ Database state is consistent
- ✅ No 500 errors

#### **Step 10: Audit Trail Verification**

```bash
# Verify all changes are logged
psql $DATABASE_URL -c "
SELECT entityType, action, performedBy, createdAt 
FROM \"AuditLog\" 
WHERE entityId = 'permit-001' 
ORDER BY createdAt DESC 
LIMIT 10
"
```

**✅ PASS CRITERIA:**
- ✅ Every change logged in AuditLog
- ✅ User/system performing change recorded
- ✅ Timestamp accurate
- ✅ Action type is specific (UPDATE, APPROVE, SUBMIT)
- ✅ beforeData and afterData captured

---

## ✅ BETA TEST PROMPT 5: STRESS TEST & LOAD TESTING

### TEST GOAL
Test system stability under concurrent load, verify performance scales, and identify bottlenecks.

### EXECUTION STEPS

#### **Step 1: Single User Performance Baseline**

```bash
# Test single design generation (baseline)
time curl -X POST http://localhost:3000/api/v1/design/generate-concept \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "kitchen",
    "address": "123 Main St",
    "budget": 50000
  }'
```

**Record metrics:**
- Response time: _____ ms
- Tokens used: _____
- Cost: $ _____

**✅ BASELINE CRITERIA:**
- ✅ Response < 45 seconds
- ✅ Consistent response times
- ✅ No timeouts

#### **Step 2: Gradual Load Increase**

```bash
# Test 5 concurrent design requests
ab -n 5 -c 5 -p design_payload.json \
  -T application/json \
  http://localhost:3000/api/v1/design/generate-concept

# Test 10 concurrent
ab -n 10 -c 10 -p design_payload.json \
  http://localhost:3000/api/v1/design/generate-concept

# Test 20 concurrent
ab -n 20 -c 20 -p design_payload.json \
  http://localhost:3000/api/v1/design/generate-concept
```

**Record for each level:**
- Requests/sec: _____
- Min response: _____ ms
- Mean response: _____ ms
- Max response: _____ ms
- Failed requests: _____

**✅ LOAD TEST CRITERIA:**
- ✅ 5 concurrent: 0% failure
- ✅ 10 concurrent: <5% failure
- ✅ 20 concurrent: <10% failure
- ✅ Response degradation < 50% (max 2x baseline)

#### **Step 3: Permit Generation Under Load**

```bash
# 10 concurrent permit generations
wrk -t 4 -c 10 -d 30s \
  --script permit_load.lua \
  http://localhost:3000/api/v1/permits/generate
```

**permit_load.lua:**
```lua
request = function()
  body = '{"projectType":"kitchen","budget":50000,"jurisdictionId":"dc-001"}'
  return wrk.format(nil, "/api/v1/permits/generate", body)
end
```

**✅ PASS CRITERIA:**
- ✅ >50 successful requests/sec
- ✅ <10% failure rate
- ✅ Average response < 5 seconds
- ✅ No server crashes

#### **Step 4: Mixed Workload**

```bash
# Simulate realistic mix:
# - 50% design requests
# - 30% permit requests  
# - 20% permit submissions

# Use Apache Bench with mixed requests
for i in {1..30}; do
  # Design request
  curl -X POST http://localhost:3000/api/v1/design/generate-concept \
    -H "Content-Type: application/json" \
    -d '' &
  
  # Permit request
  curl -X POST http://localhost:3000/api/v1/permits/generate \
    -d '' &
  
  # Permit submission
  curl -X POST http://localhost:3000/api/v1/permits/submit \
    -d '' &
done

wait
```

**✅ PASS CRITERIA:**
- ✅ Overall success rate >95%
- ✅ No request type fails disproportionately
- ✅ Response times remain predictable
- ✅ Database stays responsive

#### **Step 5: Database Connection Pooling**

```bash
# Monitor connections during load test
psql $DATABASE_URL -c "
SELECT datname, usename, count(*) 
FROM pg_stat_activity 
GROUP BY datname, usename
"
```

**During load test, verify:**
- ✅ Connection limit not exceeded
- ✅ Connections properly returned to pool
- ✅ No connection leaks
- ✅ Average 5-15 active connections (not 100+)

#### **Step 6: Claude API Rate Limiting**

```bash
# Simulate rapid requests to Claude
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/v1/design/generate-concept \
    -H "Content-Type: application/json" \
    -d '{"projectType":"kitchen","address":"123 Main","budget":50000}' &
done

wait

# Check for rate limit errors
tail -100 ~/.logs/api.log | grep -i "rate_limit"
```

**✅ PASS CRITERIA:**
- ✅ Graceful handling of rate limits
- ✅ Retry logic working
- ✅ User-friendly error messages
- ✅ No lost requests

#### **Step 7: Memory and CPU Usage**

```bash
# Monitor during load test
# Terminal 1: Watch system resources
watch -n 1 'top -b -n 1 | head -20'

# Terminal 2: Watch Node process
node --max-old-space-size=4096 ...

# Terminal 3: Run load test
ab -n 100 -c 20 http://localhost:3000/api/v1/design/generate-concept
```

**Monitor:**
- CPU usage: _____ % (should be <80%)
- Memory usage: _____ MB (should be <2000 MB)
- Garbage collection: _____ ms (should be <100 ms pause)

**✅ PASS CRITERIA:**
- ✅ CPU < 80%
- ✅ Memory stable (no memory leaks)
- ✅ GC pauses < 100 ms
- ✅ Response times don't degrade over time

#### **Step 8: Stripe API Load Testing**

```bash
# Test payment processing under load
# Simulate 10 concurrent permit submissions (each with payment)

for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/permits/submit-project-permits \
    -H "Content-Type: application/json" \
    -d '{
      "projectId": "proj-load-'$i'",
      "permitIds": ["permit-load-'$i'"],
      "paymentMethodId": "pm-test"
    }' &
done

wait

# Verify all charges succeeded
psql $DATABASE_URL -c "
SELECT status, count(*) 
FROM \"Payment\" 
WHERE projectId LIKE 'proj-load-%'
GROUP BY status
"
```

**✅ PASS CRITERIA:**
- ✅ All 10 payments processed
- ✅ No duplicate charges
- ✅ All status = COMPLETED
- ✅ Stripe logs show successful requests

#### **Step 9: Email Sending Under Load**

```bash
# Test Resend email API under load
# 20 concurrent intake submissions (20 emails)

for i in {1..20}; do
  curl -X POST http://localhost:3000/api/v1/intake/submit \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test-'$i'@example.com",
      "firstName": "Test",
      "projectType": "kitchen",
      "address": "123 Main",
      "budget": 50000
    }' &
done

wait

# Verify emails sent
sleep 5
curl -X GET https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  | jq '.data | length'
```

**✅ PASS CRITERIA:**
- ✅ All 20 emails sent within 30 seconds
- ✅ No bounces or failures
- ✅ No duplicate emails
- ✅ Resend rate limits not hit

#### **Step 10: Recovery from Failure**

```bash
# Test system recovery after simulated failure

# 1. Start heavy load test
for i in {1..50}; do
  curl http://localhost:3000/api/v1/design/generate-concept &
done

# 2. Kill database connection (simulate outage)
# pkill -f "postgres"  # (or kill Railway service)

# 3. Wait 10 seconds

# 4. Restart database
# systemctl start postgres  # (or restart Railway service)

# 5. Monitor recovery
curl http://localhost:3000/health

# 6. Verify no data corruption
psql $DATABASE_URL -c "SELECT count(*) FROM \"Project\""
```

**✅ PASS CRITERIA:**
- ✅ System detects database offline
- ✅ Returns 503 Service Unavailable (not 200 with error)
- ✅ Requests queue or retry (not lost)
- ✅ Full recovery within 30 seconds
- ✅ No orphaned or partial records
- ✅ Data integrity maintained

---

## 📊 TEST RESULTS SUMMARY

Create file: `BETA_TEST_RESULTS.md`

```markdown
# Beta Test Results — AI Concept & Permits
Date: April 6, 2026
Tester: [Your Name]

## Test 1: AI Concept Bot Verification
- [ ] Kitchen remodel: PASS / FAIL
- [ ] Bathroom remodel: PASS / FAIL
- [ ] Basement conversion: PASS / FAIL
- [ ] Garden/landscape: PASS / FAIL
- [ ] Error handling: PASS / FAIL
- [ ] Performance: PASS / FAIL

**Issues Found:**
- [ ] None
- [ ] Minor (list):
- [ ] Major (list):

## Test 2: Permits Bot Verification
- [ ] Generate permit: PASS / FAIL
- [ ] Submit to jurisdiction: PASS / FAIL
- [ ] Track status: PASS / FAIL
- [ ] Handle corrections: PASS / FAIL
- [ ] Multiple jurisdictions: PASS / FAIL

**Issues Found:**
- [ ] None
- [ ] Minor:
- [ ] Major:

## Test 3: End-to-End Flow
- [ ] Intake form: PASS / FAIL
- [ ] Email confirmation: PASS / FAIL
- [ ] Design generation: PASS / FAIL
- [ ] Design selection: PASS / FAIL
- [ ] Permit generation: PASS / FAIL
- [ ] Payment processing: PASS / FAIL
- [ ] Dashboard display: PASS / FAIL

**Issues Found:**
- [ ] None
- [ ] Minor:
- [ ] Major:

## Test 4: Data Integrity
- [ ] Foreign keys: PASS / FAIL
- [ ] Unique constraints: PASS / FAIL
- [ ] NOT NULL constraints: PASS / FAIL
- [ ] Transaction atomicity: PASS / FAIL
- [ ] Audit trail: PASS / FAIL

**Issues Found:**
- [ ] None
- [ ] Minor:
- [ ] Major:

## Test 5: Stress & Load
- [ ] Baseline performance: PASS / FAIL
- [ ] 5 concurrent users: PASS / FAIL
- [ ] 10 concurrent users: PASS / FAIL
- [ ] 20 concurrent users: PASS / FAIL
- [ ] Database connections: PASS / FAIL
- [ ] Claude rate limiting: PASS / FAIL
- [ ] Payment processing: PASS / FAIL
- [ ] Recovery from failure: PASS / FAIL

**Issues Found:**
- [ ] None
- [ ] Minor:
- [ ] Major:

## Overall Assessment
- Total tests: 45
- Passed: ____
- Failed: ____
- Success rate: ___ %

## Recommendation
- [ ] READY FOR PRODUCTION
- [ ] READY WITH MINOR FIXES
- [ ] NOT READY (critical issues)

## Sign-off
Tested by: _______________
Date: _______________
Approved by: _______________
```

---

## 🎯 WHEN TO STOP TESTING

**Ready for Production When:**
- ✅ All 45 tests pass
- ✅ No critical issues
- ✅ <5 minor issues
- ✅ Load test shows >95% success rate
- ✅ No data corruption observed
- ✅ Recovery works properly
- ✅ Response times acceptable

**Not Ready When:**
- ❌ >2 critical issues
- ❌ Data corruption observed
- ❌ <90% success rate under load
- ❌ Unresolved error handling gaps
- ❌ Email/payment issues

---

## 🚀 NEXT STEPS

**If All Tests Pass:**
```bash
# 1. Prepare production deployment
git add .
git commit -m "feat: Complete beta testing - all tests pass"

# 2. Tag release
git tag -a v1.0.0-beta.1 -m "Beta testing complete"
git push origin v1.0.0-beta.1

# 3. Deploy to production
railway deploy

# 4. Announce launch
# Email: "AI Concept & Permits now available!"
```

**If Issues Found:**
```bash
# 1. Document issues in BETA_TEST_RESULTS.md
# 2. Create GitHub issues for each bug
# 3. Fix issues in priority order
# 4. Retest fixed areas
# 5. Once all pass, deploy
```

---

**All prompts ready to use. Pick one test and start!** ✅


# Kealee Platform x GoHighLevel Integration Plan
## For Claude Code / Cursor Implementation

---

## PROJECT CONTEXT

I'm building the **Kealee Platform v10** — a construction management platform for the DC-Baltimore corridor.

**Current Tech Stack:**
- **Frontend:** Next.js (9 apps, monorepo), deployed on Vercel
- **Backend:** Fastify API, deployed on Railway
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Supabase
- **Payments:** Stripe (43 products configured)
- **Domains:** kealee.com, app.kealee.com, permits.kealee.com, ops.kealee.com, architect.kealee.com, pm.kealee.com, admin.kealee.com, api.kealee.com

**Goal:** Integrate GoHighLevel (GHL) as the marketing, CRM, and sales automation layer so that the Kealee Platform and GHL work together seamlessly.

**GHL API Docs:** https://marketplace.gohighlevel.com/docs/
**GHL GitHub API Docs:** https://github.com/GoHighLevel/highlevel-api-docs

---

## ENVIRONMENT VARIABLES NEEDED

Add these to the Railway backend `.env`:

```env
GHL_API_KEY=your_private_integration_token_here
GHL_LOCATION_ID=your_location_id_here
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_WEBHOOK_SECRET=your_webhook_signing_secret
```

---

## PHASE 1: GHL SERVICE LAYER (Do This First)

### Task 1.1 — Create the GHL API Client

Create a reusable API client service that all other services will use.

**File:** `src/services/ghl/ghl-client.ts`

**Requirements:**
- Create an axios or fetch wrapper with GHL base URL and auth headers
- Include automatic retry with exponential backoff (GHL rate limit: 100 requests per 10 seconds)
- Include error handling and logging
- Use the `Authorization: Bearer {GHL_API_KEY}` header format
- Use `Version: 2021-07-28` header (GHL API v2)
- Export typed methods: `get()`, `post()`, `put()`, `delete()`

### Task 1.2 — Create GHL Contact Service

**File:** `src/services/ghl/ghl-contacts.ts`

**Requirements:**
- `createContact(data)` — Create a contact in GHL with: name, email, phone, address, tags, custom fields
- `updateContact(id, data)` — Update an existing contact
- `findContactByEmail(email)` — Search for existing contact before creating duplicates
- `addTag(contactId, tag)` — Add tags like "Quote Request", "PM Client", "Permit Client"
- `removeTag(contactId, tag)`

**GHL Endpoint:** `POST /contacts/` , `GET /contacts/search` , `PUT /contacts/{contactId}`

### Task 1.3 — Create GHL Pipeline/Opportunity Service

**File:** `src/services/ghl/ghl-opportunities.ts`

**Requirements:**
- `createOpportunity(data)` — Create a deal in a GHL pipeline
- `updateOpportunityStage(id, stageId)` — Move deal through stages
- `getOpportunity(id)` — Retrieve deal details

**Pipeline Stages to Map:**
1. New Lead
2. Quote Requested
3. Quote Sent
4. Consultation Booked
5. Proposal Sent
6. Contract Signed
7. Project Active
8. Project Complete

**GHL Endpoint:** `POST /opportunities/` , `PUT /opportunities/{id}`

### Task 1.4 — Create GHL Calendar Service

**File:** `src/services/ghl/ghl-calendar.ts`

**Requirements:**
- `getAvailableSlots(calendarId, startDate, endDate)` — Get open time slots
- `createAppointment(data)` — Book an appointment
- `cancelAppointment(eventId)` — Cancel booking

**GHL Endpoint:** `GET /calendars/{calendarId}/free-slots` , `POST /calendars/events`

---

## PHASE 2: FASTIFY API ROUTES

### Task 2.1 — GHL Routes

**File:** `src/routes/ghl.routes.ts`

Create these API endpoints:

```
POST   /api/ghl/contacts          — Create or update a GHL contact
GET    /api/ghl/contacts/:email    — Find contact by email
POST   /api/ghl/opportunities      — Create a pipeline opportunity
PUT    /api/ghl/opportunities/:id  — Update opportunity stage
GET    /api/ghl/calendar/slots     — Get available booking slots
POST   /api/ghl/calendar/book      — Book an appointment
```

All routes should require authentication (Supabase JWT middleware).

### Task 2.2 — GHL Webhook Receiver

**File:** `src/routes/ghl-webhooks.routes.ts`

Create a webhook endpoint that GHL will call when events happen:

```
POST   /api/webhooks/ghl          — Receive all GHL webhook events
```

**Events to Handle:**

| GHL Event | What To Do in Kealee |
|-----------|---------------------|
| `ContactCreate` | Log new lead in database |
| `ContactUpdate` | Sync updated info |
| `AppointmentCreate` | Create consultation record in Kealee DB |
| `AppointmentUpdate` | Update consultation status |
| `OpportunityStageUpdate` | Update project status in Kealee |
| `InvoicePaymentReceived` | Mark milestone as paid |
| `FormSubmission` | Create quote request in Kealee |
| `TaskComplete` | Update internal task status |

**Requirements:**
- Verify webhook signature using `GHL_WEBHOOK_SECRET`
- Parse the event type from the webhook payload
- Route to appropriate handler function
- Return 200 quickly, process asynchronously
- Log all webhook events for debugging

---

## PHASE 3: KEALEE → GHL AUTO-SYNC (Triggers)

### Task 3.1 — New User Registration Sync

**When:** A new user registers on any Kealee app (kealee.com, app.kealee.com, etc.)

**Action:**
1. Check if GHL contact exists (by email)
2. If not, create GHL contact with tags: `["Kealee User", "Source: {app_name}"]`
3. Add to "New Leads" pipeline stage
4. Store `ghlContactId` in Kealee user record (Prisma)

**Where to add this:** Hook into existing Supabase auth webhook or user creation controller.

### Task 3.2 — Quote/Estimate Request Sync

**When:** User submits a quote request on any Kealee app

**Action:**
1. Create or update GHL contact
2. Add tag: `"Quote Request - {service_type}"` (e.g., "Quote Request - PM Package", "Quote Request - Permit")
3. Create GHL opportunity with:
   - Pipeline: "Kealee Sales"
   - Stage: "Quote Requested"
   - Value: estimated project value
   - Source: which Kealee app
4. GHL will automatically trigger the email/SMS nurture sequence (configured in GHL)

### Task 3.3 — Checkout/Purchase Sync

**When:** User completes a Stripe checkout on Kealee

**Action:**
1. Update GHL opportunity stage to "Contract Signed"
2. Add tag: `"Customer - {package_name}"`
3. Remove tag: `"Quote Request - {service_type}"`
4. Update GHL contact custom field: `last_purchase_date`, `total_spent`

### Task 3.4 — Project Milestone Updates

**When:** A project milestone is completed in Kealee

**Action:**
1. Update GHL opportunity with milestone status
2. If project complete: move to "Project Complete" stage
3. Trigger review request automation in GHL (after project complete)

---

## PHASE 4: GHL MARKETING AUTOMATIONS TO SET UP

These are configured inside the GHL dashboard (not code), but Claude Code should create a reference doc for what to set up:

### Automation 1: New Lead Welcome Sequence
- **Trigger:** New contact with tag "Kealee User"
- **Actions:**
  - Immediately: Welcome email with Kealee overview
  - Day 1: SMS — "Thanks for visiting Kealee. Need a quote?"
  - Day 3: Email — Service highlight (PM packages)
  - Day 7: Email — Case study / testimonial
  - Day 14: SMS — "Still looking for construction help?"

### Automation 2: Quote Follow-Up Sequence
- **Trigger:** Tag added "Quote Request - *"
- **Actions:**
  - Immediately: Email — "We received your quote request"
  - 1 hour: SMS — "Got your request! We'll have your quote within 24hrs"
  - Day 1: Email — Detailed quote with pricing
  - Day 3: SMS — "Have questions about your quote?"
  - Day 7: Email — "Your quote expires in 7 days"
  - Day 14: Final follow-up

### Automation 3: Post-Project Review Request
- **Trigger:** Opportunity moved to "Project Complete"
- **Actions:**
  - Day 1: Email — "How did we do? Leave a review"
  - Day 3: SMS — Review request with direct Google link
  - Day 7: Email — Referral program offer

### Automation 4: Appointment Reminder
- **Trigger:** Appointment booked
- **Actions:**
  - Immediately: Confirmation email + SMS
  - 24 hours before: Reminder email
  - 1 hour before: SMS reminder

---

## PHASE 5: PRISMA SCHEMA UPDATES

Add these fields/models to your Prisma schema to track GHL sync:

```prisma
// Add to existing User model
model User {
  // ... existing fields
  ghlContactId    String?   @unique
  ghlSyncedAt     DateTime?
}

// Add to existing Project model
model Project {
  // ... existing fields
  ghlOpportunityId  String?   @unique
  ghlPipelineId     String?
  ghlStageId        String?
}

// New model to log all GHL webhook events
model GhlWebhookLog {
  id          String   @id @default(cuid())
  eventType   String
  payload     Json
  processed   Boolean  @default(false)
  error       String?
  createdAt   DateTime @default(now())
}

// New model to track GHL sync status
model GhlSyncStatus {
  id            String   @id @default(cuid())
  entityType    String   // "user", "project", "quote"
  entityId      String
  ghlId         String
  lastSynced    DateTime
  syncDirection String   // "kealee_to_ghl" or "ghl_to_kealee"
  status        String   // "success", "failed", "pending"
  error         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

After updating schema, run:
```bash
npx prisma migrate dev --name add-ghl-integration
```

---

## PHASE 6: TESTING CHECKLIST

Run through each of these manually before going live:

- [ ] Create a test contact in GHL via API
- [ ] Search for a contact by email
- [ ] Create a pipeline opportunity
- [ ] Move opportunity through each stage
- [ ] Receive a webhook from GHL and log it
- [ ] Register a new user on Kealee → verify GHL contact created
- [ ] Submit a quote request → verify GHL opportunity created
- [ ] Complete a Stripe checkout → verify GHL stage updated
- [ ] Complete a project → verify review request triggered
- [ ] Book an appointment via API → verify confirmation sent

---

## FILE STRUCTURE SUMMARY

```
src/
├── services/
│   └── ghl/
│       ├── ghl-client.ts           # Base API client
│       ├── ghl-contacts.ts         # Contact CRUD
│       ├── ghl-opportunities.ts    # Pipeline/deals
│       ├── ghl-calendar.ts         # Booking/scheduling
│       └── index.ts                # Export all
├── routes/
│   ├── ghl.routes.ts               # API routes for frontend
│   └── ghl-webhooks.routes.ts      # Webhook receiver
├── controllers/
│   └── ghl.controller.ts           # Route handlers
├── hooks/
│   └── ghl-sync.hooks.ts           # Auto-sync triggers
└── types/
    └── ghl.types.ts                # TypeScript interfaces
```

---

## IMPLEMENTATION ORDER

Tell Claude Code or Cursor to work in this order:

1. **Phase 1** — GHL service layer (client + contacts + opportunities + calendar)
2. **Phase 5** — Prisma schema updates (need DB ready before routes)
3. **Phase 2** — Fastify API routes + webhook receiver
4. **Phase 3** — Auto-sync triggers (connect existing Kealee events to GHL)
5. **Phase 6** — Test everything
6. **Phase 4** — Set up GHL automations in dashboard manually

---

## HOW TO USE THIS DOCUMENT

### In Claude Code (Terminal):
```
Read the file ghl-integration-plan.md and implement Phase 1 completely. 
Create all the service files listed. Use the GHL API v2 docs at 
https://marketplace.gohighlevel.com/docs/ for exact endpoint details.
Start with ghl-client.ts, then build each service on top of it.
```

### In Cursor (Composer):
```
@ghl-integration-plan.md Implement Phase 1 of this integration plan. 
Create the GHL client and all service files. Reference the existing 
Fastify backend structure for consistency.
```

### Moving to Next Phase:
```
Phase 1 is complete. Now implement Phase 2 from 
@ghl-integration-plan.md — create all Fastify routes 
and the webhook receiver.
```

---

## KEALEE SERVICE → GHL TAG MAPPING

| Kealee Service | GHL Tag |
|----------------|---------|
| PM Basic ($1,750/mo) | `Customer - PM Basic` |
| PM Professional ($4,500/mo) | `Customer - PM Professional` |
| PM Enterprise ($16,500/mo) | `Customer - PM Enterprise` |
| Architecture Basic ($2,500) | `Customer - Arch Basic` |
| Architecture Premium ($35,000) | `Customer - Arch Premium` |
| Project Owner Starter ($49/mo) | `Customer - PO Starter` |
| Project Owner Pro ($999/mo) | `Customer - PO Pro` |
| Permit Basic ($495) | `Customer - Permit Basic` |
| Permit Complex ($7,500) | `Customer - Permit Complex` |
| Ops Service | `Customer - Ops` |
| Estimation Service | `Customer - Estimation` |

---

## NOTES

- GHL API rate limit: 100 requests per 10 seconds per location
- GHL daily limit: 200,000 requests per day per location
- Always check for existing contact before creating (avoid duplicates)
- Store GHL IDs in Kealee database for two-way sync
- Log all webhook events for debugging
- GHL Private Integration Token is found in: Settings → Integrations → Private Integrations
- GHL Location ID is found in: Settings → Business Profile

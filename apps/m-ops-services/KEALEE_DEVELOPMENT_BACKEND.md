# Kealee Development Backend System

Complete backend implementation for managing Development Advisory leads with database integration, API endpoints, and admin dashboard.

## 🎯 What Was Built

### Database Models (Prisma)
- **DevelopmentLead** - Main lead model with full contact and project information
- **DevelopmentLeadNote** - Notes attached to leads
- **DevelopmentLeadActivity** - Activity log for tracking all interactions

### API Endpoints (RESTful)
- **GET /api/development-leads** - List all leads with filtering, search, sorting, pagination
- **POST /api/development-leads** - Create new lead (manual entry)
- **GET /api/development-leads/[id]** - Get single lead with notes and activities
- **PATCH /api/development-leads/[id]** - Update lead (tracks status/assignment changes)
- **DELETE /api/development-leads/[id]** - Delete lead
- **GET /api/development-leads/stats** - Dashboard statistics and metrics
- **POST /api/development-leads/[id]/notes** - Add note to lead
- **GET /api/development-leads/[id]/notes** - Get all notes for lead
- **POST /api/development-leads/[id]/activities** - Log activity
- **GET /api/development-leads/[id]/activities** - Get activity log
- **POST /api/intake** - Public intake form submission (updated to save to database)

### Admin Dashboard
- **Dashboard Page** (`/portal/development-leads`) - Lead list with stats, filters, search
- **Lead Detail Page** (`/portal/development-leads/[id]`) - Full lead management interface

---

## 📊 Database Schema

### DevelopmentLead Model

```prisma
model DevelopmentLead {
  id String @id @default(uuid())

  // Contact Information
  fullName    String
  company     String
  email       String
  phone       String?
  role        String
  
  // Project Details
  location        String
  assetType       DevelopmentAssetType
  units           String
  notUnitBased    Boolean
  projectStage    DevelopmentProjectStage
  budgetRange     String
  timeline        String
  needsHelp       String[]
  message         String @db.Text

  // Lead Management
  status      DevelopmentLeadStatus
  priority    DevelopmentLeadPriority
  source      DevelopmentLeadSource
  assignedTo  String?
  
  // Deal Information
  estimatedValue    Decimal? @db.Decimal(12, 2)
  proposalSentAt    DateTime?
  proposalAmount    Decimal? @db.Decimal(12, 2)
  closedAt          DateTime?
  closedAmount      Decimal? @db.Decimal(12, 2)
  lostReason        String?
  
  // Communication
  lastContactedAt DateTime?
  nextFollowUpAt  DateTime?
  
  // Metadata
  consent        Boolean
  ipAddress      String?
  userAgent      String?
  submittedAt    DateTime
  createdAt      DateTime
  updatedAt      DateTime
  
  // Relations
  notes      DevelopmentLeadNote[]
  activities DevelopmentLeadActivity[]
}
```

### Enums

```prisma
enum DevelopmentLeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL_SENT
  NEGOTIATING
  WON
  LOST
  ARCHIVED
}

enum DevelopmentLeadPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum DevelopmentLeadSource {
  WEBSITE
  REFERRAL
  LINKEDIN
  EMAIL
  PHONE
  OTHER
}

enum DevelopmentProjectStage {
  PRE_ACQUISITION
  UNDER_CONTRACT
  DESIGN
  PERMITTING
  BIDDING
  IN_CONSTRUCTION
  STALLED_RESCUE
}

enum DevelopmentAssetType {
  MULTIFAMILY
  MIXED_USE
  TOWNHOMES
  SFD
  COMMERCIAL
  INDUSTRIAL
  OTHER
}
```

---

## 🚀 Setup Instructions

### 1. Database Setup

Ensure your `.env` file (in workspace root or `packages/database`) has a `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kealee_dev"
```

### 2. Generate Prisma Client

```bash
cd packages/database
npx prisma generate
```

### 3. Run Database Migration

```bash
cd packages/database
npx prisma migrate dev --name add_development_leads
```

This will create the new tables in your database.

### 4. Restart Development Server

```bash
cd apps/m-ops-services
pnpm dev
```

---

## 📡 API Usage Guide

### List Leads with Filtering

```bash
GET /api/development-leads?status=NEW&priority=HIGH&search=austin&page=1&limit=20
```

**Query Parameters:**
- `status` - Filter by status (NEW, CONTACTED, etc.)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assignedTo` - Filter by assigned user ID
- `assetType` - Filter by asset type
- `projectStage` - Filter by project stage
- `search` - Search in name, company, email, location
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "leads": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get Lead Details

```bash
GET /api/development-leads/[id]
```

**Response includes:**
- Full lead information
- All notes (ordered by date)
- All activities (ordered by date)

### Update Lead

```bash
PATCH /api/development-leads/[id]
Content-Type: application/json

{
  "status": "QUALIFIED",
  "priority": "HIGH",
  "estimatedValue": 50000,
  "nextFollowUpAt": "2026-02-15T10:00:00Z",
  "updatedBy": "user-id"
}
```

**Note:** Status and assignment changes automatically create activity log entries.

### Add Note to Lead

```bash
POST /api/development-leads/[id]/notes
Content-Type: application/json

{
  "content": "Had a great call with John. Moving to qualified status.",
  "createdBy": "user-id",
  "isPrivate": false
}
```

### Log Activity

```bash
POST /api/development-leads/[id]/activities
Content-Type: application/json

{
  "activityType": "EMAIL_SENT",
  "description": "Sent initial proposal email",
  "createdBy": "user-id",
  "metadata": {
    "subject": "Owner's Rep Proposal for ABC Project",
    "emailId": "msg-123"
  }
}
```

**Activity Types:**
- `LEAD_CREATED`
- `STATUS_CHANGED`
- `ASSIGNED`
- `EMAIL_SENT`
- `CALL_MADE`
- `MEETING_SCHEDULED`
- `PROPOSAL_SENT`
- `NOTE_ADDED`
- `FOLLOW_UP`

### Get Statistics

```bash
GET /api/development-leads/stats
```

**Response:**
```json
{
  "overview": {
    "totalLeads": 150,
    "recentLeads": 12,
    "needsFollowUp": 8,
    "conversionRate": 32.5
  },
  "pipeline": {
    "totalValue": 2500000,
    "totalClosed": 850000,
    "activeLeadsCount": 45,
    "wonLeadsCount": 18
  },
  "breakdown": {
    "byStatus": [...],
    "byPriority": [...],
    "byAssetType": [...],
    "byProjectStage": [...]
  }
}
```

---

## 🎛️ Admin Dashboard Features

### Lead List Page (`/portal/development-leads`)

**Features:**
- Stats overview cards (Total, Pipeline Value, Follow-ups, Win Rate)
- Search bar (name, company, email, location)
- Status filter dropdown
- Priority filter dropdown
- Lead cards with key information
- Click to view details
- Pagination
- Responsive design

**Stats Cards:**
1. **Total Leads** - Count with recent leads (last 7 days)
2. **Pipeline Value** - Total estimated value of active leads
3. **Needs Follow-up** - Overdue follow-ups count
4. **Win Rate** - Conversion percentage

### Lead Detail Page (`/portal/development-leads/[id]`)

**Features:**
- Full lead information display
- Edit mode for updating lead details
- Status and priority dropdowns
- Estimated value tracking
- Project details section
- Notes section with add capability
- Activity log sidebar
- Quick actions (Email, Call, Meeting, Proposal)
- Real-time activity tracking

**Editable Fields:**
- Status
- Priority
- Estimated Value
- Assignment

**Actions:**
- Add Note
- Log Activity
- Send Email (placeholder)
- Log Call (placeholder)
- Schedule Meeting (placeholder)
- Send Proposal (placeholder)

---

## 🔄 Data Flow

### 1. Website Intake Form Submission

```
User fills form on /development/contact
  ↓
POST /api/intake
  ↓
Validate with Zod schema
  ↓
Check spam protection (honeypot + timing)
  ↓
Save to DevelopmentLead table
  ↓
Create initial activity log entry
  ↓
Send email notification
  ↓
Return success response
```

### 2. Lead Management

```
Admin opens /portal/development-leads
  ↓
Fetch stats from /api/development-leads/stats
  ↓
Fetch leads from /api/development-leads
  ↓
Apply filters and pagination
  ↓
Display lead cards
  ↓
Click lead to view details
  ↓
Fetch lead with notes and activities
  ↓
Update lead / Add notes / Log activities
  ↓
Automatic activity logging for changes
```

---

## 📈 Metrics & Analytics

### Available Metrics

1. **Lead Volume**
   - Total leads
   - New leads (last 7 days)
   - Leads by status
   - Leads by priority

2. **Pipeline Health**
   - Total pipeline value (active leads)
   - Average deal size
   - Leads needing follow-up
   - Leads by project stage

3. **Conversion Metrics**
   - Win rate percentage
   - Total closed value
   - Average time to close
   - Loss reasons analysis

4. **Lead Source Performance**
   - Leads by source
   - Conversion rate by source
   - Average deal value by source

5. **Activity Metrics**
   - Total activities logged
   - Activities by type
   - Response time averages

---

## 🔒 Security Considerations

### Current Implementation

1. **Spam Protection**
   - Honeypot field in intake form
   - Minimum time-to-submit check (3 seconds)
   - Server-side validation with Zod

2. **Data Validation**
   - All API endpoints validate input
   - Prisma type safety
   - Required field enforcement

### Recommended Additions

1. **Authentication & Authorization**
   - Add auth middleware to API routes
   - Implement role-based access control
   - Protect admin dashboard routes

2. **Rate Limiting**
   - Add rate limiting to public intake endpoint
   - Implement per-IP throttling

3. **Data Privacy**
   - Add GDPR compliance fields
   - Implement data retention policies
   - Add audit logging for sensitive changes

---

## 🔧 Customization

### Adding Custom Fields

1. **Update Prisma Schema**
```prisma
model DevelopmentLead {
  // Add new field
  customField String?
}
```

2. **Generate Prisma Client**
```bash
cd packages/database
npx prisma generate
npx prisma migrate dev --name add_custom_field
```

3. **Update API Validation**
```typescript
// lib/validations/intake.ts
export const intakeSchema = z.object({
  // Add validation
  customField: z.string().optional(),
})
```

4. **Update UI Components**
- Add field to intake form
- Add field to lead detail page
- Add field to lead list display

### Adding New Activity Types

1. Update activity type constants
2. Add UI options in activity dropdown
3. Document in activity types list

### Customizing Statistics

Edit `/api/development-leads/stats/route.ts` to add new metrics:
- Additional groupBy queries
- New calculated metrics
- Time-based analysis

---

## 🐛 Troubleshooting

### Prisma Client Not Found

```bash
cd packages/database
npx prisma generate
```

### Database Connection Error

Check your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://localhost:5432/kealee_dev"
```

Test connection:
```bash
cd packages/database
npx prisma db push
```

### API Returning 500 Errors

1. Check Prisma client is generated
2. Verify database tables exist
3. Check server console logs
4. Ensure enum values match database

### Stats Not Loading

1. Verify leads exist in database
2. Check browser console for errors
3. Test API endpoint directly: `GET /api/development-leads/stats`

---

## 📝 Next Steps

### Immediate

1. ✅ Run database migration
2. ✅ Generate Prisma client
3. ✅ Test intake form submission
4. ✅ Verify lead appears in database
5. ✅ Test admin dashboard

### Short-term Enhancements

1. **Email Integration**
   - Send emails directly from admin panel
   - Email templates for common scenarios
   - Track email opens and clicks

2. **Calendar Integration**
   - Schedule meetings from admin panel
   - Sync with Google Calendar
   - Automatic follow-up reminders

3. **Reporting**
   - Export leads to CSV
   - Weekly/monthly reports
   - Custom report builder

4. **Automation**
   - Auto-assign leads based on rules
   - Automated follow-up reminders
   - Status auto-progression

5. **Communication History**
   - Gmail integration
   - Call logging integration
   - Meeting notes storage

### Long-term Enhancements

1. **CRM Features**
   - Pipeline stages
   - Deal forecasting
   - Sales team management

2. **Analytics Dashboard**
   - Advanced metrics
   - Trend analysis
   - Predictive insights

3. **Integration**
   - Zapier integration
   - API webhooks
   - Third-party CRM sync

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client#using-the-generated-prisma-client-in-typescript)

---

**Status:** ✅ Complete Backend System with Database Integration, API Endpoints, and Admin Dashboard

Built with: Prisma, PostgreSQL, Next.js 14 API Routes, TypeScript

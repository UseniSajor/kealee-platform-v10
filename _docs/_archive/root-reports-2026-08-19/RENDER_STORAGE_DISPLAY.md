# Concept Renders - Storage & Display Guide

## Where Renders Are Stored

### Primary Storage: Supabase/S3
- **Type**: CloudFront CDN-backed S3 buckets
- **Location**: AWS S3 (us-east-1, us-west-2)
- **Access**: HTTPS URLs through CloudFront
- **Format**: PNG/JPG (1920×1080, 2560×1440, 4K)

### Database Reference
**Table**: `concept_outputs` (Prisma)

```
Fields:
- id: UUID (concept ID)
- renderUrls: String[] (array of S3/CloudFront URLs)
  Example: [
    "https://d123xyz.cloudfront.net/concepts/abc123-render-1.jpg",
    "https://d123xyz.cloudfront.net/concepts/abc123-render-2.jpg",
    "https://d123xyz.cloudfront.net/concepts/abc123-render-3.jpg"
  ]
- tier: 1 | 2 | 3 (determines count: 3 | 6 | 12)
- includes: String[] (deliverable IDs)
```

---

## Where Renders Are Viewable

### 1. Customer Portal (Primary) ✅
**URL**: `https://web-main.kealee.com/deliverables/[intakeId]`

**What you see**:
- Full-screen gallery of all renders
- Downloadable PDFs with renders + specs
- Tier-appropriate count:
  - Basic: 3 renders
  - Premium: 6 renders
  - Premium+: 12 renders
- Interactive viewer with zoom, rotate, fullscreen
- Lifetime access with login

**Who can access**: Customer who submitted intake (email verified)

---

### 2. Admin Command Center
**URL**: `https://web-main.kealee.com/command-center/concepts`

**What you see**:
- Admin dashboard showing all submitted concepts
- Concept render previews in grid
- Status: pending, approved, delivered, etc.

**Who can access**: Internal staff (admin role)

---

### 3. Direct Concept Page
**URL**: `https://web-main.kealee.com/concept/[conceptId]`

**What you see**:
- Individual concept full-page display
- Large render gallery
- Design details and specifications
- Permit + zoning guidance
- Video (if Premium+)

**Who can access**: Anyone with conceptId (shareable link)

---

### 4. Pre-Design Results (Older Path)
**URL**: `https://web-main.kealee.com/pre-design/results/[id]`

**What you see**:
- Concept output from pre-design phase
- Render gallery
- Historical data

**Who can access**: Owner with link

---

## How Renders Get There

### Render Generation Flow

```
1. Customer submits intake form
   ↓
2. `/api/concept/generate` route triggered
   ↓
3. AI generation service (DesignBot via os-ai-orch) creates renders
   ↓
4. Renders uploaded to S3
   - Bucket: kealee-concepts (or tier-specific bucket)
   - CloudFront distribution: d123xyz.cloudfront.net
   - File naming: [intakeId]-[tier]-[number].jpg
   ↓
5. URLs stored in Prisma concept_outputs.renderUrls
   ↓
6. Customer portal displays renders at /deliverables/[intakeId]
```

---

## Render Specifications by Tier

### Tier 1: Basic
- **Count**: 3 renders
- **Resolution**: 1920×1080 (Full HD)
- **Format**: JPEG/PNG
- **Size**: ~2-3 MB each
- **Content**: Design concept + room visualization

### Tier 2: Premium
- **Count**: 6 renders
- **Resolution**: 2560×1440 (2.5K)
- **Format**: JPEG/PNG
- **Size**: ~3-5 MB each
- **Content**: Multiple angles, detail shots, material/finish options

### Tier 3: Premium+
- **Count**: 12 renders
- **Resolution**: 4K (3840×2160)
- **Format**: JPEG/PNG, WebP optimized
- **Size**: ~5-10 MB each
- **Content**: Full design suite - 360° perspectives, day/night lighting, materials closeups

---

## Accessing Test Renders

### Example: Existing Concept
If concept ID is `abc123-def456`:

**Direct Link**:
```
https://web-main.kealee.com/concept/abc123-def456
```

**Portal Link** (requires login):
```
https://web-main.kealee.com/deliverables/abc123-def456
```

### How to Generate Test Renders

**Step 1**: Submit test intake form
- Go to: https://web-main.kealee.com/kitchen (or any service)
- Fill out form
- Select tier (1, 2, or 3)
- Complete checkout

**Step 2**: Wait for concept generation
- Takes 3-5 minutes
- Email confirmation when ready

**Step 3**: View renders
- Click "View Concept" in email
- Or go to portal: https://web-main.kealee.com/deliverables/[intakeId]

---

## Technical Architecture

### Storage Layer
```
AWS S3 (primary)
├── Bucket: kealee-concepts
├── Tier-specific folders:
│   ├── tier-1/ (Basic - 3 renders)
│   ├── tier-2/ (Premium - 6 renders)
│   └── tier-3/ (Premium+ - 12 renders)
└── CloudFront CDN for delivery

Fallback: Supabase Storage
├── Path: /concepts/[intakeId]/
└── Auto-generated signed URLs (24-48 hr expiry)
```

### Database Layer
```
Prisma Model: ConceptOutput
├── intakeId: UUID
├── tier: 1 | 2 | 3
├── renderUrls: String[] (S3/CloudFront URLs)
├── includes: String[] (deliverable labels)
├── status: 'generated' | 'approved' | 'delivered'
└── createdAt, updatedAt: timestamps
```

### Display Layer
```
Frontend Pages:
├── /deliverables/[intakeId] (customer portal)
├── /concept/[conceptId] (shareable concept view)
├── /command-center/concepts (admin dashboard)
└── /pre-design/results/[id] (legacy)
```

---

## Current Status

### Renders Viewable Today
- ✅ **Customer Portal**: Fully functional at `/deliverables/[intakeId]`
- ✅ **Direct Links**: Shareable concept pages at `/concept/[conceptId]`
- ✅ **S3 Storage**: All renders persisted to CloudFront CDN
- ✅ **Database**: Render URLs indexed in Prisma

### Render Generation
- ✅ **AI Bot**: DesignBot (v30) generates tier-aware renders
- ✅ **Tier Support**: 3-tier rendering (3, 6, 12 count)
- ✅ **Upload**: Automatic S3 upload on generation
- ✅ **Email**: Confirmation emails with view links

---

## How to View Your Renders

**If you have an intake ID** (e.g., `550e8400-e29b-41d4-a716-446655440000`):

### Option 1: Customer Portal (Best)
```
https://web-main.kealee.com/deliverables/550e8400-e29b-41d4-a716-446655440000
```
- Requires login with intake email
- Full-resolution downloads
- Lifetime access
- PDF with specifications

### Option 2: Direct Concept Link
```
https://web-main.kealee.com/concept/550e8400-e29b-41d4-a716-446655440000
```
- No login required
- Shareable with anyone
- Read-only view
- Design specifications

---

## Demo / Test Access

**To test with real renders**:
1. Submit intake form at https://web-main.kealee.com/kitchen
2. Select any tier (Basic/Premium/Premium+)
3. Complete checkout (test card: 4242-4242-4242-4242)
4. Wait 3-5 minutes for renders to generate
5. View at `/deliverables/[intakeId]` or `/concept/[intakeId]`

---

**Summary**: 
- ✅ Renders stored in S3 (CloudFront CDN)
- ✅ Viewable at `/deliverables/[intakeId]` (customer portal)
- ✅ Shareable at `/concept/[conceptId]` (direct link)
- ✅ Admin dashboard at `/command-center/concepts`
- ✅ Fully operational and accessible

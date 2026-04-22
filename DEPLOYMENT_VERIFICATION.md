# Deployment Verification & Migration Guide

**Status**: 5ccc9eb6 pushed to main. Railway auto-deploy triggered. Awaiting verification.

---

## Phase 1: Verify Railway Build & Deployment

### Step 1: Monitor Build Logs
Visit https://dashboard.railway.app and check the **artistic-kindness** project for recent deployments.

**Expected logs for pnpm fix (commit 5ccc9eb6):**
```
[setup] npm install -g pnpm@8.15.9
[setup] pnpm --version
  pnpm 8.15.9

[install] pnpm install --frozen-lockfile
  Packages in scope: @kealee/*, services/*, apps/*, bots/*, packages/*
  ...
  Progress: resolved 3210, reused 3100, downloaded 110

[build] pnpm build
  Running build in 18 packages
  ...
  ✓ api (1m 23s)
  ✓ worker (58s)
  ✓ web-main (2m 11s)
  ✓ command-center (1m 45s)
  ✓ portal-owner (1m 32s)
  ✓ portal-contractor (1m 28s)
  ✓ portal-developer (1m 39s)
  ✓ admin-console (1m 44s)
```

**If you see "RUN npm i" instead:**
- Old Docker image is still cached
- Fix: Delete service and redeploy from GitHub
- Or: Force rebuild via Railway dashboard

**Expected build time**: 4-5 minutes total (vs 20+ with Docker)

---

### Step 2: Verify Service Health

Once deployed, run health checks against all 8 services:

```bash
# Verify web-main
curl https://kealee.com/api/health

# Verify kealee-api
curl https://api.kealee.com/health

# Verify Portal apps (internal only)
# curl http://portal-owner.railway.app/health
# curl http://portal-contractor.railway.app/health
```

**Expected responses:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-22T...",
  "uptime": "...",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "worker": "healthy"
  }
}
```

---

## Phase 2: Run Prisma Migration

Two new migrations need to be applied to production PostgreSQL:

1. **20260418_add_project_output** — ProjectOutput table (already in code)
2. **20260425_enhance_project_output_for_deliverables** — Enhanced schema (already in code)

### Step 2A: Verify Migrations Are in Code

```bash
ls -la packages/database/prisma/migrations/ | grep 202604
```

Expected output:
```
20260418_add_project_output/
20260425_enhance_project_output_for_deliverables/
```

### Step 2B: Run Migration on Production

Railway PostgreSQL is auto-connected via `DATABASE_URL` environment variable.

**Option 1: Via Railway CLI (Recommended)**

```bash
# Set environment to production
export RAILWAY_PROJECT_ID="8187fcf6-9916-49aa-bc75-77407f83d319"
export RAILWAY_ENVIRONMENT_ID="ff19d499-942b-4668-9a26-a21ecb20e349"

# Run migration
pnpm exec prisma migrate deploy --skip-generate

# Verify applied migrations
pnpm exec prisma migrate status
```

**Option 2: Via API Service SSH**

If Railway CLI fails, connect directly to API service:

```bash
# Open SSH session to kealee-api service
railway shell

# Inside container:
cd /app
pnpm exec prisma migrate deploy --skip-generate
```

**Option 3: Via Direct Database Connection**

If SSH doesn't work, connect directly to PostgreSQL:

```bash
# Get DATABASE_URL from railway dashboard
export DATABASE_URL="postgresql://postgres:...@ballast.proxy.rlwy.net:46074/railway"

# Run migration from local machine
pnpm exec prisma migrate deploy

# Verify
pnpm exec prisma db execute --stdin < packages/database/schema.prisma
```

### Step 2C: Verify Migration Applied

After running `prisma migrate deploy`, verify new columns exist:

```sql
-- Connect to Railway PostgreSQL
psql $DATABASE_URL

-- Check project_outputs table
\d project_outputs

-- Verify 8 new columns:
-- serviceType (text)
-- deliveryStatus (text)
-- conceptImageUrls (text[])
-- estimationPdfUrl (text)
-- permitFileUrls (text[])
-- fileMetadata (jsonb)
-- serviceLeadId (text)
-- fileUploadIds (text[])

-- Check new indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'project_outputs'
ORDER BY indexname;
```

Expected indexes:
- `project_outputs_service_type_idx`
- `project_outputs_delivery_status_idx`
- `project_outputs_created_at_idx`
- `project_outputs_intake_id_idx`
- `project_outputs_service_lead_id_idx`

---

## Phase 3: Verify Deliverable Storage Integration

Once migration is applied, test the full pipeline:

### Step 3A: Create Test Concept Intake

```bash
# 1. Submit concept intake
curl -X POST https://api.kealee.com/api/v1/concept/intake \
  -H "Content-Type: application/json" \
  -d '{
    "homeownerName": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "projectType": "kitchen_remodel",
    "description": "Modern kitchen with island seating",
    "address": "123 Main St, San Francisco, CA",
    "budget": "50000-100000"
  }'

# Response should include intakeId (UUID)
# Example: {"intakeId": "550e8400-e29b-41d4-a716-446655440000", "status": "RECEIVED"}

export INTAKE_ID="550e8400-e29b-41d4-a716-446655440000"
```

### Step 3B: Complete Checkout & Trigger Processing

```bash
# 2. Create Stripe checkout session
curl -X POST https://api.kealee.com/api/v1/concept/checkout \
  -H "Content-Type: application/json" \
  -d "{\"intakeId\": \"$INTAKE_ID\"}"

# Response includes Stripe checkout URL
# Complete payment in Stripe dashboard (use test card: 4242 4242 4242 4242)

# Stripe webhook should trigger automatically
# This creates ProjectOutput record + enqueues processing job
```

### Step 3C: Monitor Processing via API

```bash
# 3. Poll project output status
for i in {1..10}; do
  curl https://api.kealee.com/api/project-output/$INTAKE_ID
  echo "Poll $i complete. Waiting 3 seconds..."
  sleep 3
done

# Expected progression:
# 1. {"status": "pending"}
# 2. {"status": "generating", "progress": 33}
# 3. {"status": "generating", "progress": 66}
# 4. {"status": "completed", "deliverables": {...}}
```

### Step 3D: Verify Supabase Upload

Check Supabase Storage buckets for uploaded files:

```bash
# Via Supabase Dashboard:
# 1. Go to Storage → designs bucket
# 2. Verify concept PDFs exist: /concept/<intakeId>/<filename>.pdf
# 3. Go to Storage → documents bucket
# 4. Verify estimation PDFs exist (for estimation service)
# 5. Go to Storage → permits bucket
# 6. Verify permit files exist (for permit service)

# Or via Supabase CLI:
supabase --project-ref xxxxxxxx storage list designs
supabase --project-ref xxxxxxxx storage list documents
```

### Step 3E: Verify Database Records

```sql
-- Query ProjectOutput records
SELECT
  id,
  intake_id,
  service_type,
  delivery_status,
  concept_image_urls,
  estimation_pdf_url,
  permit_file_urls,
  created_at
FROM project_outputs
WHERE intake_id = '<your-intake-id>'
LIMIT 5;

-- Check FileUpload records
SELECT
  id,
  file_name,
  file_url,
  service_type,
  created_at
FROM file_uploads
WHERE intake_id = '<your-intake-id>'
LIMIT 10;
```

---

## Phase 4: Email Delivery Verification

Once Supabase upload works, verify email delivery:

### Step 4A: Set RESEND_API_KEY on Services

Ensure `RESEND_API_KEY` environment variable is set on:
- [ ] services/api (kealee-api)
- [ ] services/worker
- [ ] services/keacore

```bash
# Via Railway dashboard:
# 1. Select service (e.g., kealee-api)
# 2. Settings → Variables
# 3. Add: RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 4. Redeploy
```

### Step 4B: Trigger Email Send

After deliverable generation completes, email should auto-send via notification system:

```bash
# Check API logs for email delivery
# Expected log: "[Email] Sent concept deliverable to john@example.com"

# View Resend dashboard for delivery status:
# https://resend.com/emails

# Expected email contains:
# - Concept title + project name
# - 3-column image gallery (if concept images generated)
# - Budget range table
# - 7-day download link to PDF on Supabase
# - 3 CTAs: Order Permits, Find Contractor, Connect with Architect
```

---

## Phase 5: Web-Main Integration

Verify that web-main displays persisted URLs from ProjectOutput:

### Step 5A: Navigate to Results Page

```bash
# After completing checkout, user redirected to:
# https://kealee.com/pre-design/results/[intakeId]

# Page should display:
# 1. ProcessingLoader (if still generating)
# 2. Concept images from Supabase (with 7-day signed URLs)
# 3. Download button → links to PDF on Supabase Storage
# 4. Budget range table
# 5. Feasibility summary
# 6. ResultsReadyBanner with green checkmarks for deliverables
# 7. CTAs: "Get Permits", "Find Contractor"
```

### Step 5B: Verify Signed URLs Work

```bash
# From results page, click "Download PDF"
# Expected: Direct download from Supabase Storage
# (not redirect through API)

# Verify URL format:
# https://[project].supabase.co/storage/v1/object/public/designs/concept/[intakeId]/[filename].pdf?token=[signed-token]&expires=...

# Test URL expiry:
# URL should work for 7 days
# After 7 days, should return 403 Forbidden
```

---

## Checklist: Ready for Go-Live

- [ ] **Build verified** — Commit 5ccc9eb6 deployed, pnpm used (not npm)
- [ ] **All 8 services healthy** — /health endpoints respond with status=healthy
- [ ] **Migrations applied** — 20260418 + 20260425 run on production PostgreSQL
- [ ] **Concept intake → ProjectOutput created** — DB records visible
- [ ] **Concept PDF generated + uploaded to Supabase** — Files visible in storage dashboard
- [ ] **Signed URLs generated + working** — 7-day expiry verified
- [ ] **Email delivered** — Concept email in Resend dashboard with Supabase URLs
- [ ] **Web-main displays persisted URLs** — Results page shows concept images from Supabase
- [ ] **End-to-end flow works** — Payment → Processing → Storage → Display (0 errors)
- [ ] **Contingency paths tested** — Missing data handled gracefully (fallback text shown)

---

## Troubleshooting

### Issue: "npm i" still in Railway logs

**Symptom**: Build logs show "RUN npm i" instead of "pnpm install"

**Solution**:
1. Check Railway dashboard → Services → Settings
2. Verify builder is set to "Nixpacks" (not Docker)
3. If Docker selected, switch to Nixpacks and redeploy
4. Check for old Dockerfile in codebase: `find . -name "Dockerfile" -type f`
5. If found, delete: `git rm Dockerfile` + commit + push

### Issue: "Unsupported URL Type 'workspace:'"

**Symptom**: Build fails with "Unsupported URL Type 'workspace:*'" during pnpm install

**Solution**:
1. Verify .nixpacks.toml has [phases.setup] section
2. Check that "npm install -g pnpm@8.15.9" runs before install phase
3. If not, force rebuild: Railway dashboard → Services → "Force Rebuild" button

### Issue: Migration fails with "column already exists"

**Symptom**: `prisma migrate deploy` fails with "column already exists"

**Solution**:
1. Check which migrations have already been applied: `pnpm exec prisma migrate status`
2. If 20260425 already applied, skip it
3. If partially applied, mark as resolved: `pnpm exec prisma migrate resolve --rolled-back 20260425_enhance_project_output_for_deliverables`

### Issue: Supabase files not uploading

**Symptom**: Deliverables generated but not in Supabase Storage

**Check**:
1. `NEXT_PUBLIC_SUPABASE_URL` set on web-main service
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` set on web-main service
3. `SUPABASE_SERVICE_ROLE_KEY` set on kealee-api service
4. Supabase bucket policies allow public reads: `SELECT: Everyone can read`
5. Check API logs for upload errors: `[Storage] Error uploading...`

### Issue: Email not sending

**Symptom**: PDF generated and uploaded but email not received

**Check**:
1. `RESEND_API_KEY` set on kealee-api service
2. `RESEND_FROM_EMAIL` set (defaults to deliverables@kealee.com)
3. Check Resend dashboard for bounces or failures
4. Verify email address is not on blocklist

---

## Next Steps After Verification

### Week 1: Phase 1 Integration (Enhanced PDFs)
- [ ] Replace `generateConceptPDF()` with `generateConceptPDFEnhanced()` from services/api/src/lib/pdf-generator-enhanced.ts
- [ ] Test with jsPDF library (already included in package.json)
- [ ] Verify professional PDF styling in Supabase downloads
- [ ] Monitor Supabase storage usage (estimate ~5MB per concept PDF)

### Week 2: Phase 2 (Concept Images)
- [ ] Choose image provider: Stable Diffusion (free), Midjourney ($30/mo), DALL-E 3 ($0.04/image)
- [ ] Set up API integration in services/api/src/lib/concept-image-generator.ts
- [ ] Add cost tracking to prevent runaway spending
- [ ] Test with reference photos from capture sessions

### Week 3-4: Phase 3-5 (Email, Real-Time, Full Integration)
- [ ] Integrate deliverable-email-service.ts into processing flow
- [ ] Set up WebSocket endpoint for real-time notifications
- [ ] Wire useRealtimeNotifications hook into results page
- [ ] End-to-end testing with concurrent users

---

## Resources

**Code Files**:
- `/packages/database/prisma/migrations/20260418_add_project_output/` — ProjectOutput schema
- `/packages/database/prisma/migrations/20260425_enhance_project_output_for_deliverables/` — Deliverable columns
- `/services/api/src/lib/deliverable-generator.ts` — PDF generation (placeholders)
- `/services/api/src/lib/pdf-generator-enhanced.ts` — Advanced PDFs (ready to integrate)
- `/packages/storage/src/storage.ts` — Supabase upload functions
- `/apps/web-main/app/pre-design/results/[id]/page.tsx` — Results page with persisted URLs

**Documentation**:
- `/SESSION_SUMMARY.md` — Full session overview (6 phases)
- `/RAILWAY_BUILD_FIX.md` — Build configuration details
- `/DELIVERABLE_STORAGE_IMPLEMENTATION.md` — Storage architecture guide
- `/FUTURE_ENHANCEMENTS_GUIDE.md` — Phase 1-5 integration timeline

**External**:
- Railway dashboard: https://dashboard.railway.app (project: artistic-kindness)
- Supabase dashboard: https://app.supabase.com (project: kealee)
- Resend dashboard: https://resend.com/emails

---

**Status**: Ready for verification phase. All code committed and deployed.
**Last commit**: 5ccc9eb6 (FIX: Use correct Nixpacks TOML format)
**Next action**: Monitor Railway build completion → Run Prisma migration → Test end-to-end flow

# 3D Model Integration Guide

**Date:** 2026-07-21 | **Status:** Integration Ready | **Tier:** Premium+

## Overview

The 3D model generation is now integrated into the design workflow. After DesignBot generates concepts, the system automatically submits 3D generation jobs if the customer's tier supports it (Premium+ tier 2+).

## Architecture Flow

```
User pays for Premium+ DesignBot
         ↓
DesignBot generates 3 concepts (JSON)
         ↓
processDesignOutputWithTier() checks tier
         ↓
integrateDesignWith3D() calls orchestrator
         ↓
orchestrateDesign3DGeneration() submits jobs
         ↓
Replicate (Meshy/Tripo3D) processes in parallel
         ↓
Webhook POST → /api/webhooks/replicate-3d
         ↓
handleSuccess() updates design with model URLs
         ↓
Portal displays 3D viewer with GLB/USDZ models
         ↓
Homeowner gets email: "3D models ready!"
```

## Components

### 1. Tier Detection (`design-tier-handler.ts`)

**Function:** `getTierFromIntake(intakeData)`
- Extracts tier from intake form data
- Maps to tier level (1=Basic, 2=Premium, 3=Premium+)

**Function:** `processDesignOutputWithTier(designOutput, projectId, tier, projectType, intakeData)`
- Main integration entry point
- Checks if tier supports 3D (tier >= 2)
- Calls 3D orchestrator if supported
- Returns enhanced design output with 3D job info

**Usage:**
```typescript
import { processDesignOutputWithTier } from '@/lib/design-tier-handler'

// After DesignBot completes
const tierInfo = getTierFromIntake(intakeData)
const designWithM3D = await processDesignOutputWithTier(
  designOutput,
  projectId,
  tierInfo.tier,
  projectType,
  intakeData
)

// Save to database
await db.intake.update({
  where: { id: projectId },
  data: { formData: { v30ConceptOutput: designWithM3D } }
})
```

### 2. 3D Integration (`design-3d-integration.ts`)

**Function:** `integrateDesignWith3D(input)`
- Submits 3D jobs for all concepts
- Returns job metadata (provider, jobId, status)
- Non-blocking (returns immediately)

**Function:** `isDesign3DReady(designOutput)`
- Checks if all 3D models are completed
- Used by portal to show "3D Ready" badge

**Function:** `pollDesign3DStatus(designOutput)`
- Polls status of all pending 3D jobs
- Called by frontend on interval

### 3. Webhook Receiver (`app/api/webhooks/replicate-3d/route.ts`)

**Endpoint:** `POST /api/webhooks/replicate-3d`

**Verifies:**
- Replicate webhook signature (HMAC-SHA256)
- Required env var: `REPLICATE_WEBHOOK_SECRET`

**Handles:**
- `status: processing` — Update UI with progress
- `status: succeeded` — Extract model URLs, update database, send email
- `status: failed/canceled` — Mark as failed, optionally email homeowner

**Environment variables:**
```bash
REPLICATE_API_TOKEN=...         # For submitting 3D jobs
REPLICATE_WEBHOOK_SECRET=...    # For verifying webhooks
```

### 4. Status Polling Endpoint (`app/api/design/[intakeId]/3d-status/route.ts`)

**Endpoint:** `GET /api/design/{intakeId}/3d-status`

**Response:**
```json
{
  "ready": false,
  "pending": 2,
  "completed": 1,
  "failed": 0,
  "concepts": [
    {
      "id": "concept-1",
      "name": "Budget Kitchen",
      "status": "completed",
      "modelUrl": "https://s3.../model.glb",
      "previewUrl": "https://s3.../preview.png",
      "usdzUrl": "https://s3.../model.usdz"
    }
  ]
}
```

**Called by:** Portal UI (every 10s while "Generating..." badge shows)

## Integration Points

### 1. After DesignBot Completes

**File:** `packages/kealee-agent-stack/src/v30/design-bot-executor.ts` or wherever DesignBot is called.

```typescript
import { processDesignOutputWithTier } from '@/lib/design-tier-handler'

// After executeV30DesignBot() returns
const designOutput = /* from DesignBot */
const tier = /* from intake or Stripe */

const designWithM3D = await processDesignOutputWithTier(
  designOutput,
  projectId,
  tier,
  projectType,
  intakeData
)

// Augmented design output now includes threeDModels in each concept
```

### 2. When Replicate Completes

**File:** `app/api/webhooks/replicate-3d/route.ts`

Webhook receives model URLs and updates the database:

```typescript
// In handleSuccess()
await db.intake.update({
  where: { id: projectId },
  data: {
    formData: {
      v30ConceptOutput: {
        concepts: concepts.map(c =>
          c.id === webhook.jobId
            ? { ...c, threeDModels: { modelUrl, previewUrl, usdzUrl, status: 'completed' } }
            : c
        )
      }
    }
  }
})
```

### 3. Frontend Polling

**In portal component:**

```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await fetch(`/api/design/${intakeId}/3d-status`)
    setDesign3DStatus(status)
    
    if (status.ready) {
      clearInterval(interval)
      showNotification('Your 3D models are ready!')
    }
  }, 10000) // Poll every 10s
  
  return () => clearInterval(interval)
}, [intakeId])
```

## Database Schema Updates

### Design Concept Type (already added)

```typescript
export interface V30DesignConcept {
  id: string
  name: string
  positioning: 'BUDGET' | 'BALANCED' | 'PREMIUM'
  // ... existing fields ...
  
  threeDModels?: {
    provider: string        // 'meshy' | 'tripo3d' | 'blockade'
    jobId: string          // Replicate prediction ID
    status: 'queued' | 'processing' | 'completed' | 'failed'
    modelUrl?: string      // GLB model (when completed)
    usdzUrl?: string       // iOS AR format (Premium+ only)
    previewUrl?: string    // PNG thumbnail
    generatedAt?: string   // ISO timestamp
    completedAt?: string   // ISO timestamp
  }
}
```

### Intake formData JSONB

```json
{
  "v30ConceptOutput": {
    "concepts": [
      {
        "id": "concept-1",
        "threeDModels": {
          "provider": "meshy",
          "jobId": "pred_abc123",
          "status": "processing"
        }
      }
    ]
  }
}
```

## Email Notifications

### When 3D Models Are Ready

**Trigger:** Webhook handler `handleSuccess()`

**Template:** `design-3d-ready`

**To:** Homeowner email

**Content:**
- Concept name (Budget/Balanced/Premium)
- 3D model preview image
- Link to view in portal
- Premium+: "View in AR on your iPhone" link
- Materials and cost breakdown

### When 3D Generation Fails (Optional)

**Trigger:** Webhook handler `handleFailure()`

**Template:** `design-3d-failed`

**Content:**
- Apology message
- 2D renderings still available
- Retry option
- Support contact

## Tier Mapping

| Tier | Package | 3D Available | Quality | Models | Format |
|------|---------|--------------|---------|--------|--------|
| 1 | Basic | ❌ | — | — | — |
| 2 | Premium | ✅ | Basic | 1 per concept | GLB + PNG |
| 3 | Premium+ | ✅ | Enhanced | 1 per concept | GLB + USDZ + PNG |

## Replicate Configuration

### Webhook Setup

1. **Create webhook endpoint:**
   - URL: `https://your-domain.com/api/webhooks/replicate-3d`
   - Events: `prediction.*`

2. **Set webhook secret:**
   ```bash
   REPLICATE_WEBHOOK_SECRET=whsec_...
   ```

3. **Test webhook:**
   ```bash
   replicate predict meshy-ai/text-to-3d:latest \
     --prompt "Modern kitchen with white cabinets" \
     --webhook https://your-domain.com/api/webhooks/replicate-3d
   ```

### API Token Configuration

```bash
REPLICATE_API_TOKEN=r8_...
```

## Portal Display

### Concept Gallery with 3D

```
┌─ Budget Kitchen ─────────────────┐
│ [2D Renderings] [3D Viewer]     │
│ [View in AR]                    │
│ Cost: $75k-95k | Timeline: 6-8w │
└─────────────────────────────────┘
```

### 3D Viewer Component

```typescript
<Design3DViewer
  modelUrl={concept.threeDModels?.modelUrl}
  previewUrl={concept.threeDModels?.previewUrl}
  usdzUrl={concept.threeDModels?.usdzUrl}
  onARClick={() => openARPreview()}
/>
```

### Loading State

```typescript
{concept.threeDModels?.status === 'processing' && (
  <div className="generating-badge">
    <Spinner />
    Generating 3D model... (2-5 min)
  </div>
)}

{concept.threeDModels?.status === 'completed' && (
  <button onClick={() => viewer3D.load(modelUrl)}>
    View 3D Model
  </button>
)}

{concept.threeDModels?.status === 'failed' && (
  <div className="error">
    3D model generation encountered an issue.
    2D renderings still available below.
  </div>
)}
```

## Testing

### Local Testing

1. **Set environment variables:**
   ```bash
   REPLICATE_API_TOKEN=r8_...
   REPLICATE_WEBHOOK_SECRET=whsec_test_...
   ```

2. **Start dev server:**
   ```bash
   cd apps/web-main
   pnpm run dev
   ```

3. **Simulate 3D job submission:**
   ```bash
   # In a test script
   const result = await generate3DModel({
     prompt: "Modern kitchen with white cabinets",
     quality: "basic",
     modelType: "kitchen"
   })
   console.log(result.jobId) // pred_abc123
   ```

4. **Simulate webhook:**
   ```bash
   curl -X POST http://localhost:3101/api/webhooks/replicate-3d \
     -H 'Content-Type: application/json' \
     -H 'Replicate-Signature: sha256=...' \
     -d '{
       "id": "pred_abc123",
       "status": "succeeded",
       "output": {
         "model_url": "https://s3.../model.glb",
         "preview_url": "https://s3.../preview.png"
       }
     }'
   ```

### Production Testing

1. **Create test Premium+ order** (Stripe test mode)
2. **Fill out intake form** with kitchen remodel
3. **Complete payment** → DesignBot runs → 3D jobs submitted
4. **Monitor logs** for job submission and webhook receipt
5. **Wait 5-10 min** for models to generate
6. **Check portal** for 3D models in concept gallery
7. **Test AR preview** on iPhone (Premium+ only)

## Monitoring

### Metrics to Track

- **3D Job Submission Rate:** Tier 2+ customers should all get jobs submitted
- **Model Generation Success Rate:** Aim for >95%
- **Time to Completion:** Average 2-5 min (basic), 5-10 min (enhanced)
- **Cost per Project:** ~$0.15 (3 models × $0.05 each)

### Error Handling

- **Signature verification fails** → 401, log and ignore
- **Project ID extraction fails** → 400, log and ignore
- **Model URL extraction fails** → Success response, but log warning
- **Database update fails** → Log error, webhook retry will trigger

### Dashboard Queries

```sql
-- Success rate
SELECT COUNT(*) as total,
  SUM(CASE WHEN threeDModels->>'status' = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN threeDModels->>'status' = 'failed' THEN 1 ELSE 0 END) as failed
FROM concept
WHERE createdAt > NOW() - INTERVAL 7 DAY;

-- Average generation time
SELECT AVG(
  EXTRACT(EPOCH FROM (threeDModels->>'completedAt')::timestamp - threeDModels->>'generatedAt'::timestamp)
) as avg_generation_time_seconds
FROM concept
WHERE threeDModels->>'status' = 'completed';
```

## Troubleshooting

### 3D Models Not Generating

1. **Check tier:** Is customer Premium+ (tier >= 2)?
2. **Check API key:** Is `REPLICATE_API_TOKEN` set?
3. **Check logs:** Look for "3D integration complete" message
4. **Check Replicate dashboard:** Any failed predictions?

### Webhook Not Received

1. **Check URL:** Verify webhook URL in Replicate dashboard
2. **Check secret:** Verify `REPLICATE_WEBHOOK_SECRET` matches Replicate
3. **Check firewall:** Is endpoint publicly accessible?
4. **Test manually:** `curl -X POST http://localhost:3101/api/webhooks/replicate-3d`

### Models Not Updating in Portal

1. **Check webhook handler:** Did it update the database?
2. **Check polling:** Is frontend calling `/api/design/{intakeId}/3d-status`?
3. **Check database:** Are model URLs stored in formData.v30ConceptOutput?

## Next Steps

1. **Implement database updates** in webhook handler (TODO: marked in route.ts)
2. **Wire up tier detection** from Stripe integration
3. **Build 3D viewer component** for portal (GLB + USDZ support)
4. **Add email templates** for "3D Ready" and "3D Failed" notifications
5. **Set up monitoring** dashboard for 3D generation metrics
6. **Production deploy** and test with live orders

---

See also:
- [CLAUDE_3D_DESIGN_SERVICE.md](./CLAUDE_3D_DESIGN_SERVICE.md) — Feature overview
- [design-tier-handler.ts](../../apps/web-main/lib/design-tier-handler.ts) — Tier detection
- [design-3d-integration.ts](../../packages/kealee-agent-stack/src/v30/design-3d-integration.ts) — Integration logic
- [replicate-3d webhook](../../apps/web-main/app/api/webhooks/replicate-3d/route.ts) — Webhook handler

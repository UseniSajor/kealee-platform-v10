# Lead Distribution Implementation

## Summary

Updated lead distribution logic in `services/api/src/modules/marketplace/leads.service.ts` to respect contractor capacity and implement deterministic selection algorithm.

## Implementation Details

### Files Created/Modified

1. **`services/api/src/modules/marketplace/leads.service.ts`** (New)
   - Implements capacity-aware lead distribution
   - Deterministic contractor selection algorithm
   - Audit and event logging

2. **`services/api/src/modules/marketplace/leads.routes.ts`** (New)
   - `POST /marketplace/leads/:leadId/distribute` - Distribute lead to contractors
   - `GET /marketplace/leads/:leadId` - Get lead details

3. **`services/api/src/modules/marketplace/__tests__/leads.service.test.ts`** (New)
   - Comprehensive test suite for distribution logic

4. **`services/api/src/index.ts`** (Modified)
   - Registered `leadsRoutes` with prefix `/marketplace`

## Distribution Rules

### Capacity Filtering

1. **acceptingLeads = true**
   - Only contractors with `acceptingLeads = true` are considered

2. **maxPipelineValue Constraint**
   - If `lead.estimatedValue` is present:
     - Calculate contractor's current pipeline value (sum of distributed leads in INTAKE, QUALIFIED, SCOPED, QUOTED stages)
     - Check: `currentPipelineValue + lead.estimatedValue <= maxPipelineValue`
     - If constraint violated, contractor is rejected with reason

3. **Missing estimatedValue**
   - If `lead.estimatedValue` is null/missing:
     - Allow distribution (no capacity check)
     - Mark lead stage as `INTAKE` automatically

4. **Lead Value Threshold**
   - If `lead.estimatedValue > 500000`:
     - Block distribution immediately
     - Mark lead as `LOST` with reason: "Lead value exceeds maximum threshold"
     - Log audit and event

### Selection Algorithm

Contractors are sorted by (in order):
1. **verified** (desc) - Currently uses `user.status === 'ACTIVE'` as proxy
2. **performanceScore** (desc) - TODO: Calculate from project performance
3. **rating** (desc) - TODO: Calculate from satisfaction surveys
4. **projectsCompleted** (desc) - Count of awarded leads (stage = WON)

**Tiebreaker**: `subscriptionTier` priority (enterprise > premium > pro > basic > free)

**Top N Selection**: Default 5 contractors, configurable via `distributionCount` parameter

## API Endpoints

### POST /marketplace/leads/:leadId/distribute

**Request Body** (optional):
```json
{
  "distributionCount": 5  // Override default (1-20)
}
```

**Response** (Success):
```json
{
  "success": true,
  "lead": { ... },
  "distributedTo": [
    {
      "profileId": "uuid",
      "businessName": "Contractor Name",
      "subscriptionTier": "pro"
    }
  ],
  "distributionDetails": {
    "leadId": "uuid",
    "leadValue": "100000",
    "selectedCount": 5,
    "selectedContractors": [ ... ],
    "rejectedCount": 2,
    "rejectedContractors": [ ... ]
  }
}
```

**Response** (Failure - Value Exceeds Threshold):
```json
{
  "success": false,
  "reason": "LEAD_VALUE_EXCEEDS_THRESHOLD",
  "message": "Lead value exceeds maximum threshold of $500000",
  "lead": { ... }
}
```

**Response** (Failure - No Eligible Contractors):
```json
{
  "success": false,
  "reason": "NO_ELIGIBLE_CONTRACTORS",
  "message": "No eligible contractors found for this lead",
  "candidates": []
}
```

### GET /marketplace/leads/:leadId

Returns full lead details with:
- Distributed contractors
- Quotes
- Assigned sales rep
- Awarded profile (if won)

## Audit & Event Logging

### Audit Logs

- **LEAD_DISTRIBUTED**: Successful distribution
- **LEAD_DISQUALIFIED**: Lead value > $500k
- **LEAD_DISTRIBUTION_FAILED**: No eligible contractors or all exceeded capacity

### Events

- **LEAD_DISTRIBUTED**: Includes distribution payload with selected/rejected contractors
- **LEAD_DISQUALIFIED**: Includes value and threshold details
- **LEAD_DISTRIBUTION_FAILED**: Includes failure reason and candidate details

## Configuration

```typescript
const MAX_LEAD_VALUE = 500000 // $500k threshold
const DEFAULT_DISTRIBUTION_COUNT = 5 // Top N contractors
```

## Testing

Comprehensive test suite covers:
- ✅ Lead disqualification (>$500k)
- ✅ Missing estimatedValue handling (mark as INTAKE)
- ✅ Contractor filtering (acceptingLeads)
- ✅ Capacity constraint checking (maxPipelineValue)
- ✅ No eligible contractors scenario
- ✅ Top N selection (default and custom)
- ✅ Sorting algorithm

## Future Enhancements

1. **Performance Metrics**: Calculate `performanceScore` from project completion rates, on-time delivery, etc.
2. **Rating System**: Calculate `rating` from satisfaction surveys
3. **Verified Field**: Add explicit `verified` boolean to MarketplaceProfile
4. **Location-Based Matching**: Filter by city/state proximity
5. **Specialty Matching**: Match leads to contractors by project type/specialty

## Usage Example

```typescript
import { leadsService } from './modules/marketplace/leads.service'

// Distribute lead
const result = await leadsService.distributeLead({
  leadId: 'lead-123',
  userId: 'user-456',
  distributionCount: 5, // Optional
})

if (result.success) {
  console.log(`Distributed to ${result.distributedTo.length} contractors`)
} else {
  console.error(`Distribution failed: ${result.reason}`)
}
```

---

**Status**: ✅ Complete  
**Date**: January 2026

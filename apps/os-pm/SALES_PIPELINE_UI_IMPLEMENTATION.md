# Sales Pipeline UI Implementation

## Summary

Added Sales Pipeline UI in `apps/os-pm` with pipeline board view and lead detail pages.

## Files Created

1. **`apps/os-pm/app/(dashboard)/pipeline/page.tsx`** (New)
   - Pipeline board view grouped by Lead.stage
   - Filters UI (estimatedValue, location, projectType, assignedSalesRep)
   - Kanban-style column layout

2. **`apps/os-pm/app/(dashboard)/pipeline/[id]/page.tsx`** (New)
   - Lead detail page
   - Actions: advance stage, assign sales rep, award contractor, close lost
   - Timeline view
   - Quotes display

## Files Modified

1. **`services/api/src/modules/marketplace/leads.service.ts`**
   - Added `listLeads()` - List leads with filtering
   - Added `updateLeadStage()` - Update lead stage with audit/event logging
   - Added `assignSalesRep()` - Assign sales rep to lead
   - Added `awardContractor()` - Award contractor (sets stage to WON)
   - Added `closeLost()` - Close lead as lost

2. **`services/api/src/modules/marketplace/leads.routes.ts`**
   - Added `GET /marketplace/leads` - List leads with query filters
   - Added `PATCH /marketplace/leads/:leadId/stage` - Update lead stage
   - Added `POST /marketplace/leads/:leadId/assign-sales-rep` - Assign sales rep
   - Added `POST /marketplace/leads/:leadId/award-contractor` - Award contractor
   - Added `POST /marketplace/leads/:leadId/close-lost` - Close as lost

3. **`apps/os-pm/lib/api-client.ts`**
   - Added `listLeads()` - API client method
   - Added `getLead()` - API client method
   - Added `updateLeadStage()` - API client method
   - Added `assignSalesRep()` - API client method
   - Added `awardContractor()` - API client method
   - Added `closeLost()` - API client method

4. **`apps/os-pm/lib/types.ts`**
   - Added `LeadStage` type
   - Added `Lead` interface with all fields

5. **`apps/os-pm/components/layout/nav.ts`**
   - Added "Sales Pipeline" navigation link with TrendingUp icon

## UI Features

### Pipeline Board Page (`/pipeline`)

**Layout**:
- Kanban-style board with 6 columns (one per stage)
- Each column shows leads grouped by stage
- Responsive grid (1 col mobile, 3 cols tablet, 6 cols desktop)

**Lead Cards**:
- Lead name
- Estimated value (formatted currency)
- Location (city, state)
- Assigned sales rep
- Project type
- Clickable to navigate to detail page

**Filters**:
- Estimated value range (min/max)
- City
- State
- Project type
- Assigned sales rep ID
- Collapsible filter panel
- Active filter count indicator

**Stage Colors**:
- INTAKE: Blue
- QUALIFIED: Purple
- SCOPED: Indigo
- QUOTED: Yellow
- WON: Emerald
- LOST: Red

### Lead Detail Page (`/pipeline/[id]`)

**Information Display**:
- Lead name and stage badge
- Estimated value
- Contact info (email, phone)
- Location (city, state)
- Project type
- Description
- Assigned sales rep (if assigned)
- Awarded contractor (if awarded)
- Quotes list (if any)
- Timeline (stage transition dates)

**Actions** (Sidebar):
1. **Advance Stage**
   - Dropdown to select new stage
   - Updates lead stage with audit logging
   - Only shown if not WON/LOST

2. **Assign Sales Rep**
   - Input for sales rep user ID
   - Only shown if no rep assigned

3. **Award Contractor**
   - Input for contractor profile ID
   - Only shown if stage is QUOTED and no contractor awarded
   - Automatically sets stage to WON

4. **Close as Lost**
   - Input for loss reason
   - Only shown if not WON/LOST
   - Sets stage to LOST

5. **Create Project**
   - Button to create project from WON lead
   - Only shown if WON, has awarded contractor, and no project exists

**Error Handling**:
- All validation errors come from API
- Error messages displayed in red alert card
- No business logic in UI - all validation server-side

## API Endpoints

### GET /marketplace/leads

**Query Parameters**:
- `stage` - Filter by stage
- `estimatedValueMin` - Minimum estimated value
- `estimatedValueMax` - Maximum estimated value
- `city` - Filter by city
- `state` - Filter by state
- `projectType` - Filter by project type
- `assignedSalesRepId` - Filter by assigned sales rep
- `limit` - Pagination limit
- `offset` - Pagination offset

**Response**:
```json
{
  "leads": [...],
  "total": 100,
  "limit": 100,
  "offset": 0
}
```

### GET /marketplace/leads/:leadId

**Response**:
```json
{
  "lead": {
    "id": "...",
    "stage": "QUALIFIED",
    "name": "...",
    "estimatedValue": "150000",
    "assignedSalesRep": {...},
    "awardedProfile": {...},
    "quotes": [...],
    ...
  }
}
```

### PATCH /marketplace/leads/:leadId/stage

**Body**:
```json
{
  "stage": "SCOPED"
}
```

### POST /marketplace/leads/:leadId/assign-sales-rep

**Body**:
```json
{
  "salesRepId": "user-uuid"
}
```

### POST /marketplace/leads/:leadId/award-contractor

**Body**:
```json
{
  "profileId": "profile-uuid"
}
```

### POST /marketplace/leads/:leadId/close-lost

**Body**:
```json
{
  "reason": "Customer chose different contractor"
}
```

## Navigation

Added to sidebar navigation:
- **Sales Pipeline** (`/pipeline`)
- Icon: TrendingUp
- Match: "startsWith" (includes detail pages)

## Data Flow

1. **Pipeline Board**:
   - Fetches leads via `api.listLeads(filters)`
   - Groups by stage client-side
   - Updates on filter change

2. **Lead Detail**:
   - Fetches lead via `api.getLead(leadId)`
   - Actions trigger mutations
   - Mutations invalidate queries to refresh data
   - Error messages from API displayed to user

## Validation

- **No business logic in UI**: All validation comes from API error messages
- **Error display**: API errors shown in red alert card
- **Optimistic updates**: None - always wait for API response
- **Query invalidation**: After mutations, invalidate queries to refresh data

## Styling

- Uses existing UI components (`@kealee/ui/button`, `@kealee/ui/card`, `@kealee/ui/input`)
- Consistent with existing os-pm pages
- Responsive design (mobile-first)
- Stage-based color coding

## Future Enhancements

1. **Drag-and-drop**: Move leads between stages via drag
2. **Bulk actions**: Select multiple leads for bulk operations
3. **Sales rep selector**: Dropdown instead of UUID input
4. **Contractor selector**: Search/select from marketplace
5. **Activity feed**: Show recent actions on lead
6. **Notes/Comments**: Add notes to leads
7. **Email integration**: Send emails directly from lead detail

---

**Status**: ✅ Complete  
**Date**: January 2026

# @kealee/api-client

Type-safe API client for the Kealee Platform.

## Installation

```bash
pnpm add @kealee/api-client
```

## Usage

```typescript
import { createApiClient } from '@kealee/api-client'

const apiClient = createApiClient({
  baseUrl: 'http://localhost:3001',
  getAuthToken: async () => {
    // Return auth token or null
    return session?.access_token || null
  },
})

// List leads
const { leads, total } = await apiClient.listLeads({
  stage: 'QUALIFIED',
  estimatedValueMin: 100000,
})

// Get lead
const { lead } = await apiClient.getLead(leadId)

// Update lead stage
const { lead: updatedLead } = await apiClient.updateLeadStage(leadId, 'SCOPED')

// Assign sales rep
await apiClient.assignSalesRep(leadId, salesRepId)

// Award contractor
await apiClient.awardContractor(leadId, profileId)

// Close as lost
await apiClient.closeLost(leadId, 'Customer chose different contractor')

// Distribute lead
await apiClient.distributeLead(leadId, 5)
```

## Methods

### Lead Operations

- `listLeads(query?)` - List leads with optional filters
- `getLead(leadId)` - Get lead by ID
- `updateLeadStage(leadId, stage)` - Update lead stage
- `assignSalesRep(leadId, salesRepId)` - Assign sales rep to lead
- `awardContractor(leadId, profileId)` - Award contractor to lead
- `closeLost(leadId, reason)` - Close lead as lost
- `distributeLead(leadId, distributionCount?)` - Distribute lead to contractors

All methods are fully typed using `@kealee/types`.

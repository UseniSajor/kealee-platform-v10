# @kealee/types

Shared TypeScript types for the Kealee Platform.

## Installation

```bash
pnpm add @kealee/types
```

## Exports

### Lead Pipeline Types

- `LeadStage` - Enum type for lead stages: `"INTAKE" | "QUALIFIED" | "SCOPED" | "QUOTED" | "WON" | "LOST"`
- `Lead` - Interface for lead data

### Sales Task Types

- `SalesTaskType` - Enum type for sales task types
- `SalesTaskStatus` - Enum type for sales task statuses
- `SalesOutcome` - Enum type for sales outcomes
- `SalesTask` - Interface for sales task data

### Execution Tier Types

- `ExecutionTier` - Enum type for project execution tiers: `"LOW" | "STANDARD" | "HIGH"`

### API Request/Response Types

- `ListLeadsQuery` - Query parameters for listing leads
- `ListLeadsResponse` - Response from listing leads
- `GetLeadResponse` - Response from getting a lead
- `UpdateLeadStageRequest` - Request body for updating lead stage
- `UpdateLeadStageResponse` - Response from updating lead stage
- `AssignSalesRepRequest` - Request body for assigning sales rep
- `AssignSalesRepResponse` - Response from assigning sales rep
- `AwardContractorRequest` - Request body for awarding contractor
- `AwardContractorResponse` - Response from awarding contractor
- `CloseLostRequest` - Request body for closing lead as lost
- `CloseLostResponse` - Response from closing lead as lost
- `DistributeLeadRequest` - Request body for distributing lead
- `DistributeLeadResponse` - Response from distributing lead

## Usage

```typescript
import type { Lead, LeadStage, ExecutionTier, SalesTask } from '@kealee/types'

const lead: Lead = {
  id: '...',
  stage: 'QUALIFIED',
  name: 'John Doe',
  // ...
}
```

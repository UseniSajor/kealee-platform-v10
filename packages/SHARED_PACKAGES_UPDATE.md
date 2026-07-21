# Shared Types and API Client Packages Update

## Summary

Created shared `@kealee/types` and `@kealee/api-client` packages and updated `os-pm` and `os-admin` to use them for type-safe lead pipeline operations.

## Packages Created

### 1. `packages/types` (@kealee/types)

**Purpose**: Shared TypeScript types for the Kealee Platform.

**Exports**:
- `LeadStage` - Enum: `"INTAKE" | "QUALIFIED" | "SCOPED" | "QUOTED" | "WON" | "LOST"`
- `Lead` - Complete lead interface with all fields
- `SalesTaskType` - Enum for sales task types
- `SalesTaskStatus` - Enum for sales task statuses
- `SalesOutcome` - Enum for sales outcomes
- `SalesTask` - Complete sales task interface
- `ExecutionTier` - Enum: `"LOW" | "STANDARD" | "HIGH"`
- API request/response types for all lead operations

**Files**:
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - All type exports
- `README.md` - Documentation

### 2. `packages/api-client` (@kealee/api-client)

**Purpose**: Type-safe API client for lead pipeline operations.

**Exports**:
- `ApiClient` class - Main API client
- `createApiClient()` - Factory function
- `ApiClientConfig` - Configuration interface

**Methods**:
- `listLeads(query?)` - List leads with filters
- `getLead(leadId)` - Get lead by ID
- `updateLeadStage(leadId, stage)` - Update lead stage
- `assignSalesRep(leadId, salesRepId)` - Assign sales rep
- `awardContractor(leadId, profileId)` - Award contractor
- `closeLost(leadId, reason)` - Close as lost
- `distributeLead(leadId, distributionCount?)` - Distribute lead

**Files**:
- `package.json` - Package configuration (depends on `@kealee/types`)
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - API client implementation
- `README.md` - Documentation

## Apps Updated

### 1. `apps/os-pm`

**Changes**:
- Added `@kealee/types` and `@kealee/api-client` dependencies
- Updated `lib/api-client.ts` to use shared API client for lead operations
- Updated `lib/types.ts` to re-export shared types instead of defining locally
- All lead API calls now use type-safe shared client

**Before**:
```typescript
// Local types defined in lib/types.ts
export type LeadStage = "INTAKE" | ...
export interface Lead { ... }

// Local API methods in lib/api-client.ts
listLeads: (query?: { stage?: string, ... }) => { ... }
```

**After**:
```typescript
// Re-export shared types
export type { LeadStage, Lead, ... } from "@kealee/types"

// Use shared API client
import { createApiClient } from "@kealee/api-client"
const leadApiClient = createApiClient({ baseUrl, getAuthToken })
listLeads: (query?) => leadApiClient.listLeads(query)
```

### 2. `apps/os-admin`

**Changes**:
- Added `@kealee/types` and `@kealee/api-client` dependencies
- Updated `lib/api.ts` to use shared API client for lead operations
- All lead API calls now use type-safe shared client

**Before**:
```typescript
// No lead API methods
```

**After**:
```typescript
// Use shared API client
import { createApiClient } from '@kealee/api-client'
const leadApiClient = createApiClient({ baseUrl, getAuthToken })

// Expose lead methods
listLeads: (query?) => leadApiClient.listLeads(query)
getLead: (id) => leadApiClient.getLead(id)
// ... etc
```

## Type Safety Benefits

1. **Consistent Types**: All apps use the same type definitions
2. **Compile-time Safety**: TypeScript catches type errors at build time
3. **IntelliSense**: Better autocomplete and documentation in IDEs
4. **Refactoring**: Changes to types propagate automatically
5. **API Contract**: Types serve as documentation for API contracts

## Usage Example

```typescript
// In any app (os-pm, os-admin, etc.)
import { createApiClient } from '@kealee/api-client'
import type { LeadStage } from '@kealee/types'

const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  getAuthToken: async () => {
    // Return auth token
    return token
  },
})

// Type-safe API calls
const { leads } = await apiClient.listLeads({
  stage: 'QUALIFIED' as LeadStage, // Type-checked
  estimatedValueMin: 100000,
})

const { lead } = await apiClient.getLead(leadId)
await apiClient.updateLeadStage(leadId, 'SCOPED') // Type-checked stage
```

## Next Steps

1. **Install Dependencies**: Run `pnpm install` to install new packages
2. **Build Packages**: Run `pnpm build` in `packages/types` and `packages/api-client`
3. **Update Other Apps**: Consider updating other apps (m-project-owner, etc.) to use shared packages
4. **Extend Types**: Add more shared types as needed (Project, User, etc.)

## Files Modified

### New Files
- `packages/types/package.json`
- `packages/types/tsconfig.json`
- `packages/types/src/index.ts`
- `packages/types/README.md`
- `packages/api-client/package.json`
- `packages/api-client/tsconfig.json`
- `packages/api-client/src/index.ts`
- `packages/api-client/README.md`

### Modified Files
- `apps/os-pm/package.json` - Added dependencies
- `apps/os-pm/lib/api-client.ts` - Use shared client
- `apps/os-pm/lib/types.ts` - Re-export shared types
- `apps/os-admin/package.json` - Added dependencies
- `apps/os-admin/lib/api.ts` - Use shared client

---

**Status**: ✅ Complete  
**Date**: January 2026

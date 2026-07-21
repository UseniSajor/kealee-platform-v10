# Project Creation from WON Leads - Implementation

## Summary

Enforced that Projects are created **ONLY** from WON leads, with admin override support for OS-PM flow.

## Implementation Details

### Files Modified

1. **`services/api/src/modules/projects/project.service.ts`**
   - Added `createProjectFromLead()` method
   - Modified `createProject()` to reject direct creation (unless admin override)
   - Added validation, audit, and event logging

2. **`services/api/src/modules/projects/project.routes.ts`**
   - Added `POST /projects/from-lead/:leadId` route
   - Updated `POST /projects` to handle admin override

3. **`services/api/src/schemas/project.schemas.ts`**
   - Added `adminOverride` and `adminReason` fields to `createProjectSchema`

## Validation Rules

### `createProjectFromLead()` Requirements

1. **Lead.stage must be WON**
   - Rejects if lead is not in WON stage
   - Error: "Lead must be in WON stage to create project. Current stage: {stage}"

2. **Lead.estimatedValue must be <= 500000**
   - Rejects if lead value exceeds $500k threshold
   - Error: "Lead estimatedValue ({value}) exceeds maximum threshold (500000)"

3. **Lead.awardedProfileId must exist**
   - Rejects if no winning contractor assigned
   - Error: "Lead must have an awarded contractor (awardedProfileId) to create project"

4. **Lead.projectId must be null**
   - Prevents duplicate project creation
   - Error: "Lead already has an associated project: {projectId}"

## Project Creation Process

### From Lead (Primary Method)

```typescript
POST /projects/from-lead/:leadId
Body: { orgId?: string }
```

**Steps:**
1. Validate lead (WON stage, value <= $500k, awardedProfileId exists)
2. Verify ownerId (user exists)
3. Create project in transaction:
   - Create Project with ownerId
   - Set budgetTotal from lead.estimatedValue
   - Set category from lead.projectType (or default to OTHER)
   - Add owner as OWNER member
   - Add awarded contractor as CONTRACTOR member
4. Link Project to Lead.projectId
5. Create default readiness checklist (optional, non-blocking)
6. Log audit: `PROJECT_CREATED_FROM_LEAD`
7. Log event: `PROJECT_CREATED_FROM_LEAD`

### Direct Creation (Admin Override Only)

```typescript
POST /projects
Body: {
  ...projectFields,
  adminOverride: true,
  adminReason: "Reason for bypassing lead workflow"
}
```

**Steps:**
1. Validate adminOverride flag
2. Require adminReason if adminOverride is true
3. Create project normally
4. Log audit: `PROJECT_CREATED_ADMIN_OVERRIDE`

**Rejection (No Override):**
- Error: "Projects must be created from WON leads. Use POST /projects/from-lead/:leadId instead. For OS-PM flow, set adminOverride=true and provide adminReason."

## Audit & Event Logging

### Audit Logs

**PROJECT_CREATED_FROM_LEAD**
```json
{
  "action": "PROJECT_CREATED_FROM_LEAD",
  "entityType": "Project",
  "entityId": "project-uuid",
  "userId": "user-uuid",
  "reason": "Project created from WON lead {leadId}",
  "before": {
    "leadId": "lead-uuid",
    "leadStage": "WON",
    "leadEstimatedValue": "150000",
    "leadAwardedProfileId": "profile-uuid"
  },
  "after": {
    "projectId": "project-uuid",
    "projectName": "Kitchen Renovation",
    "projectCategory": "KITCHEN",
    "projectStatus": "DRAFT",
    "ownerId": "user-uuid"
  }
}
```

**PROJECT_CREATED_ADMIN_OVERRIDE**
```json
{
  "action": "PROJECT_CREATED_ADMIN_OVERRIDE",
  "entityType": "Project",
  "entityId": "project-uuid",
  "userId": "admin-uuid",
  "reason": "Admin override for direct project creation",
  "before": null,
  "after": {
    "id": "project-uuid",
    "name": "Project Name",
    "category": "KITCHEN",
    "ownerId": "user-uuid"
  }
}
```

### Events

**PROJECT_CREATED_FROM_LEAD**
```json
{
  "type": "PROJECT_CREATED_FROM_LEAD",
  "entityType": "Project",
  "entityId": "project-uuid",
  "userId": "user-uuid",
  "orgId": "org-uuid",
  "payload": {
    "leadId": "lead-uuid",
    "leadName": "Kitchen Renovation",
    "leadStage": "WON",
    "leadEstimatedValue": "150000",
    "awardedProfileId": "profile-uuid",
    "awardedContractor": "ABC Construction",
    "projectId": "project-uuid",
    "projectName": "Kitchen Renovation",
    "projectCategory": "KITCHEN",
    "ownerId": "user-uuid"
  }
}
```

## API Endpoints

### POST /projects/from-lead/:leadId

**Request:**
```json
{
  "orgId": "optional-org-uuid"
}
```

**Response (Success - 201):**
```json
{
  "project": {
    "id": "project-uuid",
    "name": "Kitchen Renovation",
    "category": "KITCHEN",
    "status": "DRAFT",
    "ownerId": "user-uuid",
    "budgetTotal": 150000,
    ...
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Lead must be in WON stage to create project. Current stage: QUOTED"
}
```

### POST /projects (Admin Override)

**Request:**
```json
{
  "name": "Project Name",
  "category": "KITCHEN",
  "adminOverride": true,
  "adminReason": "OS-PM flow: Direct project creation for existing client"
}
```

**Response (Success - 201):**
```json
{
  "project": { ... }
}
```

**Response (Error - 400):**
```json
{
  "error": "Projects must be created from WON leads. Use POST /projects/from-lead/:leadId instead."
}
```

## Project Members

When creating from lead, the following members are automatically added:

1. **Owner** (ProjectMemberRole.OWNER)
   - Set to the `ownerId` parameter

2. **Contractor** (ProjectMemberRole.CONTRACTOR)
   - Set to `lead.awardedProfile.userId`
   - Only added if `awardedProfileId` exists

## Readiness Checklist

After project creation, a default readiness checklist is automatically generated:

- Uses `readinessService.generateProjectReadiness()`
- Non-blocking: If generation fails, project creation still succeeds
- Logs warning if checklist generation fails

## Usage Examples

### Create Project from WON Lead

```typescript
// Lead must be in WON stage
const project = await projectService.createProjectFromLead(
  'lead-123',
  'owner-user-id',
  'org-id', // optional
  'current-user-id' // for audit
)
```

### Direct Creation (Admin Override)

```typescript
const project = await projectService.createProject(
  {
    ownerId: 'user-id',
    name: 'Project Name',
    category: 'KITCHEN',
    adminOverride: true,
    adminReason: 'OS-PM flow: Direct creation for existing client',
  },
  'admin-user-id' // for audit
)
```

## Error Handling

All validation errors return **400 Bad Request** with descriptive messages:

- `NotFoundError`: Lead or User not found
- `ValidationError`: Lead validation failed (stage, value, awardedProfileId, etc.)

## Security & Compliance

- **Audit Trail**: All project creations are logged (both from-lead and admin override)
- **Admin Override**: Requires explicit flag and reason
- **Transaction Safety**: Project and Lead linking happens in a single transaction
- **Validation**: Multiple validation layers prevent invalid project creation

---

**Status**: ✅ Complete  
**Date**: January 2026

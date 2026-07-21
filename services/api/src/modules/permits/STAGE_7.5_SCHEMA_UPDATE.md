# Stage 7.5 Permits & Inspections Hub - Schema Update

## Summary

Added comprehensive permit application models to support dual-platform architecture (client-side and jurisdiction-side) with API integration, AI review capabilities, remote inspections, and analytics.

## Models Added

### Core Permit Application Models

1. **PermitApplication** - Client-side application before submission
   - Kealee tracking (AI review, status)
   - Jurisdiction tracking (ref number, status)
   - Document management (plans, calculations, reports)
   - Relations to AI reviews, corrections, inspections, submissions, assignments

2. **AIReviewResult** - AI-powered review results
   - Review source (CLIENT_SIDE, JURISDICTION_SIDE)
   - Overall score and readiness
   - Plan issues, code violations, missing documents
   - Suggested fixes

3. **PermitSubmission** - Submission tracking
   - Submission type (INITIAL, RESUBMITTAL)
   - Submission method (API, PORTAL, EMAIL, MANUAL)
   - Documents and form data
   - Confirmation number and jurisdiction response

4. **PermitCorrection** (Updated) - Correction tracking
   - Source tracking (EMAIL, PORTAL, PHONE, API, REVIEWER)
   - Parsed issues and affected sheets
   - Assignment and resolution tracking
   - Supports both PermitApplication and Permit

5. **InspectionRequest** - Inspection request management
   - Client-side preparation (checklist, photos, pre-inspection)
   - Jurisdiction-side scheduling
   - Remote inspection support
   - Results and deficiencies tracking

### Jurisdiction-Side Models

6. **JurisdictionReviewer** - Reviewer management
   - Role and discipline specialties
   - Workload management
   - Performance metrics

7. **ReviewAssignment** - Review assignment tracking
   - Discipline-specific assignments
   - Priority levels
   - AI pre-review assistance
   - Review time tracking

8. **JurisdictionInspector** - Inspector management
   - Inspection type specialties
   - Service area (GIS polygon)
   - Working hours and availability
   - Mobile device tracking
   - Performance metrics

9. **InspectionAssignment** - Inspection assignment
   - Scheduled date and time slot
   - Route optimization (route order, travel time)
   - Status tracking

10. **RemoteInspection** - Remote inspection support
    - Video session management
    - Recording and live streaming
    - AI video analysis
    - Quality tracking

### API Integration Models

11. **APIIntegration** - API integration configuration
    - Provider (ACCELA, TYLER, GOVOS, KEALEE_PERMITAI)
    - Integration type (REST_API, GRAPHQL, WEBHOOK)
    - Encrypted credentials
    - Endpoint and field mappings
    - Performance stats

12. **APICall** - API call tracking
    - Request/response logging
    - Performance metrics
    - Error tracking

13. **WebhookEvent** - Webhook event processing
    - Event type and source
    - Payload and signature
    - Processing status

### Analytics Model

14. **PermitAnalytics** - Analytics and reporting
    - Volume metrics (submitted, approved, rejected)
    - Performance metrics (review time, approval time, first-time approval rate)
    - AI impact metrics
    - Revenue tracking

## Jurisdiction Model Updates

Added fields to existing Jurisdiction model:
- `integrationType` - API, PORTAL, MANUAL
- `apiUrl`, `apiKey`, `portalUrl` - Integration configuration
- `requiredDocuments` - Required documents configuration
- `formTemplates` - Form templates configuration
- `subscribedAt` - Subscription start date
- `avgReviewDays` - Average review time
- `firstTimeApprovalRate` - First-time approval rate

Added relations:
- `apiIntegrations` - APIIntegration[]
- `reviewers` - JurisdictionReviewer[]
- `inspectors` - JurisdictionInspector[]
- `permitAnalytics` - PermitAnalytics[]

## PermitType Enum Updates

Added new permit types:
- `FIRE`
- `ROOFING`

## Relations

### PermitApplication Relations
- `jurisdiction` → Jurisdiction
- `project` → Project (commented out - Project model needs to be defined)
- `aiReviews` → AIReviewResult[]
- `corrections` → PermitCorrection[]
- `inspections` → InspectionRequest[]
- `submissions` → PermitSubmission[]
- `reviewAssignments` → ReviewAssignment[]
- `inspectionAssignments` → InspectionAssignment[]
- `expeditedServices` → ExpeditedPermitService[]
- `integrationLogs` → JurisdictionIntegrationLog[]
- `notifications` → PermitNotification[]

### InspectionRequest Relations
- `permitApplication` → PermitApplication
- `project` → Project (commented out - Project model needs to be defined)
- `inspector` → JurisdictionInspector
- `inspectionAssignments` → InspectionAssignment[]
- `remoteInspection` → RemoteInspection?

### APIIntegration Relations
- `jurisdiction` → Jurisdiction
- `apiCalls` → APICall[]
- `webhookEvents` → WebhookEvent[]

## Notes

1. **Project Model**: The `PermitApplication` and `InspectionRequest` models reference a `Project` model that doesn't currently exist in the schema. These relations are commented out and should be added when the Project model is defined.

2. **PermitCorrection Model**: Updated to support both `PermitApplication` and `Permit` models, allowing corrections to be tracked for both submitted applications and issued permits.

3. **Duplicate PermitType Enum**: Removed duplicate `PermitType` enum definition. The enum is now defined once in the permit models section.

4. **Encrypted Fields**: API credentials (`apiKey`, `clientId`, `clientSecret`) are marked with `@encrypted` for security.

5. **JSON Fields**: Extensive use of JSON fields for flexible data storage:
   - `planIssues`, `codeViolations`, `missingDocuments`, `suggestedFixes` in AIReviewResult
   - `documents`, `formData`, `jurisdictionResponse` in PermitSubmission
   - `parsedIssues`, `affectedSheets` in PermitCorrection
   - `sitePhotos`, `deficiencies`, `aiVideoAnalysis` in InspectionRequest
   - `serviceArea`, `workingHours`, `lastLocation` in JurisdictionInspector
   - `endpoints`, `fieldMappings` in APIIntegration
   - `payload` in WebhookEvent
   - `videoFrames`, `aiAnalysis` in RemoteInspection

## Next Steps

1. Define `Project` model or update relations to use existing project model (e.g., `DesignProject`)
2. Implement services for new models
3. Create API routes for new functionality
4. Add frontend components for dual-platform interface
5. Implement API integration layer
6. Build analytics dashboard

---

**Status**: ✅ Schema Complete  
**Date**: January 2026

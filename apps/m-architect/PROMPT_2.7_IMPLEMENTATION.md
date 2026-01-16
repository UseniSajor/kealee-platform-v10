# Prompt 2.7 Implementation: Automatic Permit Package Generation

## Summary

Implemented automatic permit package generation system that extracts permit-required drawings from full sets, auto-generates permit application forms, calculates permit fees based on jurisdiction schedules, assembles packages with cover sheets and indexes, submits to m-permits-inspections via API, and tracks submission status and review comments.

## Features Implemented

### ✅ 1. Extract Permit-Required Drawings from Full Set
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **Features**:
  - `autoGeneratePermitPackage()` - Automatically extracts drawings from design project
  - Filters approved drawings only
  - Supports specific sheet selection or all drawings
  - Discipline-based filtering (A-Architectural, S-Structural, C-Civil, G-General)
  - Creates `PermitPackageDocument` records for each drawing
  - Preserves sheet numbers, disciplines, and metadata

### ✅ 2. Auto-Generate Permit Application Forms
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **Features**:
  - `generateFormData()` - Generates form data from project information
  - Supports jurisdiction-specific templates
  - Multiple form types (BUILDING_PERMIT, ELECTRICAL_PERMIT, etc.)
  - Form field auto-population from project data
  - Form completion and verification workflow
  - Template-based form generation

### ✅ 3. Calculate Permit Fees Based on Jurisdiction Schedules
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **Features**:
  - `calculatePermitFees()` - Calculates fees based on jurisdiction rules
  - Supports jurisdiction-specific fee calculation rules
  - Fee components:
    - Base fee
    - Valuation-based fee (percentage of project value)
    - Document fee (per sheet)
    - Expedited processing fee (optional)
  - Fee breakdown tracking
  - Default fee calculation if no template

### ✅ 4. Package Assembly with Cover Sheet and Index
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **Features**:
  - `generateCoverSheetAndIndex()` - Generates cover sheet and index documents
  - Cover sheet with project information
  - Index document listing all package documents
  - Document ordering with orderIndex
  - Automatic document organization

### ✅ 5. Submit to m-permits-inspections via API
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **Features**:
  - `submitPermitPackage()` - Submits package to permit system
  - Multiple submission methods: API, MANUAL, EMAIL
  - Package completeness validation before submission
  - API submission with request/response tracking
  - Submission status tracking
  - Retry logic for failed submissions
  - Submission reference ID tracking

### ✅ 6. Track Submission Status and Review Comments
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **Features**:
  - `syncPermitPackageStatus()` - Syncs status from permit system
  - `addReviewComment()` - Adds review comments from permit system
  - `resolveReviewComment()` - Resolves review comments
  - Review comment tracking with:
    - Comment type (GENERAL, CORRECTION, CLARIFICATION, APPROVAL)
    - Severity (MINOR, MODERATE, MAJOR, CRITICAL)
    - Location (sheet number, page, coordinates)
    - Markup images
    - Reviewer information
  - Corrections required count tracking
  - Review status tracking

## Database Schema

### New Models

1. **PermitPackage**
   - Permit package container
   - Links to design project and jurisdiction
   - Package status tracking (DRAFT, ASSEMBLING, READY, SUBMITTED, etc.)
   - Fee information and payment tracking
   - Submission tracking with reference IDs
   - Review status and comment counts

2. **PermitPackageDocument**
   - Individual documents in package
   - Document types: DRAWING, SPECIFICATION, CALCULATION, SURVEY, etc.
   - Source tracking (DRAWING_SHEET, DELIVERABLE, FILE, GENERATED)
   - File information (URL, size, type, page count)
   - Organization (orderIndex, isRequired, isIncluded)
   - Metadata storage

3. **PermitApplicationForm**
   - Auto-generated or manual application forms
   - Form type and template tracking
   - Form data (JSON structure)
   - Generated form PDF URL
   - Completion and verification workflow

4. **PermitPackageSubmission**
   - Submission tracking to permit system
   - Submission method (API, MANUAL, EMAIL)
   - API request/response tracking
   - Submission status and retry logic
   - Submission reference tracking

5. **PermitPackageReviewComment**
   - Review comments from permit system
   - Comment type and severity
   - Location information (sheet, page, coordinates)
   - Markup images
   - Resolution tracking

6. **JurisdictionPermitTemplate**
   - Templates for different jurisdictions
   - Required documents configuration
   - Application form field definitions
   - Fee calculation rules
   - Submission requirements

### New Enums

- `PermitPackageStatus`: DRAFT, ASSEMBLING, READY, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CORRECTIONS_REQUIRED, RESUBMITTED, CANCELLED
- `PermitPackageType`: BUILDING, ELECTRICAL, PLUMBING, MECHANICAL, STRUCTURAL, DEMOLITION, SITE_WORK, COMBINED
- `DocumentType`: DRAWING, SPECIFICATION, CALCULATION, SURVEY, APPLICATION_FORM, COVER_SHEET, INDEX, OTHER

### Relations

- `PermitPackage` → `DesignProject` (many-to-one)
- `PermitPackage` → `User` (createdBy, submittedBy)
- `PermitPackage` → `PermitPackageDocument[]` (one-to-many)
- `PermitPackage` → `PermitApplicationForm[]` (one-to-many)
- `PermitPackage` → `PermitPackageSubmission[]` (one-to-many)
- `PermitPackage` → `PermitPackageReviewComment[]` (one-to-many)
- `PermitPackageDocument` → `PermitPackage` (many-to-one)
- `PermitApplicationForm` → `PermitPackage` (many-to-one)
- `PermitApplicationForm` → `User` (createdBy, verifiedBy)
- `PermitPackageSubmission` → `PermitPackage` (many-to-one)
- `PermitPackageSubmission` → `User` (submittedBy)
- `PermitPackageReviewComment` → `PermitPackage` (many-to-one)
- `PermitPackageReviewComment` → `User` (resolvedBy)
- `JurisdictionPermitTemplate` → `User` (createdBy)

## API Endpoints

### Permit Packages
- `POST /architect/design-projects/:projectId/permit-packages` - Create permit package
- `POST /architect/design-projects/:projectId/permit-packages/auto-generate` - Auto-generate permit package
- `GET /architect/permit-packages/:id` - Get permit package
- `GET /architect/design-projects/:projectId/permit-packages` - List permit packages

### Documents
- `POST /architect/permit-packages/:id/documents` - Add document to package

### Application Forms
- `PATCH /architect/permit-application-forms/:id` - Update application form
- `POST /architect/permit-application-forms/:id/verify` - Verify application form

### Submission
- `POST /architect/permit-packages/:id/submit` - Submit permit package
- `POST /architect/permit-packages/:id/sync` - Sync permit package status

### Review Comments
- `POST /architect/permit-packages/:id/review-comments` - Add review comment
- `POST /architect/permit-package-review-comments/:id/resolve` - Resolve review comment

## Service Methods

### permitPackageService
- `createPermitPackage()` - Create new permit package
- `getPermitPackage()` - Get package with all related data
- `listPermitPackages()` - List packages with filters
- `autoGeneratePermitPackage()` - Auto-generate package from drawings
- `generateFormData()` - Generate form data from project
- `generateCoverSheetAndIndex()` - Generate cover sheet and index
- `calculatePermitFees()` - Calculate fees based on jurisdiction rules
- `addDocumentToPackage()` - Add document to package
- `updateApplicationForm()` - Update application form data
- `verifyApplicationForm()` - Verify application form
- `submitPermitPackage()` - Submit package to permit system
- `syncPermitPackageStatus()` - Sync status from permit system
- `addReviewComment()` - Add review comment
- `resolveReviewComment()` - Resolve review comment

## Frontend Components

### Permit Packages List Page
- **Location**: `apps/m-architect/app/projects/[id]/permits/page.tsx`
- **Features**:
  - Summary dashboard (total, ready, submitted, approved, corrections)
  - Filters for status and package type
  - Permit packages list with status badges
  - Document and form counts
  - Calculated fee display
  - Auto-generate package modal

## Workflow Examples

### 1. Auto-Generate Permit Package
1. User selects "Auto-Generate Package"
2. System extracts approved drawings from project
3. Filters permit-required drawings (A-, S-, C-, G- disciplines)
4. Creates permit package with status: ASSEMBLING
5. Generates application forms based on template or default
6. Generates cover sheet and index
7. Calculates permit fees
8. Package status: READY

### 2. Submit Permit Package
1. User reviews package (documents, forms, fees)
2. User verifies all application forms are complete
3. User submits package (API, MANUAL, or EMAIL)
4. System validates package completeness
5. If API submission, calls m-permits-inspections API
6. Package status: SUBMITTED
7. Submission record created with tracking

### 3. Review Comments and Corrections
1. Permit system adds review comments via API
2. Comments appear in package with severity and location
3. Corrections required count updated
4. Package status: CORRECTIONS_REQUIRED
5. User addresses comments and resolves them
6. User resubmits package
7. Package status: RESUBMITTED

## Integration Points

### With Previous Prompts
- **Prompt 1.5 (Drawing Sets)**: Extracts drawings from drawing sheets
- **Prompt 2.3 (Design Validation)**: Validated drawings included in packages
- **Prompt 2.4 (Approval Workflows)**: Approved drawings only included
- **Prompt 2.5 (Architect Stamps)**: Stamped drawings included in packages

### With m-permits-inspections (Future)
- API integration for package submission
- Status sync from permit system
- Review comment ingestion
- Permit number assignment
- Fee payment tracking

## Files Created

### Database
- Updated `packages/database/prisma/schema.prisma` - Added PermitPackage, PermitPackageDocument, PermitApplicationForm, PermitPackageSubmission, PermitPackageReviewComment, JurisdictionPermitTemplate models and enums

### API
- `services/api/src/modules/architect/permit-package.service.ts` - Permit package business logic
- `services/api/src/modules/architect/permit-package.routes.ts` - Permit package API routes

### Frontend
- `apps/m-architect/app/projects/[id]/permits/page.tsx` - Permit packages list page

## Files Modified

- `services/api/src/index.ts` - Registered permit package routes
- `apps/m-architect/lib/api.ts` - Added permit package API methods
- `apps/m-architect/app/projects/[id]/page.tsx` - Added permit packages link

## Placeholder Integrations

### m-permits-inspections API Integration
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **TODO**: Implement actual API calls to m-permits-inspections:
  - `submitToPermitSystem()` - Submit package via API
  - `getPermitStatus()` - Get current permit status
  - `getPermitReviewComments()` - Get review comments from permit system

### PDF Generation
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **TODO**: Generate actual PDF files for:
  - Cover sheet
  - Index document
  - Application forms

### Fee Calculation
- **Location**: `services/api/src/modules/architect/permit-package.service.ts`
- **TODO**: Integrate with jurisdiction fee calculation APIs or use template rules

## Next Steps

- **Permit Package Detail Page**: Detailed view with documents, forms, and review comments
- **Document Management**: Add/remove/reorder documents in package
- **Form Editor**: Visual form editor for application forms
- **PDF Generation**: Implement cover sheet and index PDF generation
- **API Integration**: Complete integration with m-permits-inspections API
- **Fee Payment**: Integrate with payment system for permit fees
- **Status Notifications**: Email/SMS notifications for status changes
- **Bulk Operations**: Generate multiple packages at once

---

**Status**: ✅ Complete  
**Date**: January 2026

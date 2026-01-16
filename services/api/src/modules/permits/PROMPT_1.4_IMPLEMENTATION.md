# Prompt 1.4 Implementation: Online Permit Application Portal

## Summary

Implemented comprehensive online permit application portal including multi-step application wizard with progress tracking, project type selection with conditional questions, property lookup with parcel data integration, automatic fee calculation, required document checklist with upload guidance, and save/resume functionality.

## Features Implemented

### ✅ 1. Multi-Step Application Wizard with Progress Tracking
- **Location**: `services/api/src/modules/permits/permit-application.service.ts`
- **Features**:
  - 5-step wizard: Project Type, Property Information, Project Details, Required Documents, Review & Submit
  - Step-by-step progress tracking
  - Progress percentage calculation
  - Step status management (NOT_STARTED, IN_PROGRESS, COMPLETED)
  - Step data persistence

### ✅ 2. Project Type Selection with Conditional Questions
- **Location**: `services/api/src/modules/permits/permit-application.service.ts`
- **Features**:
  - Project type selection (Residential, Commercial, Industrial, Mixed-Use, Institutional, Other)
  - Permit type selection (Building, Electrical, Plumbing, etc.)
  - Conditional questions based on permit type configuration
  - Dynamic question generation based on requirements (architect, engineer, etc.)
  - Question dependency tracking

### ✅ 3. Property Lookup with Parcel Data Integration
- **Location**: `services/api/src/modules/permits/permit-application.service.ts`
- **Features**:
  - Address-based property lookup
  - Parcel number lookup
  - Parcel data caching (PropertyParcel model)
  - GIS/Assessor API integration placeholder
  - Automatic property creation if not exists
  - Parcel data storage (owner, lot size, zoning, assessed value, etc.)

### ✅ 4. Automatic Fee Calculation
- **Location**: `services/api/src/modules/permits/permit-application.service.ts`
- **Features**:
  - Integration with fee schedule system
  - Automatic calculation based on valuation, square footage, unit count
  - Support for all calculation methods (FIXED, PERCENTAGE, PER_SQUARE_FOOT, PER_UNIT, FORMULA, TIERED)
  - Fee calculation details stored
  - Error handling for calculation failures

### ✅ 5. Required Document Checklist with Upload Guidance
- **Location**: `services/api/src/modules/permits/permit-application.service.ts`
- **Features**:
  - Dynamic document checklist based on permit type configuration
  - Document upload tracking
  - Upload status per document
  - Required vs optional document distinction
  - Document validation before submission

### ✅ 6. Save and Resume Functionality
- **Location**: `services/api/src/modules/permits/permit-application.service.ts`
- **Features**:
  - Temporary application ID generation (TEMP-{hex})
  - Auto-save on step completion
  - Manual save endpoint
  - Draft expiration (30 days)
  - Resume from any step
  - Application state persistence

## Database Schema

### New Models
1. **PermitApplication** - Main application entity
   - Wizard state tracking
   - Application data
   - Property and parcel information
   - Fee calculation
   - Document checklist
   - Temporary ID for drafts

2. **ApplicationStep** - Wizard step tracking
   - Step number and name
   - Step status
   - Step data storage
   - Completion tracking

3. **ApplicationQuestion** - Conditional questions
   - Question text and type
   - Conditional logic (depends on)
   - Answer storage
   - Validation rules

4. **PropertyParcel** - Parcel data cache
   - Parcel number and APN
   - Property address
   - Parcel data (JSON)
   - GIS coordinates
   - Data source tracking

### New Enums
- `ApplicationStepStatus`: NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED
- `ProjectType`: RESIDENTIAL, COMMERCIAL, INDUSTRIAL, MIXED_USE, INSTITUTIONAL, OTHER

## API Endpoints

### Application Management
- `POST /permits/applications` - Create new application
- `GET /permits/applications` - List user's applications
- `GET /permits/applications/:id` - Get application
- `POST /permits/applications/:id/save` - Save application

### Wizard Steps
- `PUT /permits/applications/:id/steps/:stepNumber` - Update step
- `POST /permits/applications/:id/project-type` - Set project type (Step 1)
- `POST /permits/applications/:id/property-lookup` - Lookup property (Step 2)
- `POST /permits/applications/:id/project-details` - Set project details (Step 3)
- `GET /permits/applications/:id/required-documents` - Get required documents (Step 4)

### Documents
- `POST /permits/applications/:id/documents` - Upload document

### Submission
- `POST /permits/applications/:id/submit` - Submit application

## Files Created

### Services
- `services/api/src/modules/permits/permit-application.service.ts`
- `services/api/src/modules/permits/permit-application.routes.ts`

### Schema Updates
- Added permit application models to `packages/database/prisma/schema.prisma`

## Files Modified

- `services/api/src/index.ts` - Registered permit application routes
- `packages/database/prisma/schema.prisma` - Added relations to Jurisdiction model

## Application Flow

1. **Create Application**: User starts new application, gets temporary ID
2. **Step 1 - Project Type**: Select project type and permit type, conditional questions appear
3. **Step 2 - Property**: Enter address, lookup parcel data, create/link property
4. **Step 3 - Project Details**: Enter description and valuation, fee automatically calculated
5. **Step 4 - Documents**: View required documents checklist, upload documents
6. **Step 5 - Review & Submit**: Review all information, submit application
7. **Submission**: Application converted to Permit, application number generated

## Integration Points

### Fee Calculation Integration
- Uses `jurisdictionConfigService.calculateFee()`
- Supports all fee calculation methods
- Stores calculation details for transparency

### Property Integration
- Creates Property if doesn't exist
- Caches parcel data in PropertyParcel
- Placeholder for GIS/Assessor API integration

### Permit Creation
- On submission, creates Permit from application
- Links application to permit
- Generates application number

## Next Steps

1. **GIS/Assessor API Integration**: Implement actual API calls for parcel data
2. **File Upload**: Implement actual file upload to S3/Cloudflare R2
3. **Question Templates**: Create question template system for conditional questions
4. **Validation Rules**: Implement comprehensive validation for all fields
5. **Email Notifications**: Send confirmation emails on submission
6. **Frontend UI**: Create wizard interface with progress indicator
7. **Document Preview**: Add document preview functionality
8. **Payment Integration**: Add payment processing for fees

---

**Status**: ✅ Complete  
**Date**: January 2026  
**Note**: GIS/Assessor API and file upload are placeholders and need actual implementation

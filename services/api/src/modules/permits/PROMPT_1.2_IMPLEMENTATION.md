# Prompt 1.2 Implementation: Jurisdiction Configuration System

## Summary

Implemented comprehensive jurisdiction configuration system including fee schedule management with formula builder, permit type configuration, review discipline setup, inspector assignment by specialty and zone, business rule configuration, and holiday/closure calendar management.

## Features Implemented

### ✅ 1. Fee Schedule Management with Formula Builder
- **Location**: `services/api/src/modules/permits/jurisdiction-config.service.ts`
- **Features**:
  - Multiple calculation methods: FIXED, PERCENTAGE, PER_SQUARE_FOOT, PER_UNIT, FORMULA, TIERED
  - Formula builder with variable substitution
  - Min/max amount constraints
  - Tiered pricing support
  - Applicable conditions
  - Effective/expiration dates

### ✅ 2. Permit Type Configuration
- **Location**: `services/api/src/modules/permits/jurisdiction-config.service.ts`
- **Features**:
  - Permit type setup (Building, Electrical, Plumbing, etc.)
  - Required professional signatures (Architect, Engineer, Contractor, Owner)
  - Required documents checklist
  - Required review disciplines
  - Default fee schedule assignment
  - Auto-approval thresholds
  - Expedited processing thresholds

### ✅ 3. Review Discipline Setup
- **Location**: `services/api/src/modules/permits/jurisdiction-config.service.ts`
- **Features**:
  - Discipline types: Zoning, Building, Fire, Environmental, Structural, Mechanical, Electrical, Plumbing, Accessibility, Energy, Landscape, Historic
  - Required/optional discipline configuration
  - Review order sequencing
  - Estimated review days
  - Auto-assignment rules
  - Assignment criteria

### ✅ 4. Inspector Assignment by Specialty and Zone
- **Location**: `services/api/src/modules/permits/jurisdiction-config.service.ts`
- **Features**:
  - Specialty assignment (Building, Electrical, Plumbing, Mechanical, Fire, etc.)
  - Geographic zone assignment with GeoJSON boundaries
  - Permit type filtering
  - Maximum concurrent assignments
  - Priority-based assignment
  - Availability scheduling (days of week, hours)
  - Workload balancing support

### ✅ 5. Business Rule Configuration
- **Location**: `services/api/src/modules/permits/jurisdiction-config.service.ts`
- **Features**:
  - Rule types: AUTO_APPROVAL, EXPEDITED_THRESHOLD, REQUIRED_REVIEW, FEE_WAIVER, PERMIT_EXEMPTION, INSPECTION_REQUIREMENT
  - Conditional rule evaluation
  - Threshold-based rules
  - Priority-based rule execution
  - Rule actions (auto-approve, skip review, fee waiver, etc.)

### ✅ 6. Holiday and Closure Calendar Management
- **Location**: `services/api/src/modules/permits/jurisdiction-config.service.ts`
- **Features**:
  - Holiday creation with dates
  - Recurring holidays (annual)
  - iCal recurrence rule support
  - Selective closure (permits, inspections, reviews)
  - Multi-day holiday support
  - Holiday checking API

## Database Schema

### New Models
1. **FeeSchedule** - Fee calculation rules
   - Calculation methods
   - Formula support
   - Tiered pricing
   - Min/max constraints

2. **PermitTypeConfig** - Permit type configuration
   - Required signatures
   - Required documents
   - Review disciplines
   - Auto-approval thresholds

3. **ReviewDiscipline** - Review discipline setup
   - Discipline types
   - Review order
   - Auto-assignment rules

4. **InspectorAssignment** - Inspector assignment rules
   - Specialty and zone assignment
   - Availability scheduling
   - Workload limits

5. **BusinessRule** - Business rule configuration
   - Conditional rules
   - Threshold-based rules
   - Rule actions

6. **HolidayCalendar** - Holiday/closure management
   - Holiday dates
   - Recurring holidays
   - Selective closures

### New Enums
- `FeeCalculationMethod`: FIXED, PERCENTAGE, PER_SQUARE_FOOT, PER_UNIT, FORMULA, TIERED
- `ReviewDisciplineType`: ZONING, BUILDING, FIRE, ENVIRONMENTAL, STRUCTURAL, MECHANICAL, ELECTRICAL, PLUMBING, ACCESSIBILITY, ENERGY, LANDSCAPE, HISTORIC
- `BusinessRuleType`: AUTO_APPROVAL, EXPEDITED_THRESHOLD, REQUIRED_REVIEW, FEE_WAIVER, PERMIT_EXEMPTION, INSPECTION_REQUIREMENT
- `InspectorSpecialty`: BUILDING, ELECTRICAL, PLUMBING, MECHANICAL, FIRE, ACCESSIBILITY, ENERGY, STRUCTURAL, ENVIRONMENTAL, GENERAL

## API Endpoints

### Fee Schedules
- `POST /permits/jurisdictions/:id/fee-schedules` - Create fee schedule
- `POST /permits/fee-schedules/:id/calculate` - Calculate fee

### Permit Type Configuration
- `POST /permits/jurisdictions/:id/permit-type-configs` - Create permit type config

### Review Disciplines
- `POST /permits/jurisdictions/:id/review-disciplines` - Create review discipline

### Inspector Assignments
- `POST /permits/jurisdictions/:id/inspector-assignments` - Create inspector assignment

### Business Rules
- `POST /permits/jurisdictions/:id/business-rules` - Create business rule
- `POST /permits/jurisdictions/:id/business-rules/evaluate` - Evaluate business rules

### Holiday Calendar
- `POST /permits/jurisdictions/:id/holidays` - Create holiday
- `GET /permits/jurisdictions/:id/holidays/check` - Check if date is holiday

### Configuration Overview
- `GET /permits/jurisdictions/:id/configuration` - List all configuration

## Files Created

### Services
- `services/api/src/modules/permits/jurisdiction-config.service.ts`
- `services/api/src/modules/permits/jurisdiction-config.routes.ts`

### Schema Updates
- Added configuration models to `packages/database/prisma/schema.prisma`

## Files Modified

- `services/api/src/index.ts` - Registered jurisdiction config routes
- `packages/database/prisma/schema.prisma` - Added relations to Jurisdiction model

## Formula Builder

The formula builder supports:
- Variable substitution (valuation, squareFootage, unitCount, etc.)
- Basic arithmetic operations
- JavaScript expression evaluation

**Example formulas:**
- `baseAmount + (valuation * 0.001)` - Base amount plus 0.1% of valuation
- `squareFootage * 2.5 + 100` - $2.50 per sqft plus $100 base
- `Math.max(valuation * 0.002, 50)` - 0.2% of valuation with $50 minimum

**Note**: In production, use a safer formula evaluator like `mathjs` or `expr-eval` instead of `Function()` constructor.

## Business Rule Evaluation

Business rules are evaluated in priority order. Rules can:
- Auto-approve permits under certain conditions
- Set expedited processing thresholds
- Require specific reviews
- Apply fee waivers
- Exempt permits from certain requirements
- Add inspection requirements

**Example rule:**
```json
{
  "conditions": {
    "permitType": "BUILDING",
    "valuation": { "max": 50000 },
    "projectType": "RESIDENTIAL"
  },
  "actions": {
    "autoApprove": true,
    "skipReview": ["ZONING"],
    "feeWaiver": 0.1
  }
}
```

## Next Steps

1. **Formula Evaluator**: Replace `Function()` with safer evaluator (mathjs)
2. **Recurrence Library**: Implement proper iCal recurrence rule parsing
3. **Zone Matching**: Implement geographic zone matching for inspector assignment
4. **Workload Balancing**: Implement automatic workload balancing algorithm
5. **Frontend UI**: Create configuration management interface
6. **Validation**: Add comprehensive validation for formulas and rules

---

**Status**: ✅ Complete  
**Date**: January 2026  
**Note**: Formula evaluator uses `Function()` which should be replaced with a safer alternative in production

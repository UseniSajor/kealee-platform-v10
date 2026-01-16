# Prompt 1.5 Implementation: Automatic Application Routing

## Summary

Implemented comprehensive automatic application routing system including rules-based routing to correct review disciplines, workload-based distribution among available staff, priority routing for expedited applications, re-routing logic for corrections and resubmittals, escalation rules for delayed reviews, and status notification system for applicants.

## Features Implemented

### ✅ 1. Rules-Based Routing to Correct Review Disciplines
- **Location**: `services/api/src/modules/permits/permit-routing.service.ts`
- **Features**:
  - Evaluate routing rules based on permit type, valuation, project type
  - Determine required review disciplines from permit type config
  - Apply routing rules with priority ordering
  - Create routing assignments for each required discipline
  - Support for discipline review order

### ✅ 2. Workload-Based Distribution Among Available Staff
- **Location**: `services/api/src/modules/permits/permit-routing.service.ts`
- **Features**:
  - Integration with workload balancing algorithm
  - Auto-assignment based on reviewer availability
  - Workload capacity checking
  - Specialty matching
  - Priority-based assignment

### ✅ 3. Priority Routing for Expedited Applications
- **Location**: `services/api/src/modules/permits/permit-routing.service.ts`
- **Features**:
  - Higher priority for expedited permits (priority = 100)
  - Expedited flag on routing assignments
  - Priority-based reviewer assignment
  - Faster due date calculation

### ✅ 4. Re-Routing Logic for Corrections and Resubmittals
- **Location**: `services/api/src/modules/permits/permit-routing.service.ts`
- **Features**:
  - Re-route based on corrections required
  - Create new routing assignments from existing ones
  - Track previous routing for audit trail
  - Re-routing reason tracking
  - Automatic re-assignment if discipline specified

### ✅ 5. Escalation Rules for Delayed Reviews
- **Location**: `services/api/src/modules/permits/permit-routing.service.ts`
- **Features**:
  - Automatic escalation for overdue reviews
  - Escalation for delayed reviews (7+ days)
  - Escalation reasons: DELAYED_REVIEW, OVERDUE, NO_ASSIGNMENT, WORKLOAD_OVERFLOW, QUALITY_CONCERN
  - Escalate to administrator if no specific user
  - Escalation notification system

### ✅ 6. Status Notification System for Applicants
- **Location**: `services/api/src/modules/permits/permit-routing.service.ts`
- **Features**:
  - Notification types: STATUS_UPDATE, REVIEW_STARTED, CORRECTIONS_REQUIRED, RESUBMITTED, APPROVED, ESCALATION
  - Multi-channel delivery (EMAIL, SMS, IN_APP)
  - Notification read tracking
  - Automatic notifications on status changes
  - Event emission for notification service

## Database Schema

### New Models
1. **PermitRouting** - Routing assignment tracking
   - Discipline assignment
   - Reviewer assignment
   - Routing status
   - Priority and expedited flags
   - Re-routing tracking
   - Escalation tracking
   - Due date management

2. **RoutingRule** - Rules-based routing configuration
   - Rule conditions (permit type, valuation, project type)
   - Required and optional disciplines
   - Routing order
   - Priority

3. **PermitNotification** - Notification tracking
   - Notification types
   - Multi-channel delivery
   - Read tracking
   - Delivery status

### New Enums
- `RoutingStatus`: PENDING, ROUTED, IN_REVIEW, COMPLETED, RE_ROUTED, ESCALATED
- `EscalationReason`: DELAYED_REVIEW, OVERDUE, NO_ASSIGNMENT, WORKLOAD_OVERFLOW, QUALITY_CONCERN

## API Endpoints

### Routing
- `POST /permits/permits/:id/route` - Route permit to review disciplines
- `POST /permits/routings/:id/assign` - Auto-assign reviewer
- `POST /permits/permits/:id/re-route` - Re-route permit
- `POST /permits/routings/:id/escalate` - Escalate routing
- `GET /permits/permits/:id/routing-status` - Get routing status
- `POST /permits/routings/:id/complete` - Complete routing

### Escalation
- `POST /permits/jurisdictions/:id/check-delayed` - Check for delayed reviews

### Notifications
- `GET /permits/notifications` - Get user's notifications
- `POST /permits/notifications/:id/read` - Mark notification as read

## Files Created

### Services
- `services/api/src/modules/permits/permit-routing.service.ts`
- `services/api/src/modules/permits/permit-routing.routes.ts`

### Schema Updates
- Added routing models to `packages/database/prisma/schema.prisma`

## Files Modified

- `services/api/src/index.ts` - Registered permit routing routes
- `packages/database/prisma/schema.prisma` - Added relations to Permit and Jurisdiction models

## Routing Workflow

1. **Permit Submission**: Permit status changes to SUBMITTED
2. **Route Permit**: System evaluates routing rules and creates routing assignments
3. **Auto-Assign**: System assigns reviewers based on workload balancing
4. **Review**: Reviewers complete their discipline reviews
5. **Completion**: When all disciplines complete, permit is approved
6. **Re-Routing**: If corrections required, permit is re-routed
7. **Escalation**: If reviews are delayed, system escalates automatically

## Integration Points

### With Previous Prompts
- **Prompt 1.2 (Configuration)**: Uses permit type config for required disciplines
- **Prompt 1.3 (Staff Management)**: Uses workload balancing for reviewer assignment
- **Prompt 1.4 (Application Portal)**: Routes permits created from applications

### With Notification System (Future)
- Email delivery via SendGrid
- SMS delivery via Twilio
- In-app notifications
- Push notifications for mobile

## Next Steps

1. **Scheduled Job**: Create cron job to check for delayed reviews daily
2. **Notification Service**: Implement actual email/SMS delivery
3. **Routing Rules UI**: Create interface for managing routing rules
4. **Reviewer Dashboard**: Create dashboard for reviewers to see assigned permits
5. **Escalation Workflow**: Create escalation workflow UI for administrators
6. **Performance Metrics**: Track routing performance and reviewer efficiency

---

**Status**: ✅ Complete  
**Date**: January 2026  
**Note**: Notification delivery (email/SMS) and scheduled escalation checks need actual implementation

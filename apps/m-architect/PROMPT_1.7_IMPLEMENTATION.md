# Prompt 1.7 Implementation: Design Review Workflow

## Summary

Implemented comprehensive design review workflow system with review request creation, reviewer assignment, deadline management, commenting system with threading, comment status tracking, and review completion approval process.

## Features Implemented

### ✅ 1. Review Request Creation with Specific Deliverables
- **Location**: `services/api/src/modules/architect/review.service.ts`
- **Features**:
  - `createReviewRequest()` - Create review request with multiple deliverable types
  - Support for deliverables, files, drawing sheets, and BIM models
  - Review type categorization
  - Priority levels (LOW, NORMAL, HIGH, URGENT)
  - Draft status for work-in-progress requests

### ✅ 2. Reviewer Assignment (Internal Team, Client, Consultant)
- **Location**: `packages/database/prisma/schema.prisma` - `ReviewerType` enum
- **Features**:
  - Multiple reviewer assignment
  - Reviewer type tracking (INTERNAL_TEAM, CLIENT, CONSULTANT, EXTERNAL)
  - Reviewer validation
  - Reviewer information display

### ✅ 3. Review Deadline Setting with Reminders
- **Location**: `services/api/src/modules/architect/review.service.ts`
- **Features**:
  - `reviewDeadline` field for deadline tracking
  - `reminderDaysBefore` configuration (default 3 days)
  - `reminderSentAt` tracking
  - `sendReviewReminder()` - Send reminder to reviewers
  - Overdue detection and alerts
  - Due soon alerts (configurable days)
  - Review reminder records for audit trail

### ✅ 4. Commenting System with Mark-up Tools
- **Location**: `services/api/src/modules/architect/review.service.ts`
- **Features**:
  - `createComment()` - Create review comments
  - Comment threading with `parentCommentId`
  - Thread depth tracking
  - Markup data support (JSON for drawing/shape data)
  - Coordinates tracking (2D and 3D)
  - Page number support for PDFs/drawings
  - Target type and ID for linking to specific deliverables/files/sheets/models
  - @mentions support (`mentionedUserIds`)

### ✅ 5. Comment Status Tracking (Open, Addressed, Closed)
- **Location**: `packages/database/prisma/schema.prisma` - `CommentStatus` enum
- **Features**:
  - Statuses: OPEN, ADDRESSED, CLOSED, RESOLVED
  - `updateCommentStatus()` - Update comment status
  - Automatic timestamp tracking (addressedAt, closedAt)
  - User tracking (addressedBy, closedBy)
  - Addressed notes for documentation
  - Status-based filtering

### ✅ 6. Review Completion Approval Process
- **Location**: `services/api/src/modules/architect/review.service.ts`
- **Features**:
  - `submitReviewRequest()` - Submit draft review (DRAFT → PENDING)
  - `startReview()` - Start review (PENDING → IN_REVIEW)
  - `completeReviewRequest()` - Complete review (IN_REVIEW → COMPLETED)
  - `approveReviewRequest()` - Approve completed review
  - Completion notes and approval notes
  - Status validation for workflow progression
  - Completion and approval timestamps

## Database Schema

### New Models

1. **ReviewRequest**
   - Review information (title, description, type, priority, status)
   - Deliverable associations (deliverableIds, fileIds, sheetIds, modelIds)
   - Reviewer assignment (reviewerIds, reviewerTypes)
   - Deadline and reminder tracking
   - Completion and approval tracking

2. **ReviewComment** (expanded from placeholder)
   - Comment content (commentText, commentType)
   - Location/context (targetType, targetId, pageNumber, coordinates)
   - Markup data for drawing tools
   - Threading (parentCommentId, threadDepth)
   - Status tracking (OPEN, ADDRESSED, CLOSED, RESOLVED)
   - @mentions support

3. **ReviewReminder**
   - Reminder tracking
   - Reminder types (DEADLINE_APPROACHING, OVERDUE, FOLLOW_UP)
   - Sent timestamp and message

### New Enums

- `ReviewRequestStatus`: DRAFT, PENDING, IN_REVIEW, COMPLETED, CANCELLED
- `ReviewerType`: INTERNAL_TEAM, CLIENT, CONSULTANT, EXTERNAL
- `CommentStatus`: OPEN, ADDRESSED, CLOSED, RESOLVED
- `ReviewPriority`: LOW, NORMAL, HIGH, URGENT

### Relations

- `ReviewRequest` → `DesignProject` (many-to-one)
- `ReviewRequest` → `User` (createdBy, completedBy, approvedBy)
- `ReviewRequest` → `ReviewComment` (one-to-many)
- `ReviewComment` → `ReviewRequest` (optional many-to-one)
- `ReviewComment` → `DesignProject` (many-to-one)
- `ReviewComment` → `ReviewComment` (self-referential for threading)
- `ReviewComment` → `User` (createdBy, addressedBy, closedBy)
- `ReviewReminder` → `ReviewRequest` (many-to-one)
- `ReviewReminder` → `User` (many-to-one)

## API Endpoints

### Review Request Management
- `POST /architect/design-projects/:projectId/review-requests` - Create review request
- `GET /architect/design-projects/:projectId/review-requests` - List review requests
- `GET /architect/review-requests/:id` - Get review request with comments
- `POST /architect/review-requests/:id/submit` - Submit review request
- `POST /architect/review-requests/:id/start` - Start review
- `POST /architect/review-requests/:id/complete` - Complete review
- `POST /architect/review-requests/:id/approve` - Approve review

### Comment Management
- `POST /architect/review-requests/:id/comments` - Create comment
- `PATCH /architect/comments/:id/status` - Update comment status

### Review Tracking
- `GET /architect/design-projects/:projectId/review-requests/overdue` - Get overdue reviews
- `GET /architect/design-projects/:projectId/review-requests/due-soon` - Get reviews due soon
- `GET /architect/design-projects/:projectId/review-summary` - Get review summary/dashboard
- `POST /architect/review-requests/:id/reminders` - Send reminder

## Service Methods

### reviewService
- `createReviewRequest()` - Create review with deliverables and reviewers
- `submitReviewRequest()` - Submit draft review
- `startReview()` - Start review (verify reviewer)
- `getReviewRequest()` - Get review with all comments and reviewers
- `listReviewRequests()` - List reviews with filters
- `createComment()` - Create comment with threading support
- `updateCommentStatus()` - Update comment status
- `completeReviewRequest()` - Complete review
- `approveReviewRequest()` - Approve completed review
- `getOverdueReviewRequests()` - Get overdue reviews
- `getReviewRequestsDueSoon()` - Get reviews due soon
- `sendReviewReminder()` - Send reminder to reviewer
- `getReviewSummary()` - Get dashboard summary

## Frontend Components

### Reviews List Page
- **Location**: `apps/m-architect/app/projects/[id]/reviews/page.tsx`
- **Features**:
  - Review request list with status badges
  - Summary dashboard (total, in review, completed, overdue)
  - Overdue and due soon alerts
  - Filtering by status
  - Priority indicators
  - Action buttons (Submit, Start, Complete, Approve)
  - Reviewer count and comment count display

### Review Detail Page
- **Location**: `apps/m-architect/app/projects/[id]/reviews/[reviewId]/page.tsx`
- **Features**:
  - Review request header with details
  - Reviewers list
  - Comments list with threading
  - Comment status badges
  - Reply functionality
  - Mark Addressed/Resolve buttons
  - New comment form
  - Comment thread visualization

## Workflow

1. **Create Review Request**
   - User creates review request with title, description
   - Selects deliverables/files/sheets/models to review
   - Assigns reviewers (internal team, client, consultant)
   - Sets deadline and reminder preferences
   - Status: DRAFT

2. **Submit Review Request**
   - User submits review request
   - Status: DRAFT → PENDING
   - Notifications sent to reviewers (placeholder)

3. **Start Review**
   - Reviewer starts the review
   - Status: PENDING → IN_REVIEW
   - Only assigned reviewers can start

4. **Add Comments**
   - Reviewers add comments on deliverables
   - Comments can be threaded (replies)
   - Comments can include markup data
   - Comments can mention users with @
   - Comments linked to specific targets (files, sheets, models)

5. **Update Comment Status**
   - Comments can be marked as ADDRESSED
   - Comments can be RESOLVED or CLOSED
   - Status changes tracked with timestamps and users

6. **Complete Review**
   - Reviewer completes review
   - Status: IN_REVIEW → COMPLETED
   - Completion notes optional

7. **Approve Review**
   - Project manager/lead approves completed review
   - Approval notes optional
   - Approval timestamp tracked

8. **Reminders**
   - System can send reminders before deadline
   - Reminders tracked for audit
   - Overdue reviews highlighted

## Files Created

### Database
- Updated `packages/database/prisma/schema.prisma` - Expanded ReviewComment, added ReviewRequest, ReviewReminder models and enums

### API
- `services/api/src/modules/architect/review.service.ts` - Review workflow business logic
- `services/api/src/modules/architect/review.routes.ts` - Review API routes

### Frontend
- `apps/m-architect/app/projects/[id]/reviews/page.tsx` - Reviews list page
- `apps/m-architect/app/projects/[id]/reviews/[reviewId]/page.tsx` - Review detail page

## Files Modified

- `services/api/src/index.ts` - Registered review routes
- `apps/m-architect/lib/api.ts` - Added review API methods
- `apps/m-architect/app/projects/[id]/page.tsx` - Added reviews link

## Next Steps

- **Prompt 1.8**: Implement real-time collaboration tools
- **Future**: Complete notification service integration for reminders
- **Future**: Enhanced review request creation form with deliverable/file selection
- **Future**: Markup tools integration for drawing on PDFs/drawings
- **Future**: @mention autocomplete and notifications
- **Future**: Review templates for common review types
- **Future**: Review analytics and reporting

---

**Status**: ✅ Complete  
**Date**: January 2026

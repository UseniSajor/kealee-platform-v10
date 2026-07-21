# Sales SLA Reminders Implementation

## Summary

Added sales queue and worker for sales task SLA reminders with cron job scheduling.

## Files Created

1. **`services/worker/src/types/sales.types.ts`** (New)
   - Type definitions for sales jobs
   - `SalesJobData` interface
   - `SalesSlaReminderResult` interface

2. **`services/worker/src/queues/sales.queue.ts`** (New)
   - BullMQ queue for sales operations
   - `slaReminder()` method to queue SLA reminder jobs

3. **`services/worker/src/processors/sales.processor.ts`** (New)
   - Worker that processes sales jobs
   - `processSlaReminderJob()` - Sends email notifications and records audit/events
   - `createSalesWorker()` - Creates and configures the worker

4. **`services/worker/src/jobs/sales-sla-reminders.job.ts`** (New)
   - Cron job that finds SalesTasks needing reminders
   - Queues reminder jobs for processing

## Files Modified

1. **`services/worker/src/types/cron.types.ts`**
   - Added `sales_sla_reminders` to `CronJobType`
   - Added `salesSlaReminders` config (runs every 15 minutes)

2. **`services/worker/src/cron/cron.manager.ts`**
   - Added import for `executeSalesSlaReminders`
   - Added case handler for `sales_sla_reminders` type
   - Registered the cron job

3. **`services/worker/src/index.ts`**
   - Added `salesQueue` import
   - Added `createSalesWorker` import
   - Added `salesWorker` variable
   - Added `initializeSalesQueue()` function
   - Wired into startup and shutdown

4. **`services/worker/src/queues/index.ts`**
   - Exported `SalesQueue` and `salesQueue`

5. **`services/worker/src/jobs/index.ts`**
   - Exported `executeSalesSlaReminders`

## Implementation Details

### Cron Job Schedule

- **Schedule**: Every 15 minutes (`*/15 * * * *`)
- **Timezone**: UTC
- **Configurable**: Can be changed in `cron.types.ts`

### SLA Reminder Logic

1. **Find Tasks**:
   - `slaDueAt` between now and 2 hours from now
   - Status not `DONE` or `CANCELLED`

2. **Deduplication**:
   - Checks for recent reminders (within last hour)
   - Skips tasks that already have recent reminders

3. **Queue Jobs**:
   - Queues individual reminder jobs for each task
   - Each job processed asynchronously

### Worker Processing

1. **Fetch Task Data**:
   - Loads SalesTask with lead and assigned user

2. **Send Notification**:
   - Email via `emailQueue` (reuses existing email infrastructure)
   - Includes task details, SLA due time, time remaining

3. **Record Audit**:
   - Creates `AuditLog` with action `SALES_TASK_SLA_REMINDER_SENT`
   - Records before/after state

4. **Record Event**:
   - Creates `Event` with type `SALES_TASK_SLA_REMINDER_SENT`
   - Includes full payload for event store

### Email Template

**Subject**: `SLA Reminder: {taskType} task for {leadName}`

**Content**:
- Task type
- Lead name
- SLA due date/time
- Time remaining (hours/minutes)
- Link to view lead

## Queue Configuration

- **Queue Name**: `sales`
- **Concurrency**: 10 jobs concurrently
- **Rate Limiting**: 100 jobs per minute
- **Retry**: 3 attempts with exponential backoff (5s initial delay)
- **Job Retention**: 
  - Completed: 7 days
  - Failed: 30 days

## Audit & Event Logging

### Audit Log

```typescript
{
  action: 'SALES_TASK_SLA_REMINDER_SENT',
  entityType: 'SalesTask',
  entityId: taskId,
  userId: assignedToUserId,
  reason: 'SLA reminder sent for task {taskId} (due in {timeRemaining})',
  before: {
    taskId,
    taskType,
    taskStatus,
    slaDueAt,
  },
  after: {
    reminderSentAt,
    timeRemaining,
  }
}
```

### Event

```typescript
{
  type: 'SALES_TASK_SLA_REMINDER_SENT',
  entityType: 'SalesTask',
  entityId: taskId,
  userId: assignedToUserId,
  payload: {
    taskId,
    leadId,
    taskType,
    taskStatus,
    slaDueAt,
    timeRemaining,
    reminderSentAt,
  }
}
```

## Usage

### Manual Queue Job

```typescript
import { salesQueue } from './queues/sales.queue'

await salesQueue.slaReminder({
  type: 'sla_reminder',
  taskId: 'task-123',
  leadId: 'lead-456',
  assignedToUserId: 'user-789',
  slaDueAt: '2026-01-15T14:00:00Z',
  metadata: {
    taskType: 'FOLLOW_UP',
    taskStatus: 'OPEN',
  },
})
```

### Cron Job Execution

The cron job runs automatically every 15 minutes:
- Finds tasks with SLA due within 2 hours
- Queues reminder jobs
- Worker processes jobs and sends notifications

## Configuration

### Environment Variables

Uses existing email configuration:
- `SENDGRID_API_KEY` - For email sending
- `SENDGRID_FROM_EMAIL` - From address
- `SENDGRID_FROM_NAME` - From name
- `NEXT_PUBLIC_MARKETPLACE_URL` - Base URL for lead links

### Cron Schedule

To change the schedule, update `cron.types.ts`:

```typescript
salesSlaReminders: {
  name: 'Sales SLA Reminders',
  type: 'sales_sla_reminders',
  schedule: '*/15 * * * *', // Every 15 minutes (change as needed)
  enabled: true,
  timezone: 'UTC',
}
```

## Testing

### Development Mode

The worker will start automatically when the service starts. To test:

1. Create a SalesTask with `slaDueAt` within 2 hours
2. Wait for cron job to run (or trigger manually)
3. Check email queue for reminder job
4. Verify audit log and event records

### Manual Testing

```typescript
// In worker console or test script
import { executeSalesSlaReminders } from './jobs/sales-sla-reminders.job'

const result = await executeSalesSlaReminders()
console.log(result)
```

## Integration Points

- **Email Queue**: Reuses existing email infrastructure
- **Database**: Uses Prisma for SalesTask queries and audit/event logging
- **Redis/BullMQ**: Uses existing queue infrastructure
- **Cron Manager**: Integrated into existing cron job system

## Future Enhancements

1. **Webhook Notifications**: Add webhook delivery option
2. **SMS Reminders**: Add SMS notification support
3. **Escalation**: Add escalation logic for overdue tasks
4. **Customizable Thresholds**: Make 2-hour window configurable
5. **Task Templates**: Add reminder templates per task type

---

**Status**: ✅ Complete  
**Date**: January 2026

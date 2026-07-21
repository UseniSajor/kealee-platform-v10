# keabot-project-monitor

Real-time construction project tracking, issue detection, and milestone payment bot for the Kealee Platform.

## Purpose

KeaBot Project Monitor watches active construction projects across all phases, surfaces problems early, manages milestone-based payments, and keeps stakeholders informed. It integrates with the Kealee API for live data and falls back to computed mock data when the API is unavailable.

## Tools

| Tool | Description |
|------|-------------|
| `track_project_progress` | Returns full project status: phase, progress %, budget vs. spend, next milestone, and any active issues |
| `detect_issues` | Analyzes a project for active problems using configurable thresholds (see below) |
| `send_status_update` | Sends a weekly status update email to the specified recipient via the notification service |
| `manage_milestones` | Marks a milestone complete by trigger event and initiates Stripe payment release |
| `escalate_problems` | Escalates an issue to the project manager with a response-time SLA |

## Milestone Payment Logic

Milestone payments are calculated as a percentage of the total contract value and released when the corresponding trigger event is verified.

| Milestone | Trigger Event | Payment % |
|-----------|--------------|-----------|
| Permits | `permit_approved` | 10% |
| Demo | `demo_complete` | 20% |
| Framing | `framing_complete` | 30% |
| Final | `final_inspection_passed` | 40% |

Payments are processed via Stripe. The bot never releases a milestone payment without confirming the trigger event has occurred.

## Issue Detection Thresholds

| Issue Type | Trigger Condition | Default Severity |
|------------|-------------------|-----------------|
| `BUDGET_OVERRUN` | Spent > 110% of budget | medium; high if > 125% |
| `BEHIND_SCHEDULE` | Days elapsed > 120% of estimated | medium; high if > 30 days late |
| `CONTRACTOR_UNRESPONSIVE` | No contact in > 7 days | medium; high if > 14 days |
| `PERMIT_DELAY` | Permit pending > 60 days | medium |
| `SAFETY_ISSUE` | Safety incident flag set | critical |

## Expected Output JSON

### track_project_progress

```json
{
  "projectId": "proj_abc123",
  "progress": 50,
  "currentPhase": "Construction - Framing",
  "nextMilestone": {
    "name": "Framing",
    "trigger": "framing_complete",
    "amount": 85500,
    "percentage": 30,
    "paid": false,
    "daysDue": 14
  },
  "issues": [],
  "lastUpdate": "2026-04-07T12:00:00.000Z",
  "budgetSpent": 142500,
  "budgetTotal": 285000,
  "daysElapsed": 45,
  "daysEstimated": 105
}
```

### detect_issues

```json
[
  {
    "type": "BUDGET_OVERRUN",
    "severity": "medium",
    "message": "15% over budget. Spent $327,500 of $285,000 budget.",
    "detectedAt": "2026-04-07T12:00:00.000Z",
    "resolved": false
  }
]
```

### manage_milestones

```json
{
  "projectId": "proj_abc123",
  "milestone": "Framing",
  "trigger": "framing_complete",
  "amount": 85500,
  "percentage": 30,
  "paymentStatus": "released",
  "stripePayoutId": "po_1Abc123XYZ"
}
```

### escalate_problems

```json
{
  "escalated": true,
  "ticketId": "ESC-1K2M3N",
  "projectId": "proj_abc123",
  "issueType": "CONTRACTOR_UNRESPONSIVE",
  "severity": "high",
  "assignedTo": "project_manager",
  "expectedResponseTime": "1 hour",
  "createdAt": "2026-04-07T12:00:00.000Z"
}
```

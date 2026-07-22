# Sales and Support Automation Runbook

## Sales controls

The ten responsibilities are enforced by `sales-workflow.ts`. A write must include a unique event ID and expected version. Conversion, opt-out, disqualification, invalid contact, suppression, or human takeover stops automated sales.

Before every touchpoint evaluate campaign/template approval, channel consent, global/organization/campaign suppression, purchase/conversion state, hold state, duplicate idempotency key, daily caps, domain caps, and the contact's IANA-timezone window. Phone and SMS require affirmative consent.

## Support controls

Authenticated project status comes from `GET /api/support/projects/:projectId/status`. Missing values remain null. Do not derive status or dates from chat history. Medium confidence creates verification work; low confidence or regulated judgment escalates.

Immediate escalation topics include distress, refund disputes, threats, legal claims, safety, discrimination, fraud, enforcement/stop-work orders, and repeated unresolved contacts. A case cannot close until explicit resolution criteria are recorded.

## SLA

- Critical: 15 minutes and created in `ESCALATED`.
- High: 60 minutes.
- Normal: 8 hours.
- Low: 24 hours.

Workers must scan `(organizationId,status,slaDueAt)`, claim idempotently, notify the assigned owner, and emit an audit/event record. Delivery does not equal resolution.

## Failure handling

Provider failures retry only when typed retryable. Consent/suppression/policy failures never retry automatically. Dead-letter records require staff review. Human takeover pauses automation until an authorized resume event.

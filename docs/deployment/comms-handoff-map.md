# Communications Handoff Map — Resend (Email) + Twilio (SMS)

> Last updated: 2026-03-15
> Email: Resend (NOT SendGrid) — `packages/communications/src/email.ts`
> SMS: Twilio — `packages/communications/src/sms.ts`
> In-app: `services/api/src/modules/comms/comms.service.ts`

---

## Channel Responsibility Matrix

| Channel | Provider | Package | When Used | Auth |
|---------|----------|---------|-----------|------|
| In-App | Internal DB | `comms.service.ts` | Always — every notification | None (DB write) |
| Email | Resend | `RESEND_API_KEY` | Opt-in or high-priority events | `Bearer RESEND_API_KEY` |
| SMS | Twilio | `TWILIO_*` credentials | Urgent/time-sensitive events only | Account SID + Auth Token |
| Push | VAPID | `VAPID_PUBLIC_KEY` | Web push for active sessions | VAPID keys |

---

## Event-to-Channel Routing Map

### Engagement Events

| Event | In-App | Email | SMS | Priority |
|-------|--------|-------|-----|----------|
| `engagement.changeOrder.created` | ✅ | ✅ | ❌ | Medium |
| `engagement.changeOrder.responded` (APPROVED) | ✅ | ✅ | ✅ | High |
| `engagement.changeOrder.responded` (REJECTED) | ✅ | ✅ | ❌ | Medium |
| `engagement.milestone.submitted` | ✅ | ✅ | ❌ | Medium |
| `engagement.milestone.approved` | ✅ | ✅ | ✅ | High |
| `engagement.milestone.rejected` | ✅ | ✅ | ✅ | High |
| `engagement.payment.released` | ✅ | ✅ | ✅ | Critical |
| `engagement.dispute.opened` | ✅ | ✅ | ✅ | Critical |
| `engagement.dispute.resolved` | ✅ | ✅ | ✅ | High |

### Project Events

| Event | In-App | Email | SMS | Priority |
|-------|--------|-------|-----|----------|
| `project.created` | ✅ | ✅ | ❌ | Low |
| `project.readiness.advanced` | ✅ | ✅ | ❌ | Medium |
| `project.phase.changed` | ✅ | ✅ | ❌ | Low |

### Land / Feasibility Events

| Event | In-App | Email | SMS | Priority |
|-------|--------|-------|-----|----------|
| `land.offer.accepted` | ✅ | ✅ | ✅ | High |
| `land.offer.rejected` | ✅ | ✅ | ❌ | Medium |
| `feasibility.study.decided` | ✅ | ✅ | ✅ | High |

### Development Events

| Event | In-App | Email | SMS | Priority |
|-------|--------|-------|-----|----------|
| `development.draw.approved` | ✅ | ✅ | ✅ | High |
| `development.draw.funded` | ✅ | ✅ | ✅ | Critical |
| `development.draw.rejected` | ✅ | ✅ | ✅ | High |
| `development.investor.reportPublished` | ✅ | ✅ | ❌ | Low |

---

## Resend (Email) Implementation

**Status:** ✅ `routeEmail()` wired in `comms.service.ts` (2026-03-15)

```
From:     RESEND_FROM_EMAIL or "Kealee <noreply@kealee.com>"
API:      POST https://api.resend.com/emails
Auth:     Bearer RESEND_API_KEY
Lookup:   user.email resolved from userId via Prisma
Template: Inline HTML (title + body + optional entity ref)
```

**Retry strategy:** Fire-and-forget via `routeEmail().catch(err => console.error(...))`
**Rate limit:** Resend free tier: 100 emails/day. Pro: 50K/month.

### Email Templates to Build

| Notification Type | Template Name | Variables |
|-------------------|---------------|-----------|
| Milestone approved | `milestone-approved` | `contractorName`, `milestoneName`, `amount`, `projectName` |
| Payment released | `payment-released` | `contractorName`, `amount`, `transactionId` |
| Dispute opened | `dispute-opened` | `projectName`, `reason`, `supportLink` |
| Change order received | `change-order-received` | `requesterName`, `amountDelta`, `description` |
| Readiness gate advanced | `readiness-advanced` | `projectName`, `newGate`, `nextSteps` |

---

## Twilio (SMS) Implementation

**Status:** ❌ `routeSms()` stub not yet wired (only skips if `TWILIO_ACCOUNT_SID` absent)

**To wire:**
```typescript
async function routeSms(body: SendNotificationBody): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !from) return

  const user = await db.user.findUnique({
    where: { id: body.userId },
    select: { phone: true },
  })
  if (!user?.phone) return

  // Twilio Messages API
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ From: from, To: user.phone, Body: `${body.title}: ${body.body}` }),
  })
}
```

**SMS rules:**
- Max 160 chars per message (concatenate if over)
- Only send to opted-in numbers (`sms_opt_in = true` on user profile)
- Do not send between 9pm–8am local time
- Critical events (payment.released, dispute.opened) override time restriction

---

## Notification Preference Enforcement

User preferences stored in `notif_event_preferences` table.
The `comms.service.ts` `sendNotification()` function accepts `channels: string[]`.

**Flow:**
1. Service emits event (e.g., `engagement.milestone.approved`)
2. Event consumer calls `sendNotification({ userId, event, channels: ['IN_APP', 'EMAIL', 'SMS'] })`
3. `comms.service.ts` checks `channels` parameter
4. Routes to appropriate channels (in-app always, email/SMS if in channels array)
5. Before sending email/SMS, should check `notif_event_preferences` for user opt-out

**TODO:** Wire preference check in `sendNotification()` before routing to email/SMS channels.

---

## Required Env Vars

```bash
# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Kealee <noreply@kealee.com>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15555555555

# Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

# Twilio + Resend Setup Guide

Integration for SMS and email delivery of intake links and notifications.

## Overview

Two services work together to send intake links to users:

- **Twilio** — SMS delivery (phone)
- **Resend** — Email delivery

Both are optional but recommended for production. If either fails, the other is attempted as a fallback.

---

## Twilio SMS Setup

### 1. Create Twilio Account

1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a free trial (includes $15 credit)
3. Verify your phone number

### 2. Get Credentials

From Twilio Console:

- **Account SID**: [Console Dashboard](https://www.twilio.com/console) → Account Info → SID
- **Auth Token**: [Console Dashboard](https://www.twilio.com/console) → Account Info → Auth Token (click "Show")
- **Phone Number**: [Console → Phone Numbers](https://www.twilio.com/console/phone-numbers/incoming) → Get a Number

Example numbers: `+14155552671` (US), `+447700973635` (UK)

### 3. Set Environment Variables

```bash
# apps/web-main/.env.local (development)
# or Vercel / Railway settings (production)

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Test SMS Delivery

```bash
# From apps/web-main directory
curl -X POST http://localhost:3000/api/intake/send-to-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15551234567",
    "projectPath": "kitchen_remodel",
    "intakeUrl": "https://kealee.com/intake/abc123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Link sent via SMS and email",
  "results": {
    "sms": { "success": true, "messageId": "SM..." }
  }
}
```

---

## Resend Email Setup

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier available)
3. Verify your domain (or use default `resend.dev`)

### 2. Get API Key

From Resend Dashboard:

- **API Key**: Settings → API Keys → Create New Key
- **From Email**: Use `noreply@yourdomain.com` (or `noreply@resend.dev` for testing)
- **Contact Email**: `contact@kealee.com` (used in email footer)

### 3. Set Environment Variables

```bash
# apps/web-main/.env.local (development)
# or Vercel / Railway settings (production)

RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@kealee.com
RESEND_CONTACT_EMAIL=contact@kealee.com
```

### 4. Test Email Delivery

```bash
# From apps/web-main directory
curl -X POST http://localhost:3000/api/intake/send-to-phone \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "projectPath": "kitchen_remodel",
    "intakeUrl": "https://kealee.com/intake/abc123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Link sent via email",
  "results": {
    "email": { "success": true, "messageId": "..." }
  }
}
```

---

## Full Send-to-Phone API

**Endpoint**: `POST /api/intake/send-to-phone`

**Request Body**:
```json
{
  "phone": "+15551234567",        // Optional — SMS will be sent if provided
  "email": "user@example.com",     // Optional — email will be sent if provided
  "projectPath": "kitchen_remodel", // Required
  "intakeUrl": "https://..."       // Required
}
```

**At least one of `phone` or `email` must be provided.**

**Response** (success):
```json
{
  "success": true,
  "message": "Link sent via SMS and email",
  "results": {
    "sms": { "success": true, "messageId": "SM..." },
    "email": { "success": true, "messageId": "..." }
  }
}
```

**Response** (error):
```json
{
  "success": false,
  "message": "Could not send via SMS or email. Try copying the link manually.",
  "results": {
    "sms": { "success": false, "error": "Invalid phone number" },
    "email": { "success": false, "error": "Email service not configured" }
  }
}
```

---

## Integration Points

### 1. Send-to-Phone Button (Intake Form)

Located in intake form, allows users to:
- Send link via SMS
- Send link via email
- Copy link manually (fallback)

### 2. Measurement Confirmation (Mobile Capture)

When a measurement is recorded:
```typescript
// Send via SMS
await sendMeasurementConfirmation(
  phoneNumber,
  distance,
  unit,
  confidence
)

// Send via email
await sendMeasurementConfirmation(
  email,
  distance,
  unit,
  confidence,
  method,
  projectId
)
```

### 3. Welcome Email (New Users)

```typescript
await sendWelcomeEmail(
  email,
  userName,
  intakeUrl
)
```

---

## Service Files

- **Twilio Service**: `apps/web-main/lib/services/twilio.ts`
  - `sendIntakeToPhone(phone, projectPath, intakeUrl)`
  - `sendMeasurementConfirmation(phone, distance, unit, confidence)`
  - `sendOTP(phone, code)`

- **Resend Service**: `apps/web-main/lib/services/resend.ts`
  - `sendIntakeLink(email, intakeUrl, projectPath, userName?)`
  - `sendMeasurementConfirmation(email, distance, unit, confidence, method, projectId?)`
  - `sendWelcomeEmail(email, userName, intakeUrl?)`

- **API Route**: `apps/web-main/app/api/intake/send-to-phone/route.ts`
  - Coordinates SMS and email delivery
  - Handles both delivery methods independently
  - Returns success for either delivery method

---

## Deployment

### Vercel

1. Set environment variables in Vercel project settings:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `RESEND_CONTACT_EMAIL`

2. Redeploy to apply changes

### Railway

1. In Railway project, go to Variables
2. Add the same variables above
3. Trigger redeploy

---

## Testing & Monitoring

### Check Service Status

```bash
# From apps/web-main
curl http://localhost:3000/api/intake/diagnostics
```

Will show:
```json
{
  "services": {
    "twilio": { "configured": true, "fromNumber": "+1234567890" },
    "resend": { "configured": true, "fromEmail": "noreply@kealee.com" }
  }
}
```

### View Logs

**Twilio**: Check message status in [Twilio Console → Messages](https://www.twilio.com/console/sms/logs)

**Resend**: Check delivery status in [Resend Dashboard → Emails](https://resend.com/emails)

---

## Troubleshooting

### "SMS service not configured"
- Check `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` are set
- Verify Twilio account is active (not suspended)
- Check Twilio trial credits haven't expired

### "Email service not configured"
- Check `RESEND_API_KEY` is set correctly
- Verify API key is active in Resend dashboard
- Check `RESEND_FROM_EMAIL` matches verified domain

### "Invalid phone number"
- Must be 10+ digits (US: 10, international: varies)
- Format: `+15551234567` (international) or `5551234567` (US)

### Message not received
- Check phone/email in logs
- Verify user didn't block SMS/email
- Twilio trial: test numbers must be verified first
- Resend: check spam folder

---

## Costs

**Twilio Trial**: $15 free credit, then ~$0.0075 per SMS

**Resend**: Free for 100 emails/day, then $0.20 per 1000 emails (or flat $20/month for unlimited)

For high volume, enable production credentials once budget is confirmed.

---

## Security

- All credentials stored as environment variables
- Phone numbers validated before sending
- Messages logged without full content
- HTTPS encryption for all transmissions
- No data stored beyond delivery confirmation

---

## Future Enhancements

- [ ] Delivery confirmation webhooks
- [ ] Message template customization
- [ ] Bulk SMS/email campaigns
- [ ] Bounce/complaint handling
- [ ] Analytics dashboard
- [ ] WhatsApp delivery option

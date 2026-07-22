# Twilio AI Voice Runbook

## Enablement order

1. Apply database migrations and verify `/api/voice/health` reports disabled.
2. Configure Twilio credentials, voice number, public HTTPS status/inbound URLs, WSS ConversationRelay URL, and human transfer number.
3. Configure the Twilio number's inbound webhook as `POST /api/voice/inbound`.
4. Confirm Railway forwards `X-Forwarded-Proto` and `X-Forwarded-Host` unchanged.
5. Enable `AI_VOICE_ENABLED=true` in staging, leaving outbound and recording disabled.
6. Verify invalid signatures receive 403, valid calls receive ConversationRelay TwiML, setup creates a session, prompts persist redacted artifacts, interruption cancels the active response, and human transfer succeeds.
7. Enable recording only after the approved disclosure/retention policy is configured.
8. Enable outbound only after phone consent, quiet-hour, suppression, retry, and staff ownership checks pass.

## Required configuration

See `.env.example`. Secrets remain server-side. `TWILIO_CONVERSATION_RELAY_URL` must use `wss://`. Enabled features fail startup/config validation when dependencies are missing.

## Monitoring

Alert on invalid signatures, socket close 1011, provider 64101–64112 errors, persistence failures, latency, failed transfers, repeated malformed messages, and call-status failure. Logs may include provider call/session IDs but must not contain phone numbers, raw transcripts, card data, or secrets.

## Incident controls

- Disable outbound first: `AI_OUTBOUND_CALLING_ENABLED=false`.
- Disable voice entirely if signatures, tenant isolation, or transcript protection are suspect.
- Preserve provider IDs and audit records; do not copy raw sensitive transcripts into incident tickets.
- Twilio WebSocket disconnects do not reconnect automatically. The `<Connect>` action recovery path must re-establish ConversationRelay with the same call SID.

## Live acceptance

Live acceptance requires one inbound sandbox call, barge-in, status callbacks, human transfer, caller opt-out, payment-card redaction, provider outage behavior, and transcript-retention verification. Paid/live calls are an external post-deployment check, not a CI dependency.

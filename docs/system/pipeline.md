# Kealee Execution Pipeline

User → Agent → CTA → Stripe → Webhook → ProjectOutput → Queue → Worker → Output → Upsell

## Rules
- Every payment MUST create ProjectOutput
- Every ProjectOutput MUST trigger queue execution
- Worker MUST generate output
- Output MUST include nextStep + CTA
- No silent failures allowed

## Failure Conditions
- Payment without ProjectOutput = CRITICAL FAILURE
- Queue not triggered = CRITICAL FAILURE
- Output missing = CRITICAL FAILURE

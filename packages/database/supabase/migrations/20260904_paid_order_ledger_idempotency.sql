-- One operational order per Stripe Checkout Session. This makes webhook
-- redelivery safe and prevents duplicate fulfillment work.
CREATE UNIQUE INDEX IF NOT EXISTS ux_public_intake_leads_stripe_session_id
  ON public.public_intake_leads (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

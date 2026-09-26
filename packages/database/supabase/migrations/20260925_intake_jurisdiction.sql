-- ─────────────────────────────────────────────────────────────────────────────
-- public_intake_leads: the jurisdiction, determined from geometry at intake.
--
-- Written by web-main (lib/jurisdiction-intake.ts) when the customer submits
-- an address: the U.S. Census geocoder places the address in a state, county
-- and incorporated government, and that is mapped to the body that ZONES the
-- land (prince_georges_md, district_of_columbia, rockville_md, …). Everything
-- downstream — the Stripe webhook's rule report, the ops queue, the site-plan
-- engine — reads it instead of inferring a county from the address text.
--
-- BOTH COLUMNS ARE NULLABLE, deliberately. Every writer of this table that
-- predates the column keeps working (KEALEE.md rule 6: a NOT NULL column is a
-- contract with every writer), and an address the geocoder cannot place is a
-- NULL code, never a default county.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public_intake_leads
  ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction      JSONB;

COMMENT ON COLUMN public_intake_leads.jurisdiction_code IS
  'Zoning authority for project_address, determined from geometry at intake (U.S. Census geocoder). NULL = not determined; never defaulted.';
COMMENT ON COLUMN public_intake_leads.jurisdiction IS
  'The full determination: state, county FIPS, municipality, whether it zones its own land, matched address, source and time.';

CREATE INDEX IF NOT EXISTS idx_public_intake_leads_jurisdiction_code
  ON public_intake_leads (jurisdiction_code);

-- Backfill from form_data for orders already determined by the application
-- before this migration ran. Orders with no determination stay NULL.
UPDATE public_intake_leads
   SET jurisdiction      = form_data -> 'jurisdiction',
       jurisdiction_code = form_data -> 'jurisdiction' ->> 'code'
 WHERE jurisdiction IS NULL
   AND form_data -> 'jurisdiction' ->> 'determinedBy' = 'us-census-geocoder'
   AND (form_data -> 'jurisdiction' ->> 'determined')::boolean IS TRUE;

-- Universal auth: link intake purchases to Supabase auth users
ALTER TABLE public_intake_leads
  ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS public_intake_leads_user_id_idx ON public_intake_leads (user_id);

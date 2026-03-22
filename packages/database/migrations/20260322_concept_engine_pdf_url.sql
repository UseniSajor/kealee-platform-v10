-- Add pdf_url column to concept_packages (if not already added)
ALTER TABLE concept_packages ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add delivery_url column to concept_packages (for portal link after approval)
ALTER TABLE concept_packages ADD COLUMN IF NOT EXISTS delivery_url TEXT;

-- Add svg_url to concept_floorplans (populated after Supabase Storage upload)
ALTER TABLE concept_floorplans ADD COLUMN IF NOT EXISTS svg_url TEXT;

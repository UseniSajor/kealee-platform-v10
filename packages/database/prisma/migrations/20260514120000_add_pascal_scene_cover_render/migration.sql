ALTER TABLE pascal_scenes
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS selected_render_url TEXT;


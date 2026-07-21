-- Authentication and RBAC setup
-- This migration sets up functions and triggers for user management

-- Function to handle new user creation (triggered by auth.users insert)
-- This creates a user_profiles entry automatically
create or replace function public.handle_new_user()
returns trigger as $$
declare
  org_id_val uuid;
begin
  -- For Kealee users, find the Kealee org
  -- Note: This assumes Kealee org exists (created in seed data)
  select id into org_id_val
  from orgs
  where org_type = 'KEALEE'
  limit 1;

  -- Create user profile
  -- Note: This is a placeholder - in practice, user_profiles should be created
  -- by application code with proper org_id and role assignment
  -- This trigger would need metadata from auth.users metadata field
  
  return new;
end;
$$ language plpgsql security definer;

-- Note: In production, user_profiles should be created via application code
-- after Supabase Auth user is created, to properly assign org_id and role
-- The trigger above is a placeholder for potential future use

-- Update last_login_at on user login
create or replace function public.update_last_login()
returns trigger as $$
begin
  update user_profiles
  set last_login_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;


-- Add the specific admin user to user_roles table
-- This ensures the user has admin privileges

-- First, make sure the user exists in auth.users (this should already exist)
-- Then add them to user_roles table

INSERT INTO public.user_roles (user_id, role) 
VALUES ('130f849a-d894-4ce6-a78e-0df3812093de', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also create a profile for this user if it doesn't exist
INSERT INTO public.profiles (id, full_name, phone, birth_date, created_at, updated_at)
VALUES (
  '130f849a-d894-4ce6-a78e-0df3812093de',
  'مدير النظام',
  '01000000000',
  '1990-01-01',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

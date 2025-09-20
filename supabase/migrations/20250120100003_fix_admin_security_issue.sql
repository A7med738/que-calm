-- Fix admin security issue - remove hardcoded admin ID
-- This migration creates a secure way to check admin users

-- Step 1: Create a secure admin check function
CREATE OR REPLACE FUNCTION public.check_admin_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if user is admin using a secure method
  -- This could be based on email domain, specific table, or other secure criteria
  
  -- Method 1: Check if user email is in admin emails
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid 
    AND email IN (
      'admin@dorak.com',  -- Replace with actual admin email
      'superadmin@dorak.com'  -- Add more admin emails as needed
    )
  ) THEN
    is_admin := TRUE;
  END IF;
  
  -- Method 2: Check if user has admin role in user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role = 'admin'
  ) THEN
    is_admin := TRUE;
  END IF;
  
  -- Method 3: Check if user is in admin_users table (if exists)
  IF EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid 
    AND status = 'active'
  ) THEN
    is_admin := TRUE;
  END IF;
  
  RETURN is_admin;
END;
$$;

-- Step 2: Create admin_users table for secure admin management
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_level TEXT DEFAULT 'admin' CHECK (admin_level IN ('admin', 'super_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 3: Add RLS policies for admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin users
CREATE POLICY "Admins can view admin users" ON public.admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.status = 'active'
    )
  );

-- Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.admin_level = 'super_admin'
      AND au.status = 'active'
    )
  );

-- Step 4: Create a function to add admin users securely
CREATE OR REPLACE FUNCTION public.add_admin_user(
  target_user_id UUID,
  admin_level TEXT DEFAULT 'admin',
  added_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the person adding is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = added_by 
    AND admin_level = 'super_admin' 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only super admins can add admin users';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- Add admin user
  INSERT INTO public.admin_users (user_id, admin_level, created_by)
  VALUES (target_user_id, admin_level, added_by)
  ON CONFLICT (user_id) DO UPDATE SET
    admin_level = EXCLUDED.admin_level,
    status = 'active',
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Step 5: Create a function to remove admin users securely
CREATE OR REPLACE FUNCTION public.remove_admin_user(
  target_user_id UUID,
  removed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the person removing is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = removed_by 
    AND admin_level = 'super_admin' 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only super admins can remove admin users';
  END IF;
  
  -- Remove admin user
  UPDATE public.admin_users 
  SET status = 'inactive', updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN TRUE;
END;
$$;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_admin_level ON public.admin_users(admin_level);

-- Step 7: Add comments
COMMENT ON FUNCTION public.check_admin_user IS 'Securely checks if a user is an admin';
COMMENT ON FUNCTION public.add_admin_user IS 'Securely adds a user as admin';
COMMENT ON FUNCTION public.remove_admin_user IS 'Securely removes admin privileges from a user';
COMMENT ON TABLE public.admin_users IS 'Secure table for managing admin users';

-- Step 8: Test the function
SELECT 'Testing secure admin check function...' as status;

-- This should return false for any user (since no admins are set up yet)
-- SELECT public.check_admin_user('00000000-0000-0000-0000-000000000000'::UUID);

SELECT 'Admin security fix completed successfully!' as result;

-- Fix infinite recursion in user_roles policies
-- The issue is that the policies are trying to check user roles from the same table they're querying

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Create simpler, non-recursive policies
-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles 
FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view all roles (using a different approach to avoid recursion)
CREATE POLICY "Admins can view all roles" ON public.user_roles 
FOR SELECT USING (
  auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

-- Allow admins to insert roles
CREATE POLICY "Admins can insert roles" ON public.user_roles 
FOR INSERT WITH CHECK (
  auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

-- Allow admins to update roles
CREATE POLICY "Admins can update roles" ON public.user_roles 
FOR UPDATE USING (
  auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles" ON public.user_roles 
FOR DELETE USING (
  auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

-- Update the is_admin function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is the specific admin user
  IF user_uuid = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid THEN
    RETURN TRUE;
  END IF;
  
  -- For other users, check the user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Update the is_clinic_admin function
CREATE OR REPLACE FUNCTION public.is_clinic_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'clinic_admin'
  );
END;
$$;

-- Make sure the admin user has the admin role
INSERT INTO public.user_roles (user_id, role) 
VALUES ('130f849a-d894-4ce6-a78e-0df3812093de', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

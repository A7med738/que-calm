-- Ensure proper center ownership for RLS policies

-- Create a function to check if user can access a medical center
CREATE OR REPLACE FUNCTION public.can_access_medical_center(center_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  center_record RECORD;
BEGIN
  -- Get the medical center record
  SELECT * INTO center_record 
  FROM public.medical_centers 
  WHERE id = center_id;
  
  -- If center doesn't exist, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If user is admin, allow access
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- If center has no owner and user is authenticated, allow access (for first-time setup)
  IF center_record.owner_id IS NULL AND auth.uid() IS NOT NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If user is the owner, allow access
  IF center_record.owner_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise, deny access
  RETURN FALSE;
END;
$$;

-- Update services RLS policies to use the new function
DROP POLICY IF EXISTS "Center owners can manage their services" ON public.services;
DROP POLICY IF EXISTS "Allow service management for accessed centers" ON public.services;

-- Create new policy using the function
CREATE POLICY "Users can manage services for accessible centers" ON public.services
  FOR ALL USING (public.can_access_medical_center(medical_center_id));

-- Update medical_centers RLS policies to use the new function
DROP POLICY IF EXISTS "Center owners can manage their centers" ON public.medical_centers;

-- Create new policy using the function
CREATE POLICY "Users can manage accessible centers" ON public.medical_centers
  FOR ALL USING (public.can_access_medical_center(id));

-- Update clinic_images RLS policies to use the new function
DROP POLICY IF EXISTS "Center owners can manage their images" ON public.clinic_images;

-- Create new policy using the function
CREATE POLICY "Users can manage images for accessible centers" ON public.clinic_images
  FOR ALL USING (public.can_access_medical_center(medical_center_id));

-- Add comment
COMMENT ON FUNCTION public.can_access_medical_center IS 'Checks if the current user can access a specific medical center based on ownership and admin status';

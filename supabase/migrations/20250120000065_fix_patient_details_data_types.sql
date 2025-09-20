-- Fix data types in patient details functions
-- This migration fixes the data type mismatch error

-- Drop and recreate the functions with correct data types
DROP FUNCTION IF EXISTS public.get_patient_details(UUID);
DROP FUNCTION IF EXISTS public.get_multiple_patient_details(UUID[]);

-- Create function to get patient details with correct data types
CREATE OR REPLACE FUNCTION public.get_patient_details(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if the current user has access to this patient's data
  -- This ensures that only authorized medical centers can access patient details
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.medical_centers mc ON b.medical_center_id = mc.id
    WHERE b.patient_id = p_patient_id
    AND (mc.owner_id = auth.uid() OR mc.admin_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view this patient''s details';
  END IF;

  -- Return patient details from auth.users
  RETURN QUERY
  SELECT 
    au.id,
    au.email::VARCHAR(255) as email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email)::TEXT as full_name,
    COALESCE(au.raw_user_meta_data->>'phone', 'غير متوفر')::TEXT as phone,
    au.created_at
  FROM auth.users au
  WHERE au.id = p_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get multiple patient details with correct data types
CREATE OR REPLACE FUNCTION public.get_multiple_patient_details(p_patient_ids UUID[])
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if the current user has access to any of these patients' data
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.medical_centers mc ON b.medical_center_id = mc.id
    WHERE b.patient_id = ANY(p_patient_ids)
    AND (mc.owner_id = auth.uid() OR mc.admin_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view these patients'' details';
  END IF;

  -- Return patient details from auth.users
  RETURN QUERY
  SELECT 
    au.id,
    au.email::VARCHAR(255) as email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email)::TEXT as full_name,
    COALESCE(au.raw_user_meta_data->>'phone', 'غير متوفر')::TEXT as phone,
    au.created_at
  FROM auth.users au
  WHERE au.id = ANY(p_patient_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION public.get_patient_details(UUID) IS 'Gets patient details for authorized medical centers with correct data types';
COMMENT ON FUNCTION public.get_multiple_patient_details(UUID[]) IS 'Gets multiple patient details for authorized medical centers with correct data types';

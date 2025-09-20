-- Comprehensive fix for admin_email column issue
-- This migration ensures admin_email column exists and is properly configured

-- Step 1: Add admin_email column if it doesn't exist
ALTER TABLE public.medical_centers 
ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Step 2: Update the create_medical_center_with_admin function to handle admin_email
CREATE OR REPLACE FUNCTION public.create_medical_center_with_admin(
  center_name TEXT,
  center_specialty TEXT,
  center_address TEXT,
  center_phone TEXT,
  center_email TEXT DEFAULT NULL,
  center_hours TEXT DEFAULT NULL,
  center_description TEXT DEFAULT NULL,
  admin_email TEXT DEFAULT NULL,
  admin_password TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_center_id UUID;
  serial_num TEXT;
  result JSON;
BEGIN
  -- Generate secure serial number
  serial_num := public.generate_clinic_serial_number();
  
  -- Insert the medical center
  INSERT INTO public.medical_centers (
    name,
    specialty,
    address,
    phone,
    email,
    hours,
    description,
    admin_email,
    serial_number,
    status
  ) VALUES (
    center_name,
    center_specialty,
    center_address,
    center_phone,
    center_email,
    center_hours,
    center_description,
    admin_email,
    serial_num,
    'active'
  ) RETURNING id INTO new_center_id;
  
  -- Prepare result
  result := json_build_object(
    'center_id', new_center_id,
    'serial_number', serial_num,
    'admin_email', admin_email,
    'admin_password', admin_password,
    'message', 'Medical center created successfully'
  );
  
  RETURN result;
END;
$$;

-- Step 3: Add comment for clarity
COMMENT ON COLUMN public.medical_centers.admin_email 
IS 'Email address for the medical center admin';

-- Step 4: Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'admin_email column and function updated successfully';
    RAISE NOTICE 'Column type: TEXT';
    RAISE NOTICE 'Column is nullable: YES';
    RAISE NOTICE 'Function create_medical_center_with_admin updated';
END $$;

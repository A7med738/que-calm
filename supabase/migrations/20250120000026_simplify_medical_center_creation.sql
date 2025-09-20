-- Simplify medical center creation by removing user creation from the function

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.create_medical_center_with_admin(
  center_name TEXT,
  center_specialty TEXT,
  center_address TEXT,
  center_phone TEXT,
  center_email TEXT,
  center_hours TEXT,
  center_description TEXT,
  admin_email TEXT,
  admin_password TEXT
);

-- Create a simplified function that only creates the medical center
CREATE OR REPLACE FUNCTION public.create_medical_center_with_admin(
  center_name TEXT,
  center_specialty TEXT,
  center_address TEXT,
  center_phone TEXT,
  center_email TEXT,
  center_hours TEXT,
  center_description TEXT,
  admin_email TEXT,
  admin_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_center_id UUID;
  generated_serial TEXT;
  result JSON;
BEGIN
  -- Generate serial number
  generated_serial := public.generate_clinic_serial_number();
  
  -- Create medical center
  INSERT INTO public.medical_centers (
    name,
    specialty,
    address,
    phone,
    email,
    hours,
    description,
    serial_number,
    status,
    rating
  ) VALUES (
    center_name,
    center_specialty,
    center_address,
    center_phone,
    center_email,
    center_hours,
    center_description,
    generated_serial,
    'active',
    0
  ) RETURNING id INTO new_center_id;
  
  -- Return result with admin credentials for manual user creation
  result := json_build_object(
    'center_id', new_center_id,
    'serial_number', generated_serial,
    'admin_email', admin_email,
    'admin_password', admin_password,
    'message', 'Medical center created successfully. Admin user should be created manually through the application.'
  );
  
  RETURN result;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.create_medical_center_with_admin IS 'Creates a medical center and returns admin credentials for manual user creation';

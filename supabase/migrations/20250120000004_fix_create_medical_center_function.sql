-- Fix the create_medical_center_with_admin function to resolve serial_number ambiguity

CREATE OR REPLACE FUNCTION public.create_medical_center_with_admin(
  p_name TEXT,
  p_specialty TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_hours TEXT,
  p_description TEXT,
  p_admin_email TEXT DEFAULT NULL,
  p_admin_password TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_center_id UUID;
  new_admin_id UUID;
  generated_serial TEXT;
  result JSON;
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can create medical centers';
  END IF;
  
  -- Generate serial number
  generated_serial := public.generate_clinic_serial_number();
  
  -- Create the medical center
  INSERT INTO public.medical_centers (
    name, specialty, address, phone, email, hours, description, serial_number, status
  ) VALUES (
    p_name, p_specialty, p_address, p_phone, p_email, p_hours, p_description, generated_serial, 'active'
  ) RETURNING id INTO new_center_id;
  
  -- Create admin user (this would typically be done through Supabase Auth)
  -- For now, we'll just return the serial number and center ID
  -- The actual user creation should be handled by the frontend
  
  result := json_build_object(
    'center_id', new_center_id,
    'serial_number', generated_serial,
    'message', 'Medical center created successfully. Please create the admin user account.'
  );
  
  RETURN result;
END;
$$;

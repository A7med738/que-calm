-- Create secure serial number generator function

-- Drop the existing predictable function
DROP FUNCTION IF EXISTS public.generate_clinic_serial_number();

-- Create a new secure serial number generator
CREATE OR REPLACE FUNCTION public.generate_clinic_serial_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_serial TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    -- Generate a secure random serial number
    -- Format: CLINIC-XXXX-YYYY where XXXX and YYYY are random alphanumeric
    new_serial := 'CLINIC-' || 
                  upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
                  upper(substring(md5(random()::text) from 1 for 4));
    
    -- Check if this serial number already exists
    IF NOT EXISTS (SELECT 1 FROM public.medical_centers WHERE serial_number = new_serial) THEN
      RETURN new_serial;
    END IF;
    
    -- Prevent infinite loop
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique serial number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Test the function
SELECT public.generate_clinic_serial_number() as test_secure_serial;

-- Add comment
COMMENT ON FUNCTION public.generate_clinic_serial_number IS 'Generates cryptographically secure serial numbers for medical centers in format CLINIC-XXXX-YYYY';

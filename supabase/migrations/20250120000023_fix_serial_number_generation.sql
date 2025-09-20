-- Fix serial number generation function to handle text properly

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.generate_clinic_serial_number();

-- Create a new function that generates serial numbers properly
CREATE OR REPLACE FUNCTION public.generate_clinic_serial_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INT;
  generated_serial TEXT;
BEGIN
  -- Get the next number from the sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(serial_number FROM 'CLINIC(\d+)') AS INT)), 0) + 1
  INTO next_number
  FROM public.medical_centers
  WHERE serial_number ~ '^CLINIC\d+$';
  
  -- Generate the serial number
  generated_serial := 'CLINIC' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN generated_serial;
END;
$$;

-- Test the function
SELECT public.generate_clinic_serial_number() as test_serial;

-- Add comment
COMMENT ON FUNCTION public.generate_clinic_serial_number IS 'Generates unique serial numbers for medical centers in format CLINIC001, CLINIC002, etc.';

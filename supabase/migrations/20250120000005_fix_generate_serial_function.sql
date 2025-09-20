-- Fix the generate_clinic_serial_number function to resolve variable name conflict

CREATE OR REPLACE FUNCTION public.generate_clinic_serial_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INT;
  generated_serial TEXT;
BEGIN
  -- Get the next number in sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(serial_number FROM 3) AS INT)), 0) + 1
  INTO next_number
  FROM public.medical_centers
  WHERE serial_number ~ '^CLINIC[0-9]+$';
  
  -- Format as CLINIC + number with leading zeros
  generated_serial := 'CLINIC' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN generated_serial;
END;
$$;

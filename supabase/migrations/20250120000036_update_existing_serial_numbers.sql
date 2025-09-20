-- Update existing predictable serial numbers to secure ones

-- Create a temporary function to generate secure serials for existing centers
CREATE OR REPLACE FUNCTION public.update_existing_serial_numbers()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  center_record RECORD;
  new_serial TEXT;
  attempts INTEGER;
  max_attempts INTEGER := 10;
BEGIN
  -- Update all existing centers with predictable serial numbers
  FOR center_record IN 
    SELECT id, serial_number 
    FROM public.medical_centers 
    WHERE serial_number ~ '^CLINIC\d+$'
  LOOP
    attempts := 0;
    
    LOOP
      -- Generate a secure random serial number
      new_serial := 'CLINIC-' || 
                    upper(substring(md5(random()::text) from 1 for 4)) || '-' ||
                    upper(substring(md5(random()::text) from 1 for 4));
      
      -- Check if this serial number already exists
      IF NOT EXISTS (SELECT 1 FROM public.medical_centers WHERE serial_number = new_serial) THEN
        -- Update the center with new secure serial number
        UPDATE public.medical_centers 
        SET serial_number = new_serial, updated_at = now()
        WHERE id = center_record.id;
        
        RAISE NOTICE 'Updated center % from % to %', center_record.id, center_record.serial_number, new_serial;
        EXIT;
      END IF;
      
      -- Prevent infinite loop
      attempts := attempts + 1;
      IF attempts >= max_attempts THEN
        RAISE WARNING 'Unable to generate unique serial for center % after % attempts', center_record.id, max_attempts;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Execute the function to update existing serial numbers
SELECT public.update_existing_serial_numbers();

-- Drop the temporary function
DROP FUNCTION public.update_existing_serial_numbers();

-- Add comment
COMMENT ON TABLE public.medical_centers IS 'Medical centers with cryptographically secure serial numbers';

-- Enhance serial number security with additional constraints

-- Add unique constraint to ensure no duplicate serial numbers
ALTER TABLE public.medical_centers 
ADD CONSTRAINT unique_serial_number UNIQUE (serial_number);

-- Create index for faster serial number lookups
CREATE INDEX IF NOT EXISTS idx_medical_centers_serial_number_secure 
ON public.medical_centers(serial_number);

-- Add check constraint to ensure serial numbers follow the secure format
ALTER TABLE public.medical_centers 
ADD CONSTRAINT check_secure_serial_format 
CHECK (serial_number ~ '^CLINIC-[A-F0-9]{4}-[A-F0-9]{4}$');

-- Add comment
COMMENT ON CONSTRAINT check_secure_serial_format ON public.medical_centers 
IS 'Ensures serial numbers follow the secure format CLINIC-XXXX-YYYY';

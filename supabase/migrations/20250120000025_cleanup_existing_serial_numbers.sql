-- Clean up existing serial numbers to ensure they follow the correct format

-- Create a temporary table with row numbers for updating
CREATE TEMP TABLE temp_medical_centers AS
SELECT 
  id,
  'CLINIC' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0') as new_serial_number
FROM public.medical_centers
WHERE serial_number IS NULL 
   OR serial_number = '' 
   OR serial_number !~ '^CLINIC\d+$';

-- Update medical centers with new serial numbers
UPDATE public.medical_centers 
SET serial_number = temp_medical_centers.new_serial_number
FROM temp_medical_centers
WHERE public.medical_centers.id = temp_medical_centers.id;

-- Clean up temporary table
DROP TABLE temp_medical_centers;

-- Add comment
COMMENT ON TABLE public.medical_centers IS 'Medical centers table with properly formatted serial numbers';

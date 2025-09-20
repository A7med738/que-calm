-- Remove clinic_images table and all related functionality

-- Drop the clinic_images table if it exists
DROP TABLE IF EXISTS public.clinic_images CASCADE;

-- Drop any related functions or triggers
DROP FUNCTION IF EXISTS public.audit_trigger_for_clinic_images() CASCADE;

-- Add comment
COMMENT ON SCHEMA public IS 'Clinic images functionality has been completely removed';

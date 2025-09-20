-- Comprehensive fix for medical center deletion issues
-- This migration addresses all foreign key constraint problems

-- Step 1: Fix audit_logs foreign key constraint
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL;

-- Step 2: Fix all other foreign key constraints with CASCADE DELETE

-- Fix bookings table
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_medical_center_id_fkey;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Fix services table
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_medical_center_id_fkey;

ALTER TABLE public.services 
ADD CONSTRAINT services_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Fix doctors table
ALTER TABLE public.doctors 
DROP CONSTRAINT IF EXISTS doctors_medical_center_id_fkey;

ALTER TABLE public.doctors 
ADD CONSTRAINT doctors_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Fix reviews table
ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_medical_center_id_fkey;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Fix favorites table
ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_medical_center_id_fkey;

ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Step 3: Fix queue_tracking table (if it has medical_center_id)
-- First check if the column exists and add it if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'queue_tracking' 
        AND column_name = 'medical_center_id'
    ) THEN
        ALTER TABLE public.queue_tracking 
        ADD COLUMN medical_center_id UUID REFERENCES public.medical_centers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Add comments for documentation
COMMENT ON CONSTRAINT audit_logs_medical_center_id_fkey ON public.audit_logs 
IS 'Foreign key constraint that allows medical center deletion by setting medical_center_id to NULL';

COMMENT ON CONSTRAINT bookings_medical_center_id_fkey ON public.bookings 
IS 'Foreign key constraint with CASCADE DELETE for medical center deletion';

COMMENT ON CONSTRAINT services_medical_center_id_fkey ON public.services 
IS 'Foreign key constraint with CASCADE DELETE for medical center deletion';

COMMENT ON CONSTRAINT doctors_medical_center_id_fkey ON public.doctors 
IS 'Foreign key constraint with CASCADE DELETE for medical center deletion';

COMMENT ON CONSTRAINT reviews_medical_center_id_fkey ON public.reviews 
IS 'Foreign key constraint with CASCADE DELETE for medical center deletion';

COMMENT ON CONSTRAINT favorites_medical_center_id_fkey ON public.favorites 
IS 'Foreign key constraint with CASCADE DELETE for medical center deletion';

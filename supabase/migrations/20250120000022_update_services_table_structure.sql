-- Update services table structure to match the new interface

-- Remove duration_minutes column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'services' AND column_name = 'duration_minutes') THEN
        ALTER TABLE public.services DROP COLUMN duration_minutes;
    END IF;
END $$;

-- Remove doctor_id column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'services' AND column_name = 'doctor_id') THEN
        ALTER TABLE public.services DROP COLUMN doctor_id;
    END IF;
END $$;

-- Add doctor_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'doctor_name') THEN
        ALTER TABLE public.services ADD COLUMN doctor_name TEXT;
    END IF;
END $$;

-- Add doctor_specialty column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'doctor_specialty') THEN
        ALTER TABLE public.services ADD COLUMN doctor_specialty TEXT;
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'is_active') THEN
        ALTER TABLE public.services ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update existing records to set is_active based on status
UPDATE public.services 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

-- Make is_active NOT NULL after updating existing records
ALTER TABLE public.services 
ALTER COLUMN is_active SET NOT NULL;

-- Create index for is_active column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- Add comment
COMMENT ON TABLE public.services IS 'Services table with doctor_name, doctor_specialty, and is_active columns';

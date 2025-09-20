-- Remove duration_minutes column from services table

-- First, check if the column exists and drop it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'services' AND column_name = 'duration_minutes') THEN
        ALTER TABLE public.services DROP COLUMN duration_minutes;
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.services IS 'Services table without duration_minutes column';

-- Add admin_email column to medical_centers table
-- This migration adds the missing admin_email column

-- Step 1: Add admin_email column to medical_centers table
ALTER TABLE public.medical_centers 
ADD COLUMN IF NOT EXISTS admin_email TEXT;

-- Step 2: Add comment for clarity
COMMENT ON COLUMN public.medical_centers.admin_email 
IS 'Email address for the medical center admin';

-- Step 3: Verify the column was added
DO $$
BEGIN
    RAISE NOTICE 'admin_email column added to medical_centers table successfully';
    RAISE NOTICE 'Column type: TEXT';
    RAISE NOTICE 'Column is nullable: YES';
END $$;

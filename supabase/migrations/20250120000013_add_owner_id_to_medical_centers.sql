-- Add owner_id column to medical_centers table for secure ownership

-- Add owner_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_centers' AND column_name = 'owner_id') THEN
        ALTER TABLE public.medical_centers ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for owner_id column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_medical_centers_owner_id ON public.medical_centers(owner_id);

-- Add a comment
COMMENT ON COLUMN public.medical_centers.owner_id IS 'Owner user ID for this medical center. Used for secure RLS policies.';

-- Update existing medical centers to have no owner initially (they will be assigned when first accessed)
UPDATE public.medical_centers 
SET owner_id = NULL 
WHERE owner_id IS NULL;

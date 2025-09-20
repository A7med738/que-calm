-- Ensure admin_id column exists in medical_centers table

-- Add admin_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_centers' AND column_name = 'admin_id') THEN
        ALTER TABLE public.medical_centers ADD COLUMN admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for admin_id column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_medical_centers_admin_id ON public.medical_centers(admin_id);

-- Add a comment
COMMENT ON COLUMN public.medical_centers.admin_id IS 'Admin user ID for this medical center. Used for RLS policies.';

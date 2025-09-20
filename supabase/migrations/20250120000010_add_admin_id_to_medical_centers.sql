-- Add admin_id column to medical_centers table if it doesn't exist

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

-- Update RLS policies for medical_centers to include admin_id
DROP POLICY IF EXISTS "Users can view medical centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Clinic admins can manage their centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Admins can manage all medical centers" ON public.medical_centers;

-- Create new policies for medical_centers
CREATE POLICY "Users can view active medical centers" ON public.medical_centers
  FOR SELECT USING (status = 'active');

CREATE POLICY "Clinic admins can manage their centers" ON public.medical_centers
  FOR ALL USING (admin_id = auth.uid());

CREATE POLICY "Admins can manage all medical centers" ON public.medical_centers
  FOR ALL USING (public.is_admin());

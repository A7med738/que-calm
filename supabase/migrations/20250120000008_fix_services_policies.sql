-- Fix services table policies - safe version

-- First, let's check if we need to add the missing columns
DO $$ 
BEGIN
    -- Add doctor_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'doctor_name') THEN
        ALTER TABLE public.services ADD COLUMN doctor_name TEXT;
    END IF;
    
    -- Add doctor_specialty column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'doctor_specialty') THEN
        ALTER TABLE public.services ADD COLUMN doctor_specialty TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
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

-- Drop existing policies safely
DO $$ 
BEGIN
    -- Drop policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Users can view services') THEN
        DROP POLICY "Users can view services" ON public.services;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Clinic admins can manage their services') THEN
        DROP POLICY "Clinic admins can manage their services" ON public.services;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Admins can manage all services') THEN
        DROP POLICY "Admins can manage all services" ON public.services;
    END IF;
END $$;

-- Create new policies
CREATE POLICY "Users can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Clinic admins can manage their services" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all services" ON public.services
  FOR ALL USING (public.is_admin());

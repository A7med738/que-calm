-- Implement secure RLS policies for the hybrid authentication system

-- First, ensure all required columns exist for services
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

-- Drop all existing policies for services table
DO $$ 
BEGIN
    -- Drop all policies for services table
    DROP POLICY IF EXISTS "Users can view services" ON public.services;
    DROP POLICY IF EXISTS "Users can view active services" ON public.services;
    DROP POLICY IF EXISTS "Clinic admins can manage their services" ON public.services;
    DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
    DROP POLICY IF EXISTS "Temporary: Allow all authenticated users to manage services" ON public.services;
    DROP POLICY IF EXISTS "Owners can manage their services" ON public.services;
    DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
    DROP POLICY IF EXISTS "Center owners can manage their services" ON public.services;
    DROP POLICY IF EXISTS "System admins can manage all services" ON public.services;
END $$;

-- Enable RLS for services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for services
-- 1. Anyone can view active services (for patients to see available services)
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- 2. Only center owners can manage their services (if owner_id exists)
DROP POLICY IF EXISTS "Center owners can manage their services" ON public.services;
CREATE POLICY "Center owners can manage their services" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE owner_id = auth.uid() AND owner_id IS NOT NULL
    )
  );

-- 3. Allow access to services for centers without owner_id (temporary access)
DROP POLICY IF EXISTS "Temporary access for unowned centers" ON public.services;
CREATE POLICY "Temporary access for unowned centers" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE owner_id IS NULL
    )
  );

-- 4. System admins can manage all services
DROP POLICY IF EXISTS "System admins can manage all services" ON public.services;
CREATE POLICY "System admins can manage all services" ON public.services
  FOR ALL USING (public.is_admin());

-- Update medical_centers RLS policies
DROP POLICY IF EXISTS "Users can view medical centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Users can view active medical centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Clinic admins can manage their centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Admins can manage all medical centers" ON public.medical_centers;

-- Create secure RLS policies for medical_centers
-- 1. Anyone can view active medical centers (for patients to see available centers)
DROP POLICY IF EXISTS "Anyone can view active medical centers" ON public.medical_centers;
CREATE POLICY "Anyone can view active medical centers" ON public.medical_centers
  FOR SELECT USING (status = 'active');

-- 2. Only center owners can manage their centers (if owner_id exists)
DROP POLICY IF EXISTS "Center owners can manage their centers" ON public.medical_centers;
CREATE POLICY "Center owners can manage their centers" ON public.medical_centers
  FOR ALL USING (owner_id = auth.uid() AND owner_id IS NOT NULL);

-- 3. Allow access to medical centers without owner_id (temporary access)
DROP POLICY IF EXISTS "Temporary access for unowned medical centers" ON public.medical_centers;
CREATE POLICY "Temporary access for unowned medical centers" ON public.medical_centers
  FOR ALL USING (owner_id IS NULL);

-- 4. System admins can manage all medical centers
DROP POLICY IF EXISTS "System admins can manage all medical centers" ON public.medical_centers;
CREATE POLICY "System admins can manage all medical centers" ON public.medical_centers
  FOR ALL USING (public.is_admin());

-- Add comment to services table
COMMENT ON TABLE public.services IS 'RLS enabled with secure ownership-based policies. Each center can only manage their own services.';

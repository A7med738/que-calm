-- Update services table to add missing fields for clinic management

-- Add new columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_specialty TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records to set is_active based on status
UPDATE public.services 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

-- Make is_active NOT NULL after updating existing records
ALTER TABLE public.services 
ALTER COLUMN is_active SET NOT NULL;

-- Create index for is_active column
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- Update RLS policies for services to allow clinic admins to manage their services
DROP POLICY IF EXISTS "Users can view services" ON public.services;
DROP POLICY IF EXISTS "Clinic admins can manage their services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;

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

-- Update RLS policies for maximum security

-- Drop existing policies that allow unowned centers
DROP POLICY IF EXISTS "Temporary access for unowned centers" ON public.services;
DROP POLICY IF EXISTS "Temporary access for unowned medical centers" ON public.medical_centers;

-- Update services policies for maximum security
-- 1. Anyone can view active services (for patients)
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- 2. Only center owners can manage their services (strict security)
DROP POLICY IF EXISTS "Center owners can manage their services" ON public.services;
CREATE POLICY "Center owners can manage their services" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE owner_id = auth.uid() AND owner_id IS NOT NULL
    )
  );

-- 3. System admins can manage all services
DROP POLICY IF EXISTS "System admins can manage all services" ON public.services;
CREATE POLICY "System admins can manage all services" ON public.services
  FOR ALL USING (public.is_admin());

-- Update medical_centers policies for maximum security
-- 1. Anyone can view active medical centers (for patients)
DROP POLICY IF EXISTS "Anyone can view active medical centers" ON public.medical_centers;
CREATE POLICY "Anyone can view active medical centers" ON public.medical_centers
  FOR SELECT USING (status = 'active');

-- 2. Only center owners can manage their centers (strict security)
DROP POLICY IF EXISTS "Center owners can manage their centers" ON public.medical_centers;
CREATE POLICY "Center owners can manage their centers" ON public.medical_centers
  FOR ALL USING (owner_id = auth.uid() AND owner_id IS NOT NULL);

-- 3. System admins can manage all medical centers
DROP POLICY IF EXISTS "System admins can manage all medical centers" ON public.medical_centers;
CREATE POLICY "System admins can manage all medical centers" ON public.medical_centers
  FOR ALL USING (public.is_admin());

-- Update clinic_images policies for maximum security
-- 1. Anyone can view clinic images (for patients)
DROP POLICY IF EXISTS "Clinic images are viewable by all" ON public.clinic_images;
CREATE POLICY "Clinic images are viewable by all" ON public.clinic_images
  FOR SELECT USING (true);

-- 2. Only center owners can manage their images (strict security)
DROP POLICY IF EXISTS "Clinic admins can manage their images" ON public.clinic_images;
CREATE POLICY "Center owners can manage their images" ON public.clinic_images
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE owner_id = auth.uid() AND owner_id IS NOT NULL
    )
  );

-- 3. System admins can manage all clinic images
DROP POLICY IF EXISTS "System admins can manage all clinic images" ON public.clinic_images;
CREATE POLICY "System admins can manage all clinic images" ON public.clinic_images
  FOR ALL USING (public.is_admin());

-- Add comments
COMMENT ON TABLE public.services IS 'RLS enabled with maximum security. Only center owners and admins can manage services.';
COMMENT ON TABLE public.medical_centers IS 'RLS enabled with maximum security. Only center owners and admins can manage centers.';
COMMENT ON TABLE public.clinic_images IS 'RLS enabled with maximum security. Only center owners and admins can manage images.';

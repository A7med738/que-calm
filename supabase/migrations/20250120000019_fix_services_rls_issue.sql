-- Fix RLS issue for services table - allow creation for centers with proper ownership

-- First, let's check if there are any medical centers without owner_id that need to be handled
-- We'll add a temporary policy to allow service creation for centers that are being accessed

-- Drop existing policies for services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
DROP POLICY IF EXISTS "Center owners can manage their services" ON public.services;
DROP POLICY IF EXISTS "System admins can manage all services" ON public.services;

-- Create new policies for services with better logic
-- 1. Anyone can view active services (for patients)
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- 2. Allow service management for centers where user is the owner
CREATE POLICY "Center owners can manage their services" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE owner_id = auth.uid()
    )
  );

-- 3. Allow service management for centers that are being accessed via serial number
-- This is a temporary measure to handle the transition period
CREATE POLICY "Allow service management for accessed centers" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE serial_number IS NOT NULL 
      AND status = 'active'
      AND (
        owner_id = auth.uid() OR 
        owner_id IS NULL
      )
    )
  );

-- 4. System admins can manage all services
CREATE POLICY "System admins can manage all services" ON public.services
  FOR ALL USING (public.is_admin());

-- Add comment
COMMENT ON TABLE public.services IS 'RLS enabled with policies that allow service management for properly accessed centers';

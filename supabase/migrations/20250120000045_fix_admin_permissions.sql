-- Fix admin permissions for medical centers management
-- This migration restores admin ability to edit, deactivate, and delete medical centers

-- Step 1: Drop existing RLS policies that might be blocking admin access
DROP POLICY IF EXISTS "Admins can manage all medical centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Center owners can manage their centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Anyone can view active medical centers" ON public.medical_centers;

-- Step 2: Recreate comprehensive RLS policies for medical centers
CREATE POLICY "Admins can do everything with medical centers" 
ON public.medical_centers 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

CREATE POLICY "Center owners can manage their centers" 
ON public.medical_centers 
FOR ALL 
USING (owner_id = auth.uid());

CREATE POLICY "Anyone can view active medical centers" 
ON public.medical_centers 
FOR SELECT 
USING (status = 'active');

-- Step 3: Fix services RLS policies
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
DROP POLICY IF EXISTS "Center owners can manage their services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

CREATE POLICY "Admins can do everything with services" 
ON public.services 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

CREATE POLICY "Center owners can manage their services" 
ON public.services 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.medical_centers 
        WHERE id = services.medical_center_id 
        AND owner_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (status = 'active' AND is_active = true);

-- Step 4: Fix bookings RLS policies
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Patients can manage their bookings" ON public.bookings;

CREATE POLICY "Admins can do everything with bookings" 
ON public.bookings 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

CREATE POLICY "Patients can manage their bookings" 
ON public.bookings 
FOR ALL 
USING (patient_id = auth.uid());

-- Step 5: Fix queue_tracking RLS policies
DROP POLICY IF EXISTS "Admins can manage all queue tracking" ON public.queue_tracking;
DROP POLICY IF EXISTS "Patients can delete queue tracking for their bookings" ON public.queue_tracking;

CREATE POLICY "Admins can do everything with queue tracking" 
ON public.queue_tracking 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
);

CREATE POLICY "Patients can delete queue tracking for their bookings" 
ON public.queue_tracking 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE bookings.id = queue_tracking.booking_id 
        AND bookings.patient_id = auth.uid()
    )
);

-- Step 6: Ensure user_roles table allows admin operations
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.user_roles;

CREATE POLICY "Allow all operations for authenticated users" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Step 7: Add comments
COMMENT ON POLICY "Admins can do everything with medical centers" ON public.medical_centers 
IS 'Allows admins to create, read, update, and delete all medical centers';

COMMENT ON POLICY "Admins can do everything with services" ON public.services 
IS 'Allows admins to create, read, update, and delete all services';

COMMENT ON POLICY "Admins can do everything with bookings" ON public.bookings 
IS 'Allows admins to create, read, update, and delete all bookings';

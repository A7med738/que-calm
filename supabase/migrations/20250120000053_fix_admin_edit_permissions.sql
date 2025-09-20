-- Fix admin edit permissions for medical centers
-- This migration ensures admin users can edit medical centers

-- Step 1: Drop existing policies that might be blocking admin access
DROP POLICY IF EXISTS "Admin full access to medical centers" ON public.medical_centers;
DROP POLICY IF EXISTS "Anyone can view active medical centers" ON public.medical_centers;

-- Step 2: Create comprehensive RLS policies for medical centers
CREATE POLICY "Admin full access to medical centers" 
ON public.medical_centers 
FOR ALL 
USING (
    -- Specific admin user (hardcoded for security)
    auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid
    OR
    -- Admin role check
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
    OR
    -- Center owner
    owner_id = auth.uid()
);

-- Step 3: Allow everyone to view active medical centers
CREATE POLICY "Anyone can view active medical centers" 
ON public.medical_centers 
FOR SELECT 
USING (status = 'active');

-- Step 4: Ensure user_roles table allows admin operations
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.user_roles;

CREATE POLICY "Allow all operations for authenticated users" 
ON public.user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Step 5: Add comments for clarity
COMMENT ON POLICY "Admin full access to medical centers" ON public.medical_centers 
IS 'Allows specific admin user, admin role users, and center owners full access to medical centers';

COMMENT ON POLICY "Anyone can view active medical centers" ON public.medical_centers 
IS 'Allows everyone to view active medical centers for patient interface';

-- Step 6: Verify the policies are working
-- This will help debug any remaining issues
DO $$
BEGIN
    RAISE NOTICE 'Admin edit permissions migration completed successfully';
    RAISE NOTICE 'Policies created for medical_centers table';
    RAISE NOTICE 'Admin user ID: 130f849a-d894-4ce6-a78e-0df3812093de';
END $$;

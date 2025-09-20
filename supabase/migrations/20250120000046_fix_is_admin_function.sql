-- Fix the is_admin function to ensure it works correctly
-- This ensures admin permissions are properly recognized

-- Drop all existing is_admin functions with different signatures
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create the is_admin function with explicit signature
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is the specific admin user
    IF auth.uid() = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has admin role in user_roles table
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.is_admin() 
IS 'Checks if the current user is an admin (either specific admin user or has admin role)';

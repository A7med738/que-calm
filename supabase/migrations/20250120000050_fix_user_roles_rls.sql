-- Fix user_roles RLS policies to prevent 406 errors for regular users
-- This ensures all users can access user_roles table without errors

-- Step 1: Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.user_roles;

-- Step 2: Disable RLS temporarily to fix the issue
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS with proper policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple and permissive RLS policies
CREATE POLICY "Allow authenticated users to read user_roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert user_roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update user_roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete user_roles" 
ON public.user_roles 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Step 5: Add comment
COMMENT ON TABLE public.user_roles 
IS 'User roles table with permissive RLS policies to prevent 406 errors';

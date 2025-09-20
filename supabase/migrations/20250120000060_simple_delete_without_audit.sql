-- Simple delete function without audit logging to avoid column issues
-- This migration provides a simple solution that just deletes the medical center

-- Step 1: Drop existing function
DROP FUNCTION IF EXISTS public.safe_delete_medical_center(uuid);

-- Step 2: Create a simple delete function without audit logging
CREATE FUNCTION public.safe_delete_medical_center(center_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simply delete the medical center
  -- The foreign key constraint ON DELETE SET NULL will handle audit_logs
  DELETE FROM public.medical_centers WHERE id = center_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.safe_delete_medical_center(uuid) TO authenticated;

-- Step 4: Add comment
COMMENT ON FUNCTION public.safe_delete_medical_center(uuid) 
IS 'Simple function to delete a medical center without audit logging';

-- Step 5: Success message
DO $$
BEGIN
    RAISE NOTICE 'Simple delete function created successfully';
    RAISE NOTICE 'Function safe_delete_medical_center created without audit logging';
    RAISE NOTICE 'Foreign key constraint will handle audit_logs automatically';
END $$;

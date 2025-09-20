-- Fix audit_logs column names in safe_delete_medical_center function
-- This migration fixes the column name mismatch in the delete function

-- Step 1: Drop existing function
DROP FUNCTION IF EXISTS public.safe_delete_medical_center(uuid);

-- Step 2: Create the corrected function with proper column names
CREATE FUNCTION public.safe_delete_medical_center(center_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  center_name TEXT;
BEGIN
  -- Get center name for audit log
  SELECT name INTO center_name 
  FROM public.medical_centers 
  WHERE id = center_id;
  
  -- Log the deletion attempt before deleting
  INSERT INTO public.audit_logs (
    table_name,
    action,
    record_id,
    old_values,
    new_values,
    user_id,
    medical_center_id,
    created_at
  ) VALUES (
    'medical_centers',
    'DELETE',
    center_id,
    json_build_object('name', center_name),
    NULL,
    auth.uid(),
    center_id,
    now()
  );
  
  -- Delete the medical center
  DELETE FROM public.medical_centers WHERE id = center_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.audit_logs (
      table_name,
      action,
      record_id,
      old_values,
      new_values,
      user_id,
      medical_center_id,
      created_at
    ) VALUES (
      'medical_centers',
      'DELETE_ERROR',
      center_id,
      json_build_object('error', SQLERRM),
      NULL,
      auth.uid(),
      center_id,
      now()
    );
    
    RAISE;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.safe_delete_medical_center(uuid) TO authenticated;

-- Step 4: Add comment
COMMENT ON FUNCTION public.safe_delete_medical_center(uuid) 
IS 'Safely deletes a medical center with proper audit logging using correct column names';

-- Step 5: Success message
DO $$
BEGIN
    RAISE NOTICE 'Audit logs column names fixed successfully';
    RAISE NOTICE 'Function safe_delete_medical_center updated with correct column names';
    RAISE NOTICE 'Using action instead of operation, old_values instead of old_data, etc.';
END $$;

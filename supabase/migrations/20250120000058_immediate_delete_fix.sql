-- Immediate fix for medical center deletion issue
-- This migration provides the most direct solution

-- Step 1: Drop all existing functions with this name
DROP FUNCTION IF EXISTS public.safe_delete_medical_center(UUID);
DROP FUNCTION IF EXISTS public.safe_delete_medical_center(uuid);

-- Step 2: Fix the foreign key constraint immediately
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL;

-- Step 3: Create the function with explicit parameter type
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
    operation,
    record_id,
    old_data,
    new_data,
    user_id,
    medical_center_id,
    timestamp
  ) VALUES (
    'medical_centers',
    'DELETE',
    center_id::TEXT,
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
      operation,
      record_id,
      old_data,
      new_data,
      user_id,
      medical_center_id,
      timestamp
    ) VALUES (
      'medical_centers',
      'DELETE_ERROR',
      center_id::TEXT,
      json_build_object('error', SQLERRM),
      NULL,
      auth.uid(),
      center_id,
      now()
    );
    
    RAISE;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.safe_delete_medical_center(uuid) TO authenticated;

-- Step 5: Add comment
COMMENT ON FUNCTION public.safe_delete_medical_center(uuid) 
IS 'Safely deletes a medical center with proper audit logging';

-- Step 6: Success message
DO $$
BEGIN
    RAISE NOTICE 'Immediate delete fix completed successfully';
    RAISE NOTICE 'Function safe_delete_medical_center created with uuid parameter';
    RAISE NOTICE 'Foreign key constraint fixed with ON DELETE SET NULL';
END $$;

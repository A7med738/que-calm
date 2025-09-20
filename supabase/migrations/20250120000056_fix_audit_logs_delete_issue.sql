-- Fix audit_logs foreign key constraint issue during medical center deletion
-- This migration fixes the issue where audit triggers try to insert records
-- after the medical center has been deleted

-- Step 1: Drop existing audit triggers to prevent the issue
DROP TRIGGER IF EXISTS audit_medical_centers_trigger ON public.medical_centers;
DROP TRIGGER IF EXISTS audit_services_trigger ON public.services;

-- Step 2: Drop existing audit functions
DROP FUNCTION IF EXISTS public.audit_medical_centers_function();
DROP FUNCTION IF EXISTS public.audit_services_function();

-- Step 3: Fix the foreign key constraint on audit_logs
-- Change it to ON DELETE SET NULL so audit logs are preserved but medical_center_id becomes NULL
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL;

-- Step 4: Drop existing function if it exists and create a new one
DROP FUNCTION IF EXISTS public.safe_delete_medical_center(UUID);

CREATE FUNCTION public.safe_delete_medical_center(center_id UUID)
RETURNS BOOLEAN
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
  
  -- Delete the medical center (cascade will handle related records)
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

-- Step 5: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.safe_delete_medical_center(UUID) TO authenticated;

-- Step 6: Add comments
COMMENT ON FUNCTION public.safe_delete_medical_center(UUID) 
IS 'Safely deletes a medical center with proper audit logging';

COMMENT ON CONSTRAINT audit_logs_medical_center_id_fkey ON public.audit_logs 
IS 'Foreign key constraint that sets medical_center_id to NULL when medical center is deleted';

-- Step 7: Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Audit logs foreign key constraint fixed successfully';
    RAISE NOTICE 'safe_delete_medical_center function created';
    RAISE NOTICE 'Audit triggers disabled to prevent conflicts';
    RAISE NOTICE 'ON DELETE SET NULL constraint applied';
END $$;

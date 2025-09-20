-- Fix foreign key constraints in audit_logs to allow medical center deletion

-- Drop existing foreign key constraint
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

-- Recreate the constraint with ON DELETE SET NULL
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT audit_logs_medical_center_id_fkey ON public.audit_logs 
IS 'Foreign key constraint that allows medical center deletion by setting medical_center_id to NULL';

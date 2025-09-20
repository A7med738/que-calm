-- Fix audit trigger issue that prevents medical center deletion
-- The problem is that audit triggers try to insert records with deleted medical_center_id

-- Step 1: Drop existing audit triggers that might cause issues
DROP TRIGGER IF EXISTS audit_trigger_for_medical_centers ON public.medical_centers;

-- Step 2: Fix the audit_logs foreign key constraint to be more permissive
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

-- Step 3: Make medical_center_id nullable and remove the foreign key constraint temporarily
ALTER TABLE public.audit_logs 
ALTER COLUMN medical_center_id DROP NOT NULL;

-- Step 4: Add a new foreign key constraint that allows NULL values
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Step 5: Recreate the audit trigger with proper handling
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only insert audit log if the record still exists or if it's a DELETE operation
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            OLD.id::TEXT,
            to_jsonb(OLD),
            NULL,
            '127.0.0.1',
            'System'
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id::TEXT,
            NULL,
            to_jsonb(NEW),
            '127.0.0.1',
            'System'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values,
            ip_address,
            user_agent
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id::TEXT,
            to_jsonb(OLD),
            to_jsonb(NEW),
            '127.0.0.1',
            'System'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 6: Recreate the trigger
CREATE TRIGGER audit_trigger_for_medical_centers
    AFTER INSERT OR UPDATE OR DELETE ON public.medical_centers
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Step 7: Ensure all other foreign key constraints are properly set
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_medical_center_id_fkey;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_medical_center_id_fkey;

ALTER TABLE public.services 
ADD CONSTRAINT services_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.doctors 
DROP CONSTRAINT IF EXISTS doctors_medical_center_id_fkey;

ALTER TABLE public.doctors 
ADD CONSTRAINT doctors_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_medical_center_id_fkey;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_medical_center_id_fkey;

ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Add comments
COMMENT ON FUNCTION public.audit_trigger_function() 
IS 'Audit trigger function that properly handles DELETE operations without foreign key conflicts';

COMMENT ON CONSTRAINT audit_logs_medical_center_id_fkey ON public.audit_logs 
IS 'Foreign key constraint that allows NULL values and sets medical_center_id to NULL on delete';

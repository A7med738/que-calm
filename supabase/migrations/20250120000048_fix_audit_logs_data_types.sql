-- Fix audit_logs data types to prevent type conflicts
-- The issue is that record_id is UUID but audit triggers try to insert TEXT

-- Step 1: Check current audit_logs table structure
-- First, let's see what columns exist and their types

-- Step 2: Fix the audit_logs table structure
-- Make record_id accept both UUID and TEXT by changing it to TEXT
ALTER TABLE public.audit_logs 
ALTER COLUMN record_id TYPE TEXT;

-- Step 3: Drop existing audit triggers that might cause issues
DROP TRIGGER IF EXISTS audit_trigger_for_medical_centers ON public.medical_centers;
DROP TRIGGER IF EXISTS audit_trigger_for_services ON public.services;

-- Step 4: Create a simple audit trigger function that handles types correctly
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only log if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Handle different operations
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
            OLD.id::TEXT,  -- Convert UUID to TEXT
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
            NEW.id::TEXT,  -- Convert UUID to TEXT
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
            NEW.id::TEXT,  -- Convert UUID to TEXT
            to_jsonb(OLD),
            to_jsonb(NEW),
            '127.0.0.1',
            'System'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 5: Recreate the audit triggers
CREATE TRIGGER audit_trigger_for_medical_centers
    AFTER INSERT OR UPDATE OR DELETE ON public.medical_centers
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_trigger_for_services
    AFTER INSERT OR UPDATE OR DELETE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Step 6: Add comment
COMMENT ON FUNCTION public.audit_trigger_function() 
IS 'Audit trigger function that properly handles UUID to TEXT conversion for record_id';

COMMENT ON COLUMN public.audit_logs.record_id 
IS 'Record ID as TEXT to handle both UUID and string identifiers';

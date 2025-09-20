-- Create a safe function to delete medical centers
-- This function handles all related data deletion properly

CREATE OR REPLACE FUNCTION public.safe_delete_medical_center(center_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    center_name TEXT;
    result JSON;
BEGIN
    -- Get center name for logging
    SELECT name INTO center_name 
    FROM public.medical_centers 
    WHERE id = center_id;
    
    IF center_name IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Medical center not found'
        );
    END IF;
    
    -- Delete related data in correct order to avoid foreign key issues
    
    -- 1. Delete queue tracking records
    DELETE FROM public.queue_tracking 
    WHERE booking_id IN (
        SELECT id FROM public.bookings WHERE medical_center_id = center_id
    );
    
    -- 2. Delete bookings
    DELETE FROM public.bookings WHERE medical_center_id = center_id;
    
    -- 3. Delete services
    DELETE FROM public.services WHERE medical_center_id = center_id;
    
    -- 4. Delete doctors
    DELETE FROM public.doctors WHERE medical_center_id = center_id;
    
    -- 5. Delete reviews
    DELETE FROM public.reviews WHERE medical_center_id = center_id;
    
    -- 6. Delete favorites
    DELETE FROM public.favorites WHERE medical_center_id = center_id;
    
    -- 7. Set medical_center_id to NULL in audit_logs (don't delete audit logs)
    UPDATE public.audit_logs 
    SET medical_center_id = NULL 
    WHERE medical_center_id = center_id;
    
    -- 8. Finally delete the medical center
    DELETE FROM public.medical_centers WHERE id = center_id;
    
    -- Log the deletion
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
        'DELETE',
        'medical_centers',
        center_id::TEXT,
        json_build_object('name', center_name),
        NULL,
        '127.0.0.1',
        'Admin Dashboard'
    );
    
    result := json_build_object(
        'success', true,
        'message', 'Medical center deleted successfully',
        'center_name', center_name
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Error deleting medical center: ' || SQLERRM
        );
        RETURN result;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.safe_delete_medical_center(UUID) 
IS 'Safely deletes a medical center and all related data';

-- Add audit triggers for automatic logging of changes

-- Function to handle audit triggers
CREATE OR REPLACE FUNCTION public.handle_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_medical_center_id UUID;
  v_action TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Get current user ID from context
  v_user_id := auth.uid();
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_new_values := to_jsonb(NEW);
    v_old_values := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_values := to_jsonb(OLD);
    v_new_values := NULL;
  END IF;
  
  -- Get medical_center_id based on table
  IF TG_TABLE_NAME = 'services' THEN
    IF TG_OP = 'DELETE' THEN
      v_medical_center_id := (OLD.medical_center_id);
    ELSE
      v_medical_center_id := (NEW.medical_center_id);
    END IF;
  ELSIF TG_TABLE_NAME = 'medical_centers' THEN
    IF TG_OP = 'DELETE' THEN
      v_medical_center_id := OLD.id;
    ELSE
      v_medical_center_id := NEW.id;
    END IF;
  ELSIF TG_TABLE_NAME = 'clinic_images' THEN
    IF TG_OP = 'DELETE' THEN
      v_medical_center_id := (OLD.medical_center_id);
    ELSE
      v_medical_center_id := (NEW.medical_center_id);
    END IF;
  END IF;
  
  -- Log the audit event
  PERFORM public.log_audit_event(
    v_user_id,
    v_medical_center_id,
    v_action,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    v_old_values,
    v_new_values,
    public.get_user_ip(),
    public.get_user_agent()
  );
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for services table
DROP TRIGGER IF EXISTS audit_services_trigger ON public.services;
CREATE TRIGGER audit_services_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_trigger();

-- Create triggers for medical_centers table
DROP TRIGGER IF EXISTS audit_medical_centers_trigger ON public.medical_centers;
CREATE TRIGGER audit_medical_centers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_centers
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_trigger();

-- Create triggers for clinic_images table
DROP TRIGGER IF EXISTS audit_clinic_images_trigger ON public.clinic_images;
CREATE TRIGGER audit_clinic_images_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.clinic_images
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_trigger();

-- Add comments
COMMENT ON FUNCTION public.handle_audit_trigger IS 'Handles audit triggers for automatic logging';

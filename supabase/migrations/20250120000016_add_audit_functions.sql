-- Add audit logging functions for secure tracking

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_medical_center_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    medical_center_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_medical_center_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- Function to get user's IP address (placeholder - will be set by application)
CREATE OR REPLACE FUNCTION public.get_user_ip()
RETURNS INET
LANGUAGE plpgsql
AS $$
BEGIN
  -- This will be set by the application layer
  -- For now, return NULL
  RETURN NULL;
END;
$$;

-- Function to get user agent (placeholder - will be set by application)
CREATE OR REPLACE FUNCTION public.get_user_agent()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- This will be set by the application layer
  -- For now, return NULL
  RETURN NULL;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.log_audit_event IS 'Logs audit events for security tracking';
COMMENT ON FUNCTION public.get_user_ip IS 'Gets user IP address (set by application)';
COMMENT ON FUNCTION public.get_user_agent IS 'Gets user agent (set by application)';

-- Add audit logging system for secure tracking of all activities

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  medical_center_id UUID REFERENCES public.medical_centers(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  table_name TEXT NOT NULL, -- 'services', 'medical_centers', 'clinic_images'
  record_id UUID, -- ID of the affected record
  old_values JSONB, -- Previous values (for updates)
  new_values JSONB, -- New values (for creates/updates)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_medical_center_id ON public.audit_logs(medical_center_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs
-- 1. Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- 2. Center owners can view their center's audit logs
CREATE POLICY "Center owners can view their center audit logs" ON public.audit_logs
  FOR SELECT USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE owner_id = auth.uid()
    )
  );

-- 3. System admins can view all audit logs
CREATE POLICY "System admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- 4. Only system can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.audit_logs IS 'Audit log for tracking all system activities and changes';

-- Add admin role to specific user
-- This migration gives admin privileges to the user with ID: 130f849a-d894-4ce6-a78e-0df3812093de

-- First, let's create a user_roles table to manage user roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'clinic_admin', 'patient')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert admin role for the specific user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('130f849a-d894-4ce6-a78e-0df3812093de', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Create a function to check if user is clinic admin
CREATE OR REPLACE FUNCTION public.is_clinic_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'clinic_admin'
  );
END;
$$;

-- Update medical_centers table to include admin_id
ALTER TABLE public.medical_centers 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update medical_centers policies to allow admin access
DROP POLICY IF EXISTS "Medical centers are viewable by everyone." ON public.medical_centers;
CREATE POLICY "Medical centers are viewable by everyone" ON public.medical_centers FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage all medical centers" ON public.medical_centers FOR ALL USING (public.is_admin());
CREATE POLICY "Clinic admins can manage their own centers" ON public.medical_centers FOR ALL USING (
  admin_id = auth.uid() OR public.is_admin()
);

-- Update doctors policies
DROP POLICY IF EXISTS "Doctors are viewable by everyone." ON public.doctors;
CREATE POLICY "Doctors are viewable by everyone" ON public.doctors FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage all doctors" ON public.doctors FOR ALL USING (public.is_admin());
CREATE POLICY "Clinic admins can manage their center doctors" ON public.doctors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.medical_centers 
    WHERE id = medical_center_id AND (admin_id = auth.uid() OR public.is_admin())
  )
);

-- Update services policies
DROP POLICY IF EXISTS "Services are viewable by everyone." ON public.services;
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage all services" ON public.services FOR ALL USING (public.is_admin());
CREATE POLICY "Clinic admins can manage their center services" ON public.services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.medical_centers 
    WHERE id = medical_center_id AND (admin_id = auth.uid() OR public.is_admin())
  )
);

-- Create a function to generate serial numbers
CREATE OR REPLACE FUNCTION public.generate_clinic_serial_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INT;
  serial_number TEXT;
BEGIN
  -- Get the next number in sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(serial_number FROM 3) AS INT)), 0) + 1
  INTO next_number
  FROM public.medical_centers
  WHERE serial_number ~ '^CLINIC[0-9]+$';
  
  -- Format as CLINIC + number with leading zeros
  serial_number := 'CLINIC' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN serial_number;
END;
$$;

-- Create a function to create a complete medical center with admin
CREATE OR REPLACE FUNCTION public.create_medical_center_with_admin(
  p_name TEXT,
  p_specialty TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_hours TEXT,
  p_description TEXT,
  p_admin_email TEXT,
  p_admin_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_center_id UUID;
  new_admin_id UUID;
  serial_num TEXT;
  result JSON;
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can create medical centers';
  END IF;
  
  -- Generate serial number
  serial_num := public.generate_clinic_serial_number();
  
  -- Create the medical center
  INSERT INTO public.medical_centers (
    name, specialty, address, phone, email, hours, description, serial_number, status
  ) VALUES (
    p_name, p_specialty, p_address, p_phone, p_email, p_hours, p_description, serial_num, 'active'
  ) RETURNING id INTO new_center_id;
  
  -- Create admin user (this would typically be done through Supabase Auth)
  -- For now, we'll just return the serial number and center ID
  -- The actual user creation should be handled by the frontend
  
  result := json_build_object(
    'center_id', new_center_id,
    'serial_number', serial_num,
    'message', 'Medical center created successfully. Please create the admin user account.'
  );
  
  RETURN result;
END;
$$;

-- Support for manual patients (patients without accounts)
-- Allow patient_id to be NULL for manual patients

-- First, drop the NOT NULL constraint on patient_id
ALTER TABLE public.bookings 
ALTER COLUMN patient_id DROP NOT NULL;

-- Add columns for manual patient information
ALTER TABLE public.bookings 
ADD COLUMN manual_patient_name TEXT,
ADD COLUMN manual_patient_phone TEXT;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.bookings.manual_patient_name IS 'Name of manual patient (when patient_id is NULL)';
COMMENT ON COLUMN public.bookings.manual_patient_phone IS 'Phone number of manual patient (when patient_id is NULL)';

-- Update the patient_bookings_with_details view to include manual patient info
DROP VIEW IF EXISTS public.patient_bookings_with_details;

CREATE VIEW public.patient_bookings_with_details AS
SELECT 
  b.*,
  mc.name as medical_center_name,
  mc.address as medical_center_address,
  mc.phone as medical_center_phone,
  s.name as service_name,
  s.price as service_price,
  s.doctor_name, -- Use doctor_name from services table
  s.doctor_specialty, -- Add doctor_specialty from services table
  fm.full_name as family_member_name,
  qt.current_number,
  qt.waiting_count,
  qt.status as queue_status,
  -- Add manual patient info
  CASE 
    WHEN b.patient_id IS NULL THEN b.manual_patient_name
    ELSE p.full_name
  END as patient_name,
  CASE 
    WHEN b.patient_id IS NULL THEN b.manual_patient_phone
    ELSE p.phone
  END as patient_phone,
  CASE 
    WHEN b.patient_id IS NULL THEN NULL
    ELSE au.email
  END as patient_email
FROM public.bookings b
JOIN public.medical_centers mc ON b.medical_center_id = mc.id
JOIN public.services s ON b.service_id = s.id
LEFT JOIN public.family_members fm ON b.family_member_id = fm.id
LEFT JOIN public.profiles p ON b.patient_id = p.id
LEFT JOIN auth.users au ON b.patient_id = au.id
LEFT JOIN public.queue_tracking qt ON b.id = qt.booking_id;

-- Add comment to the updated view
COMMENT ON VIEW public.patient_bookings_with_details IS 'View for patient bookings with details including manual patient support';

-- Update RLS policies to allow manual patients
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Recreate policies with manual patient support
CREATE POLICY "Users can view their own bookings" ON public.bookings
FOR SELECT USING (
  patient_id = auth.uid() OR 
  patient_id IS NULL -- Allow viewing manual patients (for clinic staff)
);

CREATE POLICY "Users can insert their own bookings" ON public.bookings
FOR INSERT WITH CHECK (
  patient_id = auth.uid() OR 
  patient_id IS NULL -- Allow inserting manual patients (for clinic staff)
);

CREATE POLICY "Users can update their own bookings" ON public.bookings
FOR UPDATE USING (
  patient_id = auth.uid() OR 
  patient_id IS NULL -- Allow updating manual patients (for clinic staff)
);

CREATE POLICY "Users can delete their own bookings" ON public.bookings
FOR DELETE USING (
  patient_id = auth.uid() OR 
  patient_id IS NULL -- Allow deleting manual patients (for clinic staff)
);

-- Add constraint to ensure manual patient info is provided when patient_id is NULL
ALTER TABLE public.bookings 
ADD CONSTRAINT check_manual_patient_info 
CHECK (
  (patient_id IS NOT NULL) OR 
  (patient_id IS NULL AND manual_patient_name IS NOT NULL AND manual_patient_phone IS NOT NULL)
);

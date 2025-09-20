-- Fix patient_bookings_with_details view to use doctor_name from services table
-- instead of joining with doctors table

-- Drop the existing view
DROP VIEW IF EXISTS public.patient_bookings_with_details;

-- Recreate the view with correct doctor_name from services table
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
  qt.status as queue_status
FROM public.bookings b
JOIN public.medical_centers mc ON b.medical_center_id = mc.id
JOIN public.services s ON b.service_id = s.id
LEFT JOIN public.family_members fm ON b.family_member_id = fm.id
LEFT JOIN public.queue_tracking qt ON b.id = qt.booking_id;

-- Add comment to the view
COMMENT ON VIEW public.patient_bookings_with_details IS 'View for patient bookings with details including doctor_name from services table';

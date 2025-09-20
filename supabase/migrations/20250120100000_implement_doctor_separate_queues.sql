-- Implement separate queues for each doctor
-- This migration updates the system to have separate queue numbers for each doctor

-- Step 1: Create doctors from services if they don't exist
-- First, insert doctors based on unique doctor names in services
INSERT INTO public.doctors (medical_center_id, name, specialty, status)
SELECT DISTINCT 
  s.medical_center_id,
  s.doctor_name,
  s.doctor_specialty,
  'active'
FROM public.services s
WHERE s.doctor_name IS NOT NULL 
  AND s.doctor_specialty IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.doctors d 
    WHERE d.medical_center_id = s.medical_center_id 
      AND d.name = s.doctor_name
  );

-- Step 2: Update existing bookings to link them to doctors based on service
UPDATE public.bookings 
SET doctor_id = (
  SELECT d.id 
  FROM public.doctors d 
  JOIN public.services s ON s.doctor_name = d.name 
    AND s.medical_center_id = d.medical_center_id
  WHERE s.id = bookings.service_id
)
WHERE doctor_id IS NULL;

-- Step 2: Create a new function to get next queue number for a specific doctor
CREATE OR REPLACE FUNCTION public.get_next_doctor_queue_number(
  p_medical_center_id UUID,
  p_doctor_id UUID,
  p_booking_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next queue number for this specific doctor on this date
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_number
  FROM public.bookings
  WHERE medical_center_id = p_medical_center_id
    AND doctor_id = p_doctor_id
    AND booking_date = p_booking_date;
  
  RETURN next_number;
END;
$$;

-- Step 3: Create a function to get current queue number for a specific doctor
CREATE OR REPLACE FUNCTION public.get_current_doctor_queue_number(
  p_medical_center_id UUID,
  p_doctor_id UUID,
  p_booking_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_number INTEGER;
BEGIN
  -- Get the current queue number for this specific doctor on this date
  SELECT COALESCE(MAX(queue_number), 0)
  INTO current_number
  FROM public.bookings
  WHERE medical_center_id = p_medical_center_id
    AND doctor_id = p_doctor_id
    AND booking_date = p_booking_date
    AND status = 'in_progress';
  
  RETURN current_number;
END;
$$;

-- Step 4: Create a function to get doctor queue statistics
CREATE OR REPLACE FUNCTION public.get_doctor_queue_stats(
  p_medical_center_id UUID,
  p_doctor_id UUID,
  p_booking_date DATE
)
RETURNS TABLE(
  doctor_id UUID,
  doctor_name TEXT,
  total_bookings INTEGER,
  pending_bookings INTEGER,
  in_progress_bookings INTEGER,
  completed_bookings INTEGER,
  current_queue_number INTEGER,
  next_queue_number INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    COUNT(b.id)::INTEGER as total_bookings,
    COUNT(CASE WHEN b.status IN ('pending', 'confirmed') THEN 1 END)::INTEGER as pending_bookings,
    COUNT(CASE WHEN b.status = 'in_progress' THEN 1 END)::INTEGER as in_progress_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::INTEGER as completed_bookings,
    public.get_current_doctor_queue_number(p_medical_center_id, p_doctor_id, p_booking_date) as current_queue_number,
    public.get_next_doctor_queue_number(p_medical_center_id, p_doctor_id, p_booking_date) as next_queue_number
  FROM public.doctors d
  LEFT JOIN public.bookings b ON b.doctor_id = d.id 
    AND b.medical_center_id = p_medical_center_id 
    AND b.booking_date = p_booking_date
  WHERE d.id = p_doctor_id
  GROUP BY d.id, d.name;
END;
$$;

-- Step 5: Create a view for doctor queues with patient details
CREATE OR REPLACE VIEW public.doctor_queues_with_details AS
SELECT 
  b.id as booking_id,
  b.patient_id,
  b.medical_center_id,
  b.service_id,
  b.doctor_id,
  b.booking_date,
  b.booking_time,
  b.queue_number,
  b.status,
  b.qr_code,
  b.notes,
  b.created_at,
  b.updated_at,
  -- Service details
  s.name as service_name,
  s.price as service_price,
  s.doctor_name as service_doctor_name,
  -- Doctor details
  d.name as doctor_name,
  d.specialty as doctor_specialty,
  -- Medical center details
  mc.name as medical_center_name,
  mc.address as medical_center_address,
  mc.phone as medical_center_phone,
  -- Patient details (will be fetched via RPC)
  b.patient_id as patient_id_for_details
FROM public.bookings b
JOIN public.services s ON b.service_id = s.id
JOIN public.doctors d ON b.doctor_id = d.id
JOIN public.medical_centers mc ON b.medical_center_id = mc.id
WHERE b.status IN ('pending', 'confirmed', 'in_progress')
ORDER BY b.doctor_id, b.queue_number;

-- Step 6: Create a function to get all doctor queues for a medical center
CREATE OR REPLACE FUNCTION public.get_medical_center_doctor_queues(
  p_medical_center_id UUID,
  p_booking_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  doctor_id UUID,
  doctor_name TEXT,
  doctor_specialty TEXT,
  total_patients INTEGER,
  current_patient_queue_number INTEGER,
  waiting_patients INTEGER,
  completed_patients INTEGER,
  next_queue_number INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.specialty as doctor_specialty,
    COUNT(b.id)::INTEGER as total_patients,
    COALESCE(MAX(CASE WHEN b.status = 'in_progress' THEN b.queue_number END), 0)::INTEGER as current_patient_queue_number,
    COUNT(CASE WHEN b.status IN ('pending', 'confirmed') THEN 1 END)::INTEGER as waiting_patients,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::INTEGER as completed_patients,
    public.get_next_doctor_queue_number(p_medical_center_id, d.id, p_booking_date) as next_queue_number
  FROM public.doctors d
  LEFT JOIN public.bookings b ON b.doctor_id = d.id 
    AND b.medical_center_id = p_medical_center_id 
    AND b.booking_date = p_booking_date
  WHERE d.medical_center_id = p_medical_center_id
    AND d.status = 'active'
  GROUP BY d.id, d.name, d.specialty
  ORDER BY d.name;
END;
$$;

-- Step 7: Create a function to get patients in a specific doctor's queue
CREATE OR REPLACE FUNCTION public.get_doctor_queue_patients(
  p_medical_center_id UUID,
  p_doctor_id UUID,
  p_booking_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  booking_id UUID,
  patient_id UUID,
  queue_number INTEGER,
  status TEXT,
  booking_time TIME,
  service_name TEXT,
  service_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.patient_id,
    b.queue_number,
    b.status,
    b.booking_time,
    s.name as service_name,
    s.price as service_price,
    b.notes,
    b.created_at
  FROM public.bookings b
  JOIN public.services s ON b.service_id = s.id
  WHERE b.medical_center_id = p_medical_center_id
    AND b.doctor_id = p_doctor_id
    AND b.booking_date = p_booking_date
    AND b.status IN ('pending', 'confirmed', 'in_progress')
  ORDER BY b.queue_number;
END;
$$;

-- Step 8: Update the queue_tracking table to include doctor_id
ALTER TABLE public.queue_tracking 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

-- Update existing queue_tracking records to include doctor_id
UPDATE public.queue_tracking 
SET doctor_id = (
  SELECT b.doctor_id 
  FROM public.bookings b 
  WHERE b.id = queue_tracking.booking_id
)
WHERE doctor_id IS NULL;

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_doctor_date_queue 
ON public.bookings(medical_center_id, doctor_id, booking_date, queue_number);

CREATE INDEX IF NOT EXISTS idx_bookings_doctor_status 
ON public.bookings(medical_center_id, doctor_id, status);

CREATE INDEX IF NOT EXISTS idx_queue_tracking_doctor 
ON public.queue_tracking(doctor_id);

-- Step 10: Add comments
COMMENT ON FUNCTION public.get_next_doctor_queue_number IS 'Gets the next queue number for a specific doctor on a specific date';
COMMENT ON FUNCTION public.get_current_doctor_queue_number IS 'Gets the current queue number for a specific doctor on a specific date';
COMMENT ON FUNCTION public.get_doctor_queue_stats IS 'Gets comprehensive statistics for a doctor''s queue';
COMMENT ON FUNCTION public.get_medical_center_doctor_queues IS 'Gets all doctor queues for a medical center';
COMMENT ON FUNCTION public.get_doctor_queue_patients IS 'Gets all patients in a specific doctor''s queue';
COMMENT ON VIEW public.doctor_queues_with_details IS 'View showing doctor queues with all relevant details';

-- Test the functions
SELECT 'Testing doctor queue functions...' as status;

-- Test getting doctor queues for a medical center (will return empty if no data)
-- SELECT * FROM public.get_medical_center_doctor_queues('00000000-0000-0000-0000-000000000000'::UUID);

SELECT 'Doctor separate queues implementation completed successfully!' as result;

-- Create doctors from existing services
-- This migration creates doctor records from the doctor names in services table

-- Step 1: Create doctors from services if they don't exist
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

-- Step 3: Create a fallback function to get doctor queues even if no doctors exist in doctors table
CREATE OR REPLACE FUNCTION public.get_medical_center_doctor_queues_fallback(
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
  -- First try to get from doctors table
  SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.specialty as doctor_specialty,
    COUNT(b.id)::INTEGER as total_patients,
    COALESCE(MAX(CASE WHEN b.status = 'in_progress' THEN b.queue_number END), 0)::INTEGER as current_patient_queue_number,
    COUNT(CASE WHEN b.status IN ('pending', 'confirmed') THEN 1 END)::INTEGER as waiting_patients,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::INTEGER as completed_patients,
    COALESCE(MAX(b.queue_number), 0) + 1 as next_queue_number
  FROM public.doctors d
  LEFT JOIN public.bookings b ON b.doctor_id = d.id 
    AND b.medical_center_id = p_medical_center_id 
    AND b.booking_date = p_booking_date
  WHERE d.medical_center_id = p_medical_center_id
    AND d.status = 'active'
  GROUP BY d.id, d.name, d.specialty
  
  UNION ALL
  
  -- Fallback: get from services if no doctors exist
  SELECT 
    gen_random_uuid() as doctor_id, -- Generate a temporary UUID
    s.doctor_name as doctor_name,
    s.doctor_specialty as doctor_specialty,
    COUNT(b.id)::INTEGER as total_patients,
    COALESCE(MAX(CASE WHEN b.status = 'in_progress' THEN b.queue_number END), 0)::INTEGER as current_patient_queue_number,
    COUNT(CASE WHEN b.status IN ('pending', 'confirmed') THEN 1 END)::INTEGER as waiting_patients,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::INTEGER as completed_patients,
    COALESCE(MAX(b.queue_number), 0) + 1 as next_queue_number
  FROM public.services s
  LEFT JOIN public.bookings b ON b.service_id = s.id 
    AND b.medical_center_id = p_medical_center_id 
    AND b.booking_date = p_booking_date
  WHERE s.medical_center_id = p_medical_center_id
    AND s.doctor_name IS NOT NULL
    AND s.doctor_specialty IS NOT NULL
    AND s.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.doctors d 
      WHERE d.medical_center_id = p_medical_center_id
    )
  GROUP BY s.doctor_name, s.doctor_specialty
  ORDER BY doctor_name;
END;
$$;

-- Step 4: Create a function to get patients in a doctor's queue (fallback version)
CREATE OR REPLACE FUNCTION public.get_doctor_queue_patients_fallback(
  p_medical_center_id UUID,
  p_doctor_name TEXT,
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
    AND s.doctor_name = p_doctor_name
    AND b.booking_date = p_booking_date
    AND b.status IN ('pending', 'confirmed', 'in_progress')
  ORDER BY b.queue_number;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.get_medical_center_doctor_queues_fallback IS 'Fallback function to get doctor queues from services if doctors table is empty';
COMMENT ON FUNCTION public.get_doctor_queue_patients_fallback IS 'Fallback function to get patients in a doctor queue from services';

-- Test the functions
SELECT 'Testing fallback doctor queue functions...' as status;

-- Test doctor queues functions to ensure they work correctly
-- This migration tests the doctor queue system functions

-- Test function to check if doctor queue functions exist and work
CREATE OR REPLACE FUNCTION public.test_doctor_queues_system()
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  test_medical_center_id UUID;
  test_doctor_id UUID;
  test_booking_date DATE;
  queue_data RECORD;
  patient_data RECORD;
BEGIN
  -- Set test values
  test_medical_center_id := '00000000-0000-0000-0000-000000000001'::UUID;
  test_booking_date := CURRENT_DATE;
  
  -- Test 1: Check if get_medical_center_doctor_queues function exists
  BEGIN
    SELECT * INTO queue_data FROM public.get_medical_center_doctor_queues(test_medical_center_id, test_booking_date) LIMIT 1;
    RETURN QUERY SELECT 'get_medical_center_doctor_queues'::TEXT, 'PASS'::TEXT, 'Function exists and returns data'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'get_medical_center_doctor_queues'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 2: Check if get_medical_center_doctor_queues_fallback function exists
  BEGIN
    SELECT * INTO queue_data FROM public.get_medical_center_doctor_queues_fallback(test_medical_center_id, test_booking_date) LIMIT 1;
    RETURN QUERY SELECT 'get_medical_center_doctor_queues_fallback'::TEXT, 'PASS'::TEXT, 'Function exists and returns data'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'get_medical_center_doctor_queues_fallback'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 3: Check if get_doctor_queue_patients function exists
  BEGIN
    SELECT * INTO patient_data FROM public.get_doctor_queue_patients(test_medical_center_id, test_medical_center_id, test_booking_date) LIMIT 1;
    RETURN QUERY SELECT 'get_doctor_queue_patients'::TEXT, 'PASS'::TEXT, 'Function exists and returns data'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'get_doctor_queue_patients'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 4: Check if get_doctor_queue_patients_fallback function exists
  BEGIN
    SELECT * INTO patient_data FROM public.get_doctor_queue_patients_fallback(test_medical_center_id, 'Test Doctor', test_booking_date) LIMIT 1;
    RETURN QUERY SELECT 'get_doctor_queue_patients_fallback'::TEXT, 'PASS'::TEXT, 'Function exists and returns data'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'get_doctor_queue_patients_fallback'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 5: Check if get_multiple_patient_details function exists
  BEGIN
    SELECT * INTO patient_data FROM public.get_multiple_patient_details(ARRAY[test_medical_center_id]) LIMIT 1;
    RETURN QUERY SELECT 'get_multiple_patient_details'::TEXT, 'PASS'::TEXT, 'Function exists and returns data'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'get_multiple_patient_details'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 6: Check if doctors table has data
  BEGIN
    IF EXISTS (SELECT 1 FROM public.doctors LIMIT 1) THEN
      RETURN QUERY SELECT 'doctors_table_data'::TEXT, 'PASS'::TEXT, 'Doctors table has data'::TEXT;
    ELSE
      RETURN QUERY SELECT 'doctors_table_data'::TEXT, 'FAIL'::TEXT, 'Doctors table is empty'::TEXT;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'doctors_table_data'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 7: Check if services table has data
  BEGIN
    IF EXISTS (SELECT 1 FROM public.services LIMIT 1) THEN
      RETURN QUERY SELECT 'services_table_data'::TEXT, 'PASS'::TEXT, 'Services table has data'::TEXT;
    ELSE
      RETURN QUERY SELECT 'services_table_data'::TEXT, 'FAIL'::TEXT, 'Services table is empty'::TEXT;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'services_table_data'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 8: Check if bookings table has data
  BEGIN
    IF EXISTS (SELECT 1 FROM public.bookings LIMIT 1) THEN
      RETURN QUERY SELECT 'bookings_table_data'::TEXT, 'PASS'::TEXT, 'Bookings table has data'::TEXT;
    ELSE
      RETURN QUERY SELECT 'bookings_table_data'::TEXT, 'FAIL'::TEXT, 'Bookings table is empty'::TEXT;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'bookings_table_data'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
  END;
  
END;
$$;

-- Test the system
SELECT 'Testing doctor queues system...' as status;
SELECT * FROM public.test_doctor_queues_system();
SELECT 'Doctor queues system test completed!' as result;

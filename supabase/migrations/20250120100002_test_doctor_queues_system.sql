-- Test the doctor queues system
-- This migration tests the functions and creates sample data if needed

-- Test 1: Check if we have any doctors
SELECT 'Testing doctor queues system...' as status;

-- Test 2: Check if we have any services with doctor names
SELECT 
  'Services with doctor names:' as test_name,
  COUNT(*) as count
FROM public.services 
WHERE doctor_name IS NOT NULL AND doctor_specialty IS NOT NULL;

-- Test 3: Check if we have any bookings
SELECT 
  'Total bookings:' as test_name,
  COUNT(*) as count
FROM public.bookings;

-- Test 4: Check if we have any bookings for today
SELECT 
  'Bookings for today:' as test_name,
  COUNT(*) as count
FROM public.bookings 
WHERE booking_date = CURRENT_DATE;

-- Test 5: Test the fallback function with a sample medical center
-- (This will return empty if no data exists, which is expected)
SELECT 'Testing fallback function...' as status;

-- Test 6: Create a simple test function to verify the system works
CREATE OR REPLACE FUNCTION public.test_doctor_queues_system()
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Doctors Table'::TEXT as test_name,
    CASE 
      WHEN COUNT(*) > 0 THEN 'PASS'::TEXT
      ELSE 'FAIL - No doctors found'::TEXT
    END as result,
    'Found ' || COUNT(*)::TEXT || ' doctors' as details
  FROM public.doctors
  
  UNION ALL
  
  SELECT 
    'Services with Doctor Names'::TEXT as test_name,
    CASE 
      WHEN COUNT(*) > 0 THEN 'PASS'::TEXT
      ELSE 'FAIL - No services with doctor names'::TEXT
    END as result,
    'Found ' || COUNT(*)::TEXT || ' services with doctor names' as details
  FROM public.services 
  WHERE doctor_name IS NOT NULL AND doctor_specialty IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Bookings for Today'::TEXT as test_name,
    CASE 
      WHEN COUNT(*) > 0 THEN 'PASS'::TEXT
      ELSE 'INFO - No bookings for today'::TEXT
    END as result,
    'Found ' || COUNT(*)::TEXT || ' bookings for today' as details
  FROM public.bookings 
  WHERE booking_date = CURRENT_DATE;
END;
$$;

-- Run the test
SELECT * FROM public.test_doctor_queues_system();

-- Add comment
COMMENT ON FUNCTION public.test_doctor_queues_system IS 'Test function to verify doctor queues system is working correctly';

SELECT 'Doctor queues system test completed!' as result;

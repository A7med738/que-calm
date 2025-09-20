-- Create sample data for testing doctor queues system
-- This migration creates sample medical centers, doctors, services, and bookings

-- Step 1: Create sample medical center if it doesn't exist
INSERT INTO public.medical_centers (
  id, name, specialty, address, phone, email, hours, description, status, serial_number
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'عيادة الدكتور أحمد محمد',
  'طب عام',
  'شارع الملك فهد، الرياض',
  '+966501234567',
  'ahmed@clinic.com',
  '8:00 AM - 10:00 PM',
  'عيادة متخصصة في الطب العام والرعاية الصحية',
  'active',
  'MC001'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create sample doctors
INSERT INTO public.doctors (
  id, medical_center_id, name, specialty, status
) VALUES 
  ('00000000-0000-0000-0000-000000000011'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'د. أحمد محمد', 'طب عام', 'active'),
  ('00000000-0000-0000-0000-000000000012'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'د. فاطمة علي', 'طب أطفال', 'active'),
  ('00000000-0000-0000-0000-000000000013'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'د. خالد السعد', 'طب باطني', 'active')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create sample services
INSERT INTO public.services (
  id, medical_center_id, name, description, price, doctor_name, doctor_specialty, is_active, status
) VALUES 
  ('00000000-0000-0000-0000-000000000021'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'فحص عام', 'فحص طبي شامل', 150.00, 'د. أحمد محمد', 'طب عام', true, 'active'),
  ('00000000-0000-0000-0000-000000000022'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'فحص أطفال', 'فحص طبي للأطفال', 120.00, 'د. فاطمة علي', 'طب أطفال', true, 'active'),
  ('00000000-0000-0000-0000-000000000023'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'فحص باطني', 'فحص طبي باطني', 200.00, 'د. خالد السعد', 'طب باطني', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create sample patients (auth.users entries)
-- Note: These are just for testing - in real app, users would be created through auth.signUp
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data
) VALUES 
  ('00000000-0000-0000-0000-000000000031'::UUID, 'patient1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "محمد أحمد", "phone": "+966501111111"}'),
  ('00000000-0000-0000-0000-000000000032'::UUID, 'patient2@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "فاطمة محمد", "phone": "+966502222222"}'),
  ('00000000-0000-0000-0000-000000000033'::UUID, 'patient3@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "علي خالد", "phone": "+966503333333"}'),
  ('00000000-0000-0000-0000-000000000034'::UUID, 'patient4@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "نورا سعد", "phone": "+966504444444"}'),
  ('00000000-0000-0000-0000-000000000035'::UUID, 'patient5@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "سعد عبدالله", "phone": "+966505555555"}')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create sample bookings for today
INSERT INTO public.bookings (
  id, patient_id, medical_center_id, service_id, doctor_id, booking_date, booking_time, queue_number, status, notes, qr_code
) VALUES 
  -- Doctor 1 (د. أحمد محمد) - General Medicine
  ('00000000-0000-0000-0000-000000000041'::UUID, '00000000-0000-0000-0000-000000000031'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000021'::UUID, '00000000-0000-0000-0000-000000000011'::UUID, CURRENT_DATE, '09:00', 1, 'completed', 'فحص روتيني', 'QR001'),
  ('00000000-0000-0000-0000-000000000042'::UUID, '00000000-0000-0000-0000-000000000032'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000021'::UUID, '00000000-0000-0000-0000-000000000011'::UUID, CURRENT_DATE, '09:30', 2, 'in_progress', 'شكوى من صداع', 'QR002'),
  ('00000000-0000-0000-0000-000000000043'::UUID, '00000000-0000-0000-0000-000000000033'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000021'::UUID, '00000000-0000-0000-0000-000000000011'::UUID, CURRENT_DATE, '10:00', 3, 'pending', 'فحص دوري', 'QR003'),
  
  -- Doctor 2 (د. فاطمة علي) - Pediatrics
  ('00000000-0000-0000-0000-000000000044'::UUID, '00000000-0000-0000-0000-000000000034'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000022'::UUID, '00000000-0000-0000-0000-000000000012'::UUID, CURRENT_DATE, '09:15', 1, 'pending', 'فحص طفل', 'QR004'),
  ('00000000-0000-0000-0000-000000000045'::UUID, '00000000-0000-0000-0000-000000000035'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000022'::UUID, '00000000-0000-0000-0000-000000000012'::UUID, CURRENT_DATE, '09:45', 2, 'pending', 'تطعيم', 'QR005'),
  
  -- Doctor 3 (د. خالد السعد) - Internal Medicine
  ('00000000-0000-0000-0000-000000000046'::UUID, '00000000-0000-0000-0000-000000000031'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000023'::UUID, '00000000-0000-0000-0000-000000000013'::UUID, CURRENT_DATE, '10:30', 1, 'pending', 'فحص باطني', 'QR006')
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create queue tracking entries
INSERT INTO public.queue_tracking (
  booking_id, current_number, waiting_count, status
) VALUES 
  ('00000000-0000-0000-0000-000000000041'::UUID, 0, 0, 'completed'),
  ('00000000-0000-0000-0000-000000000042'::UUID, 2, 0, 'in_progress'),
  ('00000000-0000-0000-0000-000000000043'::UUID, 0, 1, 'waiting'),
  ('00000000-0000-0000-0000-000000000044'::UUID, 0, 0, 'waiting'),
  ('00000000-0000-0000-0000-000000000045'::UUID, 0, 1, 'waiting'),
  ('00000000-0000-0000-0000-000000000046'::UUID, 0, 0, 'waiting')
ON CONFLICT (booking_id) DO NOTHING;

-- Step 7: Test the doctor queues system
SELECT 'Sample data created successfully!' as status;

-- Test the main function
SELECT 'Testing get_medical_center_doctor_queues...' as test_name;
SELECT * FROM public.get_medical_center_doctor_queues('00000000-0000-0000-0000-000000000001'::UUID, CURRENT_DATE);

-- Test the fallback function
SELECT 'Testing get_medical_center_doctor_queues_fallback...' as test_name;
SELECT * FROM public.get_medical_center_doctor_queues_fallback('00000000-0000-0000-0000-000000000001'::UUID, CURRENT_DATE);

-- Test getting patients for a specific doctor
SELECT 'Testing get_doctor_queue_patients...' as test_name;
SELECT * FROM public.get_doctor_queue_patients('00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000011'::UUID, CURRENT_DATE);

SELECT 'Sample data and testing completed!' as result;

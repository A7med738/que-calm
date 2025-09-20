-- =====================================================
-- Patient Database Schema for "دورك" App
-- =====================================================

-- Create medical_centers table
CREATE TABLE public.medical_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  hours TEXT,
  description TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  image_url TEXT,
  serial_number TEXT UNIQUE NOT NULL, -- الرقم التسلسلي المخصص للمركز
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_center_id UUID NOT NULL REFERENCES public.medical_centers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  experience_years INTEGER,
  phone TEXT,
  email TEXT,
  working_hours TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_center_id UUID NOT NULL REFERENCES public.medical_centers(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30, -- مدة الخدمة بالدقائق
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_center_id UUID NOT NULL REFERENCES public.medical_centers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL, -- للحجز لشخص آخر
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  queue_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  qr_code TEXT UNIQUE, -- رمز QR للحجز
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_tracking table
CREATE TABLE public.queue_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  current_number INTEGER NOT NULL,
  waiting_count INTEGER NOT NULL DEFAULT 0,
  estimated_wait_time INTEGER, -- بالدقائق
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving', 'completed')),
  called_at TIMESTAMP WITH TIME ZONE,
  served_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_center_id UUID NOT NULL REFERENCES public.medical_centers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, booking_id) -- منع التقييم المتكرر لنفس الحجز
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_center_id UUID NOT NULL REFERENCES public.medical_centers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, medical_center_id) -- منع التكرار
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmed', 'queue_update', 'your_turn', 'booking_cancelled', 'reminder')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.medical_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Create RLS Policies
-- =====================================================

-- Medical Centers Policies (Public read access)
CREATE POLICY "Anyone can view active medical centers" 
ON public.medical_centers 
FOR SELECT 
USING (status = 'active');

-- Doctors Policies (Public read access for active doctors)
CREATE POLICY "Anyone can view active doctors" 
ON public.doctors 
FOR SELECT 
USING (status = 'active');

-- Services Policies (Public read access for active services)
CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (status = 'active');

-- Bookings Policies
CREATE POLICY "Patients can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = patient_id);

-- Queue Tracking Policies
CREATE POLICY "Patients can view queue tracking for their bookings" 
ON public.queue_tracking 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = queue_tracking.booking_id 
    AND bookings.patient_id = auth.uid()
  )
);

-- Reviews Policies
CREATE POLICY "Patients can view all reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Patients can create reviews for their bookings" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = patient_id AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = reviews.booking_id 
    AND bookings.patient_id = auth.uid()
    AND bookings.status = 'completed'
  )
);

CREATE POLICY "Patients can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = patient_id);

-- Favorites Policies
CREATE POLICY "Patients can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own favorites" 
ON public.favorites 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own favorites" 
ON public.favorites 
FOR DELETE 
USING (auth.uid() = patient_id);

-- Notifications Policies
CREATE POLICY "Patients can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = patient_id);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

-- Medical Centers Indexes
CREATE INDEX idx_medical_centers_serial_number ON public.medical_centers(serial_number);
CREATE INDEX idx_medical_centers_status ON public.medical_centers(status);
CREATE INDEX idx_medical_centers_specialty ON public.medical_centers(specialty);

-- Doctors Indexes
CREATE INDEX idx_doctors_medical_center_id ON public.doctors(medical_center_id);
CREATE INDEX idx_doctors_specialty ON public.doctors(specialty);

-- Services Indexes
CREATE INDEX idx_services_medical_center_id ON public.services(medical_center_id);
CREATE INDEX idx_services_doctor_id ON public.services(doctor_id);

-- Bookings Indexes
CREATE INDEX idx_bookings_patient_id ON public.bookings(patient_id);
CREATE INDEX idx_bookings_medical_center_id ON public.bookings(medical_center_id);
CREATE INDEX idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_qr_code ON public.bookings(qr_code);

-- Queue Tracking Indexes
CREATE INDEX idx_queue_tracking_booking_id ON public.queue_tracking(booking_id);
CREATE INDEX idx_queue_tracking_status ON public.queue_tracking(status);

-- Reviews Indexes
CREATE INDEX idx_reviews_medical_center_id ON public.reviews(medical_center_id);
CREATE INDEX idx_reviews_patient_id ON public.reviews(patient_id);

-- Favorites Indexes
CREATE INDEX idx_favorites_patient_id ON public.favorites(patient_id);
CREATE INDEX idx_favorites_medical_center_id ON public.favorites(medical_center_id);

-- Notifications Indexes
CREATE INDEX idx_notifications_patient_id ON public.notifications(patient_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- =====================================================
-- Create Triggers for Automatic Timestamp Updates
-- =====================================================

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_medical_centers_updated_at
BEFORE UPDATE ON public.medical_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queue_tracking_updated_at
BEFORE UPDATE ON public.queue_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Create Functions for Business Logic
-- =====================================================

-- Function to generate QR code for booking
CREATE OR REPLACE FUNCTION public.generate_booking_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'QR_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to get next queue number for a medical center on a specific date
CREATE OR REPLACE FUNCTION public.get_next_queue_number(
  p_medical_center_id UUID,
  p_booking_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_number
  FROM public.bookings
  WHERE medical_center_id = p_medical_center_id
  AND booking_date = p_booking_date;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate waiting count for a booking
CREATE OR REPLACE FUNCTION public.calculate_waiting_count(
  p_booking_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  waiting_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO waiting_count
  FROM public.bookings b1
  WHERE b1.medical_center_id = (
    SELECT medical_center_id FROM public.bookings WHERE id = p_booking_id
  )
  AND b1.booking_date = (
    SELECT booking_date FROM public.bookings WHERE id = p_booking_id
  )
  AND b1.queue_number < (
    SELECT queue_number FROM public.bookings WHERE id = p_booking_id
  )
  AND b1.status IN ('pending', 'confirmed', 'in_progress');
  
  RETURN waiting_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create Views for Common Queries
-- =====================================================

-- View for medical centers with their doctor count
CREATE VIEW public.medical_centers_with_stats AS
SELECT 
  mc.*,
  COUNT(DISTINCT d.id) as doctor_count,
  COUNT(DISTINCT s.id) as service_count,
  AVG(r.rating) as average_rating,
  COUNT(DISTINCT r.id) as review_count
FROM public.medical_centers mc
LEFT JOIN public.doctors d ON mc.id = d.medical_center_id AND d.status = 'active'
LEFT JOIN public.services s ON mc.id = s.medical_center_id AND s.status = 'active'
LEFT JOIN public.reviews r ON mc.id = r.medical_center_id
WHERE mc.status = 'active'
GROUP BY mc.id;

-- View for patient bookings with details
CREATE VIEW public.patient_bookings_with_details AS
SELECT 
  b.*,
  mc.name as medical_center_name,
  mc.address as medical_center_address,
  mc.phone as medical_center_phone,
  s.name as service_name,
  s.price as service_price,
  d.name as doctor_name,
  fm.full_name as family_member_name,
  qt.current_number,
  qt.waiting_count,
  qt.status as queue_status
FROM public.bookings b
JOIN public.medical_centers mc ON b.medical_center_id = mc.id
JOIN public.services s ON b.service_id = s.id
LEFT JOIN public.doctors d ON b.doctor_id = d.id
LEFT JOIN public.family_members fm ON b.family_member_id = fm.id
LEFT JOIN public.queue_tracking qt ON b.id = qt.booking_id;

-- =====================================================
-- Insert Sample Data (Optional - for testing)
-- =====================================================

-- Insert sample medical centers
INSERT INTO public.medical_centers (name, specialty, address, phone, email, hours, description, serial_number) VALUES
('عيادة الدكتور محمد أحمد', 'طب الأسنان', 'شارع التحرير، القاهرة', '02-234-5678', 'dr.mohamed@clinic.com', 'السبت - الخميس: 9:00 ص - 9:00 م', 'عيادة متخصصة في طب الأسنان مع أحدث التقنيات والأجهزة الطبية', 'CLINIC001'),
('مستشفى النور التخصصي', 'طب عام', 'شارع الهرم، الجيزة', '02-345-6789', 'info@alnour-hospital.com', '24/7', 'مستشفى متكامل يقدم خدمات طبية شاملة', 'CLINIC002'),
('عيادة القلب والأوعية الدموية', 'أمراض القلب', 'شارع كورنيش النيل، القاهرة', '02-456-7890', 'cardio@clinic.com', 'الأحد - الخميس: 8:00 ص - 6:00 م', 'عيادة متخصصة في أمراض القلب والقسطرة', 'CLINIC003');

-- Insert sample doctors
INSERT INTO public.doctors (medical_center_id, name, specialty, experience_years, phone, email, working_hours) VALUES
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC001'), 'د. محمد أحمد', 'استشاري طب الأسنان', 15, '010-123-4567', 'dr.mohamed@clinic.com', 'السبت - الخميس: 9:00 ص - 9:00 م'),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC001'), 'د. فاطمة سالم', 'أخصائية تقويم الأسنان', 8, '010-234-5678', 'dr.fatima@clinic.com', 'السبت - الخميس: 10:00 ص - 8:00 م'),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC002'), 'د. أحمد محمود', 'طبيب عام', 12, '010-345-6789', 'dr.ahmed@alnour.com', '24/7'),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC003'), 'د. نورا حسن', 'استشارية أمراض القلب', 20, '010-456-7890', 'dr.nora@cardio.com', 'الأحد - الخميس: 8:00 ص - 6:00 م');

-- Insert sample services
INSERT INTO public.services (medical_center_id, doctor_id, name, description, price, duration_minutes) VALUES
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC001'), (SELECT id FROM public.doctors WHERE name = 'د. محمد أحمد'), 'كشف وتشخيص', 'فحص شامل للأسنان والتشخيص', 150.00, 30),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC001'), (SELECT id FROM public.doctors WHERE name = 'د. محمد أحمد'), 'تنظيف الأسنان', 'تنظيف وإزالة الجير', 200.00, 45),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC001'), (SELECT id FROM public.doctors WHERE name = 'د. محمد أحمد'), 'حشو الأسنان', 'حشو تجميلي أو عادي', 300.00, 60),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC001'), (SELECT id FROM public.doctors WHERE name = 'د. فاطمة سالم'), 'استشارة تقويم', 'استشارة لتقويم الأسنان', 100.00, 30),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC002'), (SELECT id FROM public.doctors WHERE name = 'د. أحمد محمود'), 'كشف عام', 'فحص طبي شامل', 120.00, 30),
((SELECT id FROM public.medical_centers WHERE serial_number = 'CLINIC003'), (SELECT id FROM public.doctors WHERE name = 'د. نورا حسن'), 'كشف قلب', 'فحص القلب والأوعية الدموية', 250.00, 45);

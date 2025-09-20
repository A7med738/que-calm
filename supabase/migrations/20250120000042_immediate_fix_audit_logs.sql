-- Immediate fix for audit_logs foreign key constraint
-- This will allow medical center deletion immediately

-- Drop the problematic constraint
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

-- Recreate with ON DELETE SET NULL
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL;

-- Also fix other constraints that might cause issues
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_medical_center_id_fkey;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_medical_center_id_fkey;

ALTER TABLE public.services 
ADD CONSTRAINT services_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.doctors 
DROP CONSTRAINT IF EXISTS doctors_medical_center_id_fkey;

ALTER TABLE public.doctors 
ADD CONSTRAINT doctors_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_medical_center_id_fkey;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_medical_center_id_fkey;

ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

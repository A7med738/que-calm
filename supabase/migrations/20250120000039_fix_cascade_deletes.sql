-- Fix cascade delete constraints for medical centers

-- Update foreign key constraints to use CASCADE DELETE where appropriate

-- Update bookings table
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_medical_center_id_fkey;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Update services table
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_medical_center_id_fkey;

ALTER TABLE public.services 
ADD CONSTRAINT services_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Update doctors table
ALTER TABLE public.doctors 
DROP CONSTRAINT IF EXISTS doctors_medical_center_id_fkey;

ALTER TABLE public.doctors 
ADD CONSTRAINT doctors_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Update reviews table
ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_medical_center_id_fkey;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Update favorites table
ALTER TABLE public.favorites 
DROP CONSTRAINT IF EXISTS favorites_medical_center_id_fkey;

ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE CASCADE;

-- Add comment
COMMENT ON TABLE public.medical_centers IS 'Medical centers with proper cascade delete constraints';

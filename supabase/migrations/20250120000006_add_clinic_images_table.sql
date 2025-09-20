-- Create clinic_images table for storing clinic images
CREATE TABLE IF NOT EXISTS public.clinic_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_center_id UUID NOT NULL REFERENCES public.medical_centers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('gallery', 'logo', 'banner')),
  title TEXT,
  description TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clinic_images_medical_center_id ON public.clinic_images(medical_center_id);
CREATE INDEX IF NOT EXISTS idx_clinic_images_type ON public.clinic_images(image_type);
CREATE INDEX IF NOT EXISTS idx_clinic_images_primary ON public.clinic_images(is_primary);

-- Enable RLS
ALTER TABLE public.clinic_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view clinic images" ON public.clinic_images
  FOR SELECT USING (true);

CREATE POLICY "Clinic admins can manage their images" ON public.clinic_images
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all clinic images" ON public.clinic_images
  FOR ALL USING (public.is_admin());

-- Create storage bucket for clinic images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-images', 'clinic-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view clinic images" ON storage.objects
  FOR SELECT USING (bucket_id = 'clinic-images');

CREATE POLICY "Clinic admins can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'clinic-images' AND
    auth.uid() IN (
      SELECT admin_id FROM public.medical_centers
    )
  );

CREATE POLICY "Clinic admins can update their images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'clinic-images' AND
    auth.uid() IN (
      SELECT admin_id FROM public.medical_centers
    )
  );

CREATE POLICY "Clinic admins can delete their images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'clinic-images' AND
    auth.uid() IN (
      SELECT admin_id FROM public.medical_centers
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_clinic_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_clinic_images_updated_at
  BEFORE UPDATE ON public.clinic_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_images_updated_at();

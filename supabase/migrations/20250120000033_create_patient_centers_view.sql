-- Create a separate view for patients that only shows active medical centers

-- Create view for patients (only active centers)
CREATE VIEW public.patient_medical_centers_with_stats AS
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
WHERE mc.status = 'active'  -- Only show active centers for patients
GROUP BY mc.id;

-- Add comment
COMMENT ON VIEW public.patient_medical_centers_with_stats IS 'Medical centers with statistics for patients - only shows active centers';

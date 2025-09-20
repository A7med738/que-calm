-- Fix medical_centers_with_stats view to show all centers (active and inactive) for admin use

-- Drop the existing view
DROP VIEW IF EXISTS public.medical_centers_with_stats;

-- Recreate the view without status filtering
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
-- Removed WHERE mc.status = 'active' to show all centers for admin
GROUP BY mc.id;

-- Add comment
COMMENT ON VIEW public.medical_centers_with_stats IS 'Medical centers with statistics - shows all centers (active and inactive) for admin use';

-- Add booking notifications system for medical centers
-- This migration adds functionality to notify medical centers when new bookings are created

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_notify_new_booking ON public.bookings;
DROP FUNCTION IF EXISTS public.notify_medical_center_new_booking();

-- Create function to notify medical center about new booking
CREATE OR REPLACE FUNCTION public.notify_medical_center_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the medical center
  INSERT INTO public.notifications (
    patient_id,
    booking_id,
    title,
    message,
    type,
    is_read
  ) VALUES (
    NEW.patient_id,
    NEW.id,
    'حجز جديد',
    'تم إنشاء حجز جديد في المركز الطبي',
    'booking_confirmed',
    false
  );

  -- Also create a notification for the medical center admin
  -- We'll use the medical center's owner_id or admin_id if available
  INSERT INTO public.notifications (
    patient_id,
    booking_id,
    title,
    message,
    type,
    is_read
  ) 
  SELECT 
    COALESCE(mc.owner_id, mc.admin_id, NEW.patient_id),
    NEW.id,
    'حجز جديد للمركز',
    'تم إنشاء حجز جديد في المركز: ' || mc.name,
    'booking_confirmed',
    false
  FROM public.medical_centers mc
  WHERE mc.id = NEW.medical_center_id
  AND COALESCE(mc.owner_id, mc.admin_id) IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically notify on new booking
CREATE TRIGGER trigger_notify_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_medical_center_new_booking();

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_medical_center_notifications(UUID);
DROP FUNCTION IF EXISTS public.mark_notification_read(UUID);

-- Create function to get medical center notifications
CREATE OR REPLACE FUNCTION public.get_medical_center_notifications(center_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  booking_id UUID,
  patient_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.created_at,
    n.booking_id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as patient_name
  FROM public.notifications n
  JOIN public.bookings b ON n.booking_id = b.id
  JOIN auth.users u ON n.patient_id = u.id
  WHERE b.medical_center_id = center_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true 
  WHERE id = notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for notifications (drop existing ones first)
DROP POLICY IF EXISTS "Medical center owners can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Patients can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Medical center owners can update their notifications" ON public.notifications;

CREATE POLICY "Medical center owners can view their notifications" 
ON public.notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.medical_centers mc ON b.medical_center_id = mc.id
    WHERE b.id = notifications.booking_id
    AND (mc.owner_id = auth.uid() OR mc.admin_id = auth.uid())
  )
);

CREATE POLICY "Patients can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (patient_id = auth.uid());

CREATE POLICY "Medical center owners can update their notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.medical_centers mc ON b.medical_center_id = mc.id
    WHERE b.id = notifications.booking_id
    AND (mc.owner_id = auth.uid() OR mc.admin_id = auth.uid())
  )
);

-- Add comment
COMMENT ON FUNCTION public.notify_medical_center_new_booking() IS 'Automatically notifies medical center when new booking is created';
COMMENT ON FUNCTION public.get_medical_center_notifications(UUID) IS 'Gets all notifications for a specific medical center';
COMMENT ON FUNCTION public.mark_notification_read(UUID) IS 'Marks a notification as read';

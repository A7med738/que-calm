-- Simple booking notifications system
-- This migration creates a basic notification system for medical centers

-- First, ensure notifications table exists and has proper structure
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmed', 'queue_update', 'your_turn', 'booking_cancelled', 'reminder')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Medical center owners can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Patients can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Medical center owners can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Create simple RLS policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (patient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (patient_id = auth.uid());

-- Create simple notification function
CREATE OR REPLACE FUNCTION public.create_booking_notification(
  p_patient_id UUID,
  p_booking_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'booking_confirmed'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    patient_id,
    booking_id,
    title,
    message,
    type,
    is_read
  ) VALUES (
    p_patient_id,
    p_booking_id,
    p_title,
    p_message,
    p_type,
    false
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  booking_id UUID
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
    n.booking_id
  FROM public.notifications n
  WHERE n.patient_id = p_user_id
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true 
  WHERE id = p_notification_id AND patient_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION public.create_booking_notification(UUID, UUID, TEXT, TEXT, TEXT) IS 'Creates a new notification for a user';
COMMENT ON FUNCTION public.get_user_notifications(UUID) IS 'Gets all notifications for a specific user';
COMMENT ON FUNCTION public.mark_notification_read(UUID) IS 'Marks a notification as read for the current user';

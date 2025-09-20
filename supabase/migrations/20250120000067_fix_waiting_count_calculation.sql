-- Fix waiting count calculation in queue_tracking
-- This migration updates the waiting_count to show accurate remaining turns

-- Create or replace function to calculate waiting count
CREATE OR REPLACE FUNCTION public.calculate_waiting_count(p_booking_id UUID)
RETURNS INTEGER AS $$
DECLARE
  booking_record RECORD;
  waiting_count INTEGER := 0;
BEGIN
  -- Get booking details
  SELECT 
    b.queue_number,
    b.medical_center_id,
    b.booking_date,
    b.status
  INTO booking_record
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  -- If booking not found or not active, return 0
  IF NOT FOUND OR booking_record.status NOT IN ('pending', 'confirmed', 'in_progress') THEN
    RETURN 0;
  END IF;

  -- Count how many bookings are ahead of this one in the queue
  SELECT COUNT(*)
  INTO waiting_count
  FROM public.bookings b2
  WHERE b2.medical_center_id = booking_record.medical_center_id
    AND b2.booking_date = booking_record.booking_date
    AND b2.queue_number < booking_record.queue_number
    AND b2.status IN ('pending', 'confirmed', 'in_progress');

  RETURN waiting_count;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to update all waiting counts
CREATE OR REPLACE FUNCTION public.update_all_waiting_counts()
RETURNS VOID AS $$
BEGIN
  -- Update all queue_tracking records with correct waiting counts
  UPDATE public.queue_tracking qt
  SET waiting_count = public.calculate_waiting_count(qt.booking_id)
  WHERE EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = qt.booking_id
    AND b.status IN ('pending', 'confirmed', 'in_progress')
  );
END;
$$ LANGUAGE plpgsql;

-- Update all existing waiting counts
SELECT public.update_all_waiting_counts();

-- Create trigger to automatically update waiting count when bookings change
CREATE OR REPLACE FUNCTION public.update_waiting_count_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update waiting count for the affected booking
  UPDATE public.queue_tracking
  SET waiting_count = public.calculate_waiting_count(NEW.id)
  WHERE booking_id = NEW.id;

  -- Update waiting counts for all other bookings in the same medical center and date
  UPDATE public.queue_tracking
  SET waiting_count = public.calculate_waiting_count(booking_id)
  WHERE booking_id IN (
    SELECT id FROM public.bookings
    WHERE medical_center_id = NEW.medical_center_id
    AND booking_date = NEW.booking_date
    AND status IN ('pending', 'confirmed', 'in_progress')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_waiting_count_on_booking_change ON public.bookings;

-- Create trigger
CREATE TRIGGER update_waiting_count_on_booking_change
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_waiting_count_trigger();

-- Add comments
COMMENT ON FUNCTION public.calculate_waiting_count(UUID) IS 'Calculates the number of patients waiting ahead of a specific booking';
COMMENT ON FUNCTION public.update_all_waiting_counts() IS 'Updates all waiting counts in queue_tracking table';
COMMENT ON FUNCTION public.update_waiting_count_trigger() IS 'Trigger function to update waiting counts when bookings change';

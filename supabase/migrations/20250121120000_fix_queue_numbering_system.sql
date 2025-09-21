-- Fix the queue numbering system to work correctly
-- This migration fixes the queue numbering logic to ensure proper sequential numbering per doctor

-- Step 1: Fix the get_next_doctor_queue_number function
CREATE OR REPLACE FUNCTION public.get_next_doctor_queue_number(
  p_medical_center_id UUID,
  p_doctor_id UUID,
  p_booking_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next queue number for this specific doctor on this date
  -- Only count bookings that are not cancelled or no_show
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_number
  FROM public.bookings
  WHERE medical_center_id = p_medical_center_id
    AND doctor_id = p_doctor_id
    AND booking_date = p_booking_date
    AND status NOT IN ('cancelled', 'no_show');
  
  RETURN next_number;
END;
$$;

-- Step 2: Create a more robust function to get next queue number with proper error handling
CREATE OR REPLACE FUNCTION public.get_next_doctor_queue_number_safe(
  p_medical_center_id UUID,
  p_doctor_id UUID,
  p_booking_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  LOOP
    attempt := attempt + 1;
    
    -- Get the next queue number for this specific doctor on this date
    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_number
    FROM public.bookings
    WHERE medical_center_id = p_medical_center_id
      AND doctor_id = p_doctor_id
      AND booking_date = p_booking_date
      AND status NOT IN ('cancelled', 'no_show');
    
    -- Check if this number is already taken
    IF NOT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE medical_center_id = p_medical_center_id
        AND doctor_id = p_doctor_id
        AND booking_date = p_booking_date
        AND queue_number = next_number
        AND status NOT IN ('cancelled', 'no_show')
    ) THEN
      RETURN next_number;
    END IF;
    
    -- If number is taken, increment and try again
    next_number := next_number + 1;
    
    -- Prevent infinite loop
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to find available queue number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

-- Step 3: Create a function to reorganize queue numbers for a specific doctor
CREATE OR REPLACE FUNCTION public.reorganize_doctor_queue(
  p_medical_center_id UUID,
  p_doctor_id UUID,
  p_booking_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  booking_record RECORD;
  new_queue_number INTEGER := 1;
BEGIN
  -- Reorganize queue numbers for active bookings only
  FOR booking_record IN
    SELECT id, queue_number
    FROM public.bookings
    WHERE medical_center_id = p_medical_center_id
      AND doctor_id = p_doctor_id
      AND booking_date = p_booking_date
      AND status IN ('pending', 'confirmed', 'in_progress')
    ORDER BY created_at ASC, queue_number ASC
  LOOP
    -- Update the queue number
    UPDATE public.bookings
    SET queue_number = new_queue_number
    WHERE id = booking_record.id;
    
    new_queue_number := new_queue_number + 1;
  END LOOP;
END;
$$;

-- Step 4: Create a function to get patient's position in doctor's queue
CREATE OR REPLACE FUNCTION public.get_patient_queue_position(
  p_booking_id UUID
)
RETURNS TABLE(
  booking_id UUID,
  patient_position INTEGER,
  total_waiting INTEGER,
  current_number INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  booking_info RECORD;
BEGIN
  -- Get booking information
  SELECT 
    b.id,
    b.medical_center_id,
    b.doctor_id,
    b.booking_date,
    b.queue_number,
    b.status
  INTO booking_info
  FROM public.bookings b
  WHERE b.id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate patient's position in the queue
  RETURN QUERY
  SELECT 
    booking_info.id as booking_id,
    (
      SELECT COUNT(*) + 1
      FROM public.bookings b2
      WHERE b2.medical_center_id = booking_info.medical_center_id
        AND b2.doctor_id = booking_info.doctor_id
        AND b2.booking_date = booking_info.booking_date
        AND b2.status IN ('pending', 'confirmed', 'in_progress')
        AND b2.created_at < (
          SELECT created_at 
          FROM public.bookings 
          WHERE id = booking_info.id
        )
    )::INTEGER as patient_position,
    (
      SELECT COUNT(*)
      FROM public.bookings b3
      WHERE b3.medical_center_id = booking_info.medical_center_id
        AND b3.doctor_id = booking_info.doctor_id
        AND b3.booking_date = booking_info.booking_date
        AND b3.status IN ('pending', 'confirmed')
    )::INTEGER as total_waiting,
    (
      SELECT COALESCE(MAX(queue_number), 0)
      FROM public.bookings b4
      WHERE b4.medical_center_id = booking_info.medical_center_id
        AND b4.doctor_id = booking_info.doctor_id
        AND b4.booking_date = booking_info.booking_date
        AND b4.status = 'in_progress'
    )::INTEGER as current_number;
END;
$$;

-- Step 5: Create a trigger to automatically reorganize queue when a booking is cancelled
CREATE OR REPLACE FUNCTION public.trigger_reorganize_queue_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only reorganize if status changed to cancelled or no_show
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('cancelled', 'no_show')) OR
     (TG_OP = 'DELETE') THEN
    
    -- Reorganize the queue for this doctor
    PERFORM public.reorganize_doctor_queue(
      COALESCE(NEW.medical_center_id, OLD.medical_center_id),
      COALESCE(NEW.doctor_id, OLD.doctor_id),
      COALESCE(NEW.booking_date, OLD.booking_date)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS reorganize_queue_on_cancel ON public.bookings;
CREATE TRIGGER reorganize_queue_on_cancel
  AFTER UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_reorganize_queue_on_cancel();

-- Step 6: Update existing bookings to have proper sequential queue numbers
-- This will fix any existing data issues
DO $$
DECLARE
  center_record RECORD;
  doctor_record RECORD;
BEGIN
  -- Loop through all medical centers
  FOR center_record IN
    SELECT DISTINCT medical_center_id, booking_date
    FROM public.bookings
    WHERE booking_date >= CURRENT_DATE - INTERVAL '7 days' -- Only fix recent bookings
  LOOP
    -- Loop through all doctors for this center and date
    FOR doctor_record IN
      SELECT DISTINCT doctor_id
      FROM public.bookings
      WHERE medical_center_id = center_record.medical_center_id
        AND booking_date = center_record.booking_date
        AND doctor_id IS NOT NULL
    LOOP
      -- Reorganize queue for this doctor
      PERFORM public.reorganize_doctor_queue(
        center_record.medical_center_id,
        doctor_record.doctor_id,
        center_record.booking_date
      );
    END LOOP;
  END LOOP;
END $$;

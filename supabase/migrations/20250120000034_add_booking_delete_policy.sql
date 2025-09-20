-- Add DELETE policy for bookings table to allow patients to delete their own bookings

-- Add DELETE policy for bookings
CREATE POLICY "Patients can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid() = patient_id);

-- Add DELETE policy for queue_tracking (when booking is deleted)
CREATE POLICY "Patients can delete queue tracking for their bookings" 
ON public.queue_tracking 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = queue_tracking.booking_id 
    AND bookings.patient_id = auth.uid()
  )
);

-- Add comment
COMMENT ON TABLE public.bookings IS 'Bookings table with full CRUD policies for patients';
COMMENT ON TABLE public.queue_tracking IS 'Queue tracking table with DELETE policy for patients';

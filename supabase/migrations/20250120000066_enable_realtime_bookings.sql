-- Enable realtime for bookings table
-- This allows live updates to be sent to connected clients

-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Add a comment to document the realtime feature
COMMENT ON TABLE public.bookings IS 'Bookings table with realtime updates enabled for live queue management';

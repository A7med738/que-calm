import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  queue_number: number;
  status: string;
  qr_code: string | null;
  notes: string | null;
  medical_center_name: string;
  medical_center_address: string;
  medical_center_phone: string;
  service_name: string;
  service_price: number;
  doctor_name: string | null;
  family_member_name: string | null;
  current_number: number | null;
  waiting_count: number | null;
  queue_status: string | null;
  created_at: string;
}

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('patient_bookings_with_details')
        .select('*')
        .eq('patient_id', user.id)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (error) {
        throw error;
      }

      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      // Refresh bookings after cancellation
      await fetchBookings();
      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    cancelBooking,
  };
};

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

      // Update local state immediately
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      throw err;
    }
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      console.log('Deleting booking:', bookingId);
      
      // First delete related queue tracking records
      const { error: queueError } = await supabase
        .from('queue_tracking')
        .delete()
        .eq('booking_id', bookingId);

      if (queueError) {
        console.error('Error deleting queue tracking:', queueError);
        // Don't throw error here, continue with booking deletion
      }

      // Then delete the booking
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        console.error('Error deleting booking:', error);
        throw error;
      }

      console.log('Booking deleted successfully, updating local state');
      
      // Update local state immediately
      setBookings(prevBookings => {
        const newBookings = prevBookings.filter(booking => booking.id !== bookingId);
        console.log('Updated bookings count:', newBookings.length);
        return newBookings;
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting booking:', err);
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
    deleteBooking,
  };
};

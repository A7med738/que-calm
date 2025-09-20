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

      // Calculate waiting count for each booking
      const bookingsWithWaitingCount = await Promise.all(
        (data || []).map(async (booking) => {
          if (booking.status === 'completed' || booking.status === 'cancelled') {
            return { ...booking, waiting_count: 0 };
          }

          // Get current queue number for the medical center today
          const today = new Date().toISOString().split('T')[0];
          const { data: currentQueueData } = await supabase
            .from('bookings')
            .select('queue_number')
            .eq('medical_center_id', booking.medical_center_id)
            .eq('booking_date', today)
            .eq('status', 'in_progress')
            .order('queue_number', { ascending: true })
            .limit(1)
            .single();

          const currentQueueNumber = currentQueueData?.queue_number || 0;
          
          // If no current patient, count all patients with lower queue numbers
          let waitingCount = 0;
          if (currentQueueNumber > 0) {
            waitingCount = Math.max(0, booking.queue_number - currentQueueNumber);
          } else {
            // Count patients with lower queue numbers
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('medical_center_id', booking.medical_center_id)
              .eq('booking_date', today)
              .lt('queue_number', booking.queue_number)
              .in('status', ['pending', 'confirmed', 'in_progress']);
            
            waitingCount = count || 0;
          }

          return { ...booking, waiting_count: waitingCount };
        })
      );

      setBookings(bookingsWithWaitingCount);
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

  const createBooking = async (bookingData: {
    medical_center_id: string;
    service_id: string;
    notes?: string;
  }) => {
    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }

    try {
      // Get today's date
      const today = new Date();
      const bookingDate = today.toISOString().split('T')[0];
      const bookingTime = today.toTimeString().split(' ')[0].substring(0, 5);

      // Get service details to find the doctor
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('doctor_name, doctor_specialty')
        .eq('id', bookingData.service_id)
        .single();

      if (serviceError) {
        console.error('Error fetching service details:', serviceError);
        throw new Error('خطأ في جلب تفاصيل الخدمة');
      }

      // Find or create doctor for this service
      let doctorId = null;
      if (serviceData.doctor_name) {
        // First, try to find existing doctor
        const { data: existingDoctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('medical_center_id', bookingData.medical_center_id)
          .eq('name', serviceData.doctor_name)
          .single();

        if (existingDoctor) {
          doctorId = existingDoctor.id;
        } else {
          // Create new doctor if not exists
          const { data: newDoctor, error: doctorError } = await supabase
            .from('doctors')
            .insert({
              medical_center_id: bookingData.medical_center_id,
              name: serviceData.doctor_name,
              specialty: serviceData.doctor_specialty || 'عام',
              status: 'active'
            })
            .select()
            .single();

          if (doctorError) {
            console.error('Error creating doctor:', doctorError);
            // Continue without doctor_id if creation fails
          } else {
            doctorId = newDoctor.id;
          }
        }
      }

      // Get next queue number for the specific doctor (or general if no doctor)
      const { data: nextQueueNumber } = await supabase
        .rpc('get_next_doctor_queue_number', {
          p_medical_center_id: bookingData.medical_center_id,
          p_doctor_id: doctorId,
          p_booking_date: bookingDate
        });

      // Generate QR code
      const { data: qrCode } = await supabase
        .rpc('generate_booking_qr_code');

      console.log('Creating booking with data:', {
        patient_id: user.id,
        medical_center_id: bookingData.medical_center_id,
        service_id: bookingData.service_id,
        doctor_id: doctorId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        queue_number: nextQueueNumber || 1,
        qr_code: qrCode,
        status: 'pending',
        notes: bookingData.notes
      });

      // Create booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          patient_id: user.id,
          medical_center_id: bookingData.medical_center_id,
          service_id: bookingData.service_id,
          doctor_id: doctorId,
          booking_date: bookingDate,
          booking_time: bookingTime,
          queue_number: nextQueueNumber || 1,
          qr_code: qrCode,
          status: 'pending',
          notes: bookingData.notes
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

        // Create queue tracking entry
        await supabase
          .from('queue_tracking')
          .insert({
            booking_id: booking.id,
            current_number: 0,
            waiting_count: 0,
            status: 'waiting'
          });

        // Create notification for the patient
        await supabase
          .rpc('create_booking_notification', {
            p_patient_id: user.id,
            p_booking_id: booking.id,
            p_title: 'حجز جديد',
            p_message: 'تم إنشاء حجز جديد في المركز الطبي',
            p_type: 'booking_confirmed'
          });

        // Refresh bookings list
        await fetchBookings();

        return booking;
    } catch (err) {
      console.error('Error creating booking:', err);
      throw err;
    }
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    cancelBooking,
    deleteBooking,
  };
};

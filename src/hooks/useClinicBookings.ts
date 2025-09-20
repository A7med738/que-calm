import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicBooking {
  id: string;
  patient_id: string;
  medical_center_id: string;
  service_id: string;
  doctor_id?: string;
  booking_date: string;
  booking_time: string;
  queue_number: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  qr_code: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  service_name?: string;
  service_price?: number;
  doctor_name?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
}

export const useClinicBookings = (medicalCenterId: string) => {
  const [bookings, setBookings] = useState<ClinicBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!medicalCenterId) return;

    try {
      setLoading(true);
      setError(null);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(
            name,
            price,
            doctor_name
          ),
          doctors(
            name
          )
        `)
        .eq('medical_center_id', medicalCenterId)
        .eq('booking_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('queue_number', { ascending: true });

      if (error) throw error;

      // Get patient details using RPC function
      const patientIds = data.map(booking => booking.patient_id);
      const { data: patientsData, error: patientsError } = await supabase
        .rpc('get_multiple_patient_details', { p_patient_ids: patientIds });

      if (patientsError) {
        console.warn('Error fetching patient details:', patientsError);
      }

      // Transform the data to include joined fields
      const transformedBookings: ClinicBooking[] = data.map(booking => {
        const patient = patientsData?.find(p => p.id === booking.patient_id);
        return {
          ...booking,
          service_name: booking.services?.name || 'خدمة غير محددة',
          service_price: booking.services?.price || 0,
          doctor_name: booking.services?.doctor_name || booking.doctors?.name || 'طبيب غير محدد',
          patient_name: patient?.full_name || 'مريض',
          patient_phone: patient?.phone || 'غير متوفر',
          patient_email: patient?.email || 'غير متوفر'
        };
      });

      setBookings(transformedBookings);
    } catch (err) {
      console.error('Error fetching clinic bookings:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب الحجوزات');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: ClinicBooking['status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث حالة الحجز');
    }
  };

  const getCurrentBooking = () => {
    return bookings.find(booking => booking.status === 'in_progress') || bookings[0];
  };

  const getWaitingBookings = () => {
    return bookings.filter(booking => booking.status === 'pending' || booking.status === 'confirmed');
  };

  const getCompletedCount = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('medical_center_id', medicalCenterId)
        .eq('booking_date', today)
        .eq('status', 'completed');

      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error getting completed count:', err);
      return 0;
    }
  };

  const getPatientDetails = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_patient_details', { p_patient_id: patientId });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.error('Error getting patient details:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [medicalCenterId]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    updateBookingStatus,
    getCurrentBooking,
    getWaitingBookings,
    getCompletedCount,
    getPatientDetails,
  };
};

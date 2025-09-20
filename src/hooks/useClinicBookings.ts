import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!medicalCenterId) return;

    try {
      setLoading(true);
      setError(null);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // console.log('Fetching bookings for medical center:', medicalCenterId, 'on date:', today);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(
            name,
            price,
            doctor_name,
            doctor_specialty
          ),
          doctors(
            name,
            specialty
          )
        `)
        .eq('medical_center_id', medicalCenterId)
        .eq('booking_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('queue_number', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      // console.log('Fetched bookings:', data?.length || 0, 'bookings');

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

      // console.log('Transformed bookings data:', transformedBookings);
      setBookings(transformedBookings);
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error('Error fetching clinic bookings:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب الحجوزات');
    } finally {
      setLoading(false);
    }
  }, [medicalCenterId]);

  // Professional Realtime subscription with proper debouncing
  const setupRealtimeSubscription = useCallback(() => {
    if (!medicalCenterId) return;

        // console.log('Setting up professional Realtime subscription for medical center:', medicalCenterId);

    // Create a debounced update function
    let updateTimeout: NodeJS.Timeout | null = null;
    
    const debouncedFetch = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      updateTimeout = setTimeout(() => {
        console.log('Realtime update: Refreshing bookings');
        fetchBookings();
      }, 500); // 500ms debounce
    };

    // Create Realtime subscription
    const channel = supabase
      .channel(`clinic-bookings-${medicalCenterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `medical_center_id=eq.${medicalCenterId}`
        },
        (payload) => {
            // console.log('Realtime booking change detected:', {
            //   eventType: payload.eventType,
            //   new: payload.new,
            //   old: payload.old
            // });
          
          // Only refresh for relevant changes
          if (payload.eventType === 'INSERT' || 
              payload.eventType === 'DELETE' ||
              (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status)) {
            debouncedFetch();
          }
        }
      )
      .subscribe((status) => {
        // console.log('Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Successfully connected to Realtime updates');
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          // console.error('❌ Realtime subscription error');
          setIsRealtimeConnected(false);
        } else if (status === 'CLOSED') {
          // console.log('🔌 Realtime subscription closed');
          setIsRealtimeConnected(false);
        }
      });

    // Return cleanup function
    return () => {
      // console.log('Cleaning up Realtime subscription');
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [medicalCenterId, fetchBookings]);

  const updateBookingStatus = async (bookingId: string, status: ClinicBooking['status']) => {
    try {
      // Update local state immediately for instant UI feedback
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status }
            : booking
        )
      );

      // Update in database
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      console.log('✅ Booking status updated successfully');
    } catch (err) {
      console.error('❌ Error updating booking status:', err);
      
      // Revert local state on error
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: booking.status } // Revert to original status
            : booking
        )
      );
      
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث حالة الحجز');
      throw err;
    }
  };

  const getCurrentBooking = () => {
    return bookings.find(booking => booking.status === 'in_progress') || bookings[0];
  };

  const getWaitingBookings = () => {
    return bookings.filter(booking => booking.status === 'pending' || booking.status === 'confirmed');
  };

  const getCompletedCount = useCallback(async () => {
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
  }, [medicalCenterId]);

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

  // Professional setup with proper cleanup
  useEffect(() => {
    if (!medicalCenterId) return;

    console.log('Initializing clinic bookings for medical center:', medicalCenterId);

    // Initial fetch
    fetchBookings();

    // Setup Realtime subscription
    const cleanup = setupRealtimeSubscription();

    // Cleanup function
    return () => {
      // console.log('Cleaning up clinic bookings hook');
      if (cleanup) {
        cleanup();
      }
    };
  }, [medicalCenterId, fetchBookings, setupRealtimeSubscription]);

  return {
    bookings,
    loading,
    error,
    isRealtimeConnected,
    lastUpdateTime,
    refetch: fetchBookings,
    updateBookingStatus,
    getCurrentBooking,
    getWaitingBookings,
    getCompletedCount,
    getPatientDetails,
  };
};

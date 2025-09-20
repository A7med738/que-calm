import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DoctorQueue {
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  total_patients: number;
  current_patient_queue_number: number;
  waiting_patients: number;
  completed_patients: number;
  next_queue_number: number;
}

export interface DoctorQueuePatient {
  booking_id: string;
  patient_id: string;
  queue_number: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  booking_time: string;
  service_name: string;
  service_price: number;
  notes?: string;
  created_at: string;
  // Patient details (fetched separately)
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
}

export const useDoctorQueues = (medicalCenterId: string) => {
  const [doctorQueues, setDoctorQueues] = useState<DoctorQueue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const fetchDoctorQueues = useCallback(async () => {
    if (!medicalCenterId) return;

    try {
      setLoading(true);
      setError(null);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Get all doctor queues for this medical center (try fallback if main function fails)
      let { data, error } = await supabase
        .rpc('get_medical_center_doctor_queues', {
          p_medical_center_id: medicalCenterId,
          p_booking_date: today
        });

      // If no data or error, try fallback function
      if (!data || data.length === 0 || error) {
        console.log('Trying fallback function for doctor queues...');
        const fallbackResult = await supabase
          .rpc('get_medical_center_doctor_queues_fallback', {
            p_medical_center_id: medicalCenterId,
            p_booking_date: today
          });
        
        if (fallbackResult.data && fallbackResult.data.length > 0) {
          data = fallbackResult.data;
          error = null;
        }
      }

      if (error) throw error;

      setDoctorQueues(data || []);
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error('Error fetching doctor queues:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في جلب طوابير الأطباء');
    } finally {
      setLoading(false);
    }
  }, [medicalCenterId]);

  const getDoctorQueuePatients = useCallback(async (doctorId: string): Promise<DoctorQueuePatient[]> => {
    if (!medicalCenterId || !doctorId) return [];

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get patients in this doctor's queue (try fallback if main function fails)
      let { data, error } = await supabase
        .rpc('get_doctor_queue_patients', {
          p_medical_center_id: medicalCenterId,
          p_doctor_id: doctorId,
          p_booking_date: today
        });

      // If no data or error, try fallback function
      if (!data || data.length === 0 || error) {
        console.log('Trying fallback function for doctor queue patients...');
        // Get doctor name from doctorQueues state or make a direct query
        const doctorQueue = doctorQueues.find(dq => dq.doctor_id === doctorId);
        if (doctorQueue) {
          const fallbackResult = await supabase
            .rpc('get_doctor_queue_patients_fallback', {
              p_medical_center_id: medicalCenterId,
              p_doctor_name: doctorQueue.doctor_name,
              p_booking_date: today
            });
          
          if (fallbackResult.data && fallbackResult.data.length > 0) {
            data = fallbackResult.data;
            error = null;
          }
        }
      }

      if (error) throw error;

      // Get patient details for all patients
      const patientIds = data?.map(patient => patient.patient_id) || [];
      if (patientIds.length > 0) {
        const { data: patientsData, error: patientsError } = await supabase
          .rpc('get_multiple_patient_details', { p_patient_ids: patientIds });

        if (patientsError) {
          console.warn('Error fetching patient details:', patientsError);
        }

        // Combine patient data with queue data
        const patientsWithDetails: DoctorQueuePatient[] = data?.map(patient => {
          const patientDetails = patientsData?.find(p => p.id === patient.patient_id);
          return {
            ...patient,
            patient_name: patientDetails?.full_name || 'مريض',
            patient_phone: patientDetails?.phone || 'غير متوفر',
            patient_email: patientDetails?.email || 'غير متوفر'
          };
        }) || [];

        return patientsWithDetails;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching doctor queue patients:', err);
      throw err;
    }
  }, [medicalCenterId]);

  const updatePatientStatus = async (bookingId: string, status: DoctorQueuePatient['status']) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      console.log('✅ Patient status updated successfully');
      
      // Refresh doctor queues
      await fetchDoctorQueues();
    } catch (err) {
      console.error('❌ Error updating patient status:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث حالة المريض');
      throw err;
    }
  };

  const callNextPatient = async (doctorId: string) => {
    try {
      // Get current patients in this doctor's queue
      const patients = await getDoctorQueuePatients(doctorId);
      
      // Find the next patient (lowest queue number with pending/confirmed status)
      const nextPatient = patients
        .filter(p => p.status === 'pending' || p.status === 'confirmed')
        .sort((a, b) => a.queue_number - b.queue_number)[0];

      if (!nextPatient) {
        throw new Error('لا يوجد مرضى في الطابور');
      }

      // Update patient status to in_progress
      await updatePatientStatus(nextPatient.booking_id, 'in_progress');

      return nextPatient;
    } catch (err) {
      console.error('Error calling next patient:', err);
      throw err;
    }
  };

  const skipPatient = async (bookingId: string) => {
    try {
      // Update patient status to completed (skipped)
      await updatePatientStatus(bookingId, 'completed');
    } catch (err) {
      console.error('Error skipping patient:', err);
      throw err;
    }
  };

  const completePatient = async (bookingId: string) => {
    try {
      // Update patient status to completed
      await updatePatientStatus(bookingId, 'completed');
    } catch (err) {
      console.error('Error completing patient:', err);
      throw err;
    }
  };

  // Professional Realtime subscription with proper debouncing
  const setupRealtimeSubscription = useCallback(() => {
    if (!medicalCenterId) return;

    console.log('Setting up Realtime subscription for doctor queues:', medicalCenterId);

    // Create a debounced update function
    let updateTimeout: NodeJS.Timeout | null = null;
    
    const debouncedFetch = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      updateTimeout = setTimeout(() => {
        console.log('Realtime update: Refreshing doctor queues');
        fetchDoctorQueues();
      }, 500); // 500ms debounce
    };

    // Create Realtime subscription
    const channel = supabase
      .channel(`doctor-queues-${medicalCenterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `medical_center_id=eq.${medicalCenterId}`
        },
        (payload) => {
          console.log('Realtime booking change detected for doctor queues:', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
          
          // Only refresh for relevant changes
          if (payload.eventType === 'INSERT' || 
              payload.eventType === 'DELETE' ||
              (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status)) {
            debouncedFetch();
          }
        }
      )
      .subscribe((status) => {
        console.log('Doctor queues Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully connected to doctor queues Realtime updates');
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Doctor queues Realtime subscription error');
          setIsRealtimeConnected(false);
        } else if (status === 'CLOSED') {
          console.log('🔌 Doctor queues Realtime subscription closed');
          setIsRealtimeConnected(false);
        }
      });

    // Return cleanup function
    return () => {
      console.log('Cleaning up doctor queues Realtime subscription');
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [medicalCenterId, fetchDoctorQueues]);

  // Professional setup with proper cleanup
  useEffect(() => {
    if (!medicalCenterId) return;

    console.log('Initializing doctor queues for medical center:', medicalCenterId);

    // Initial fetch
    fetchDoctorQueues();

    // Setup Realtime subscription
    const cleanup = setupRealtimeSubscription();

    // Cleanup function
    return () => {
      console.log('Cleaning up doctor queues hook');
      if (cleanup) {
        cleanup();
      }
    };
  }, [medicalCenterId, fetchDoctorQueues, setupRealtimeSubscription]);

  return {
    doctorQueues,
    loading,
    error,
    isRealtimeConnected,
    lastUpdateTime,
    refetch: fetchDoctorQueues,
    getDoctorQueuePatients,
    updatePatientStatus,
    callNextPatient,
    skipPatient,
    completePatient,
  };
};

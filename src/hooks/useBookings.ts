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

      // استبعاد الحالات الطارئة من قائمة حجوزات المرضى
      const filteredData = (data || []).filter(booking => 
        !booking.notes?.includes('حالة طارئة -')
      );

      // Calculate waiting count for each booking
      const bookingsWithWaitingCount = await Promise.all(
        filteredData.map(async (booking) => {
          if (booking.status === 'completed' || booking.status === 'cancelled') {
            return { ...booking, waiting_count: 0 };
          }

          // Get current queue number for the medical center today
          const today = new Date().toISOString().split('T')[0];
          const { data: currentQueueData, error: queueError } = await supabase
            .from('bookings')
            .select('queue_number')
            .eq('medical_center_id', booking.medical_center_id)
            .eq('booking_date', today)
            .eq('status', 'in_progress')
            .order('queue_number', { ascending: true })
            .limit(1);

          if (queueError) {
            console.warn('Error fetching current queue data:', queueError);
          }

          const currentQueueNumber = currentQueueData?.[0]?.queue_number || 0;
          
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

      setBookings(bookingsWithWaitingCount as unknown as Booking[]);
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
      // console.log('Deleting booking:', bookingId);
      
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

      // console.log('Booking deleted successfully, updating local state');
      
      // Update local state immediately
      setBookings(prevBookings => {
        const newBookings = prevBookings.filter(booking => booking.id !== bookingId);
        // console.log('Updated bookings count:', newBookings.length);
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

      // Check for existing active bookings for the same date
      const { data: existingBookings, error: existingBookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          services!inner(
            doctor_name
          )
        `)
        .eq('patient_id', user.id)
        .eq('booking_date', bookingDate)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (existingBookingsError) {
        console.error('Error checking existing bookings:', existingBookingsError);
        throw new Error('خطأ في فحص الحجوزات الموجودة');
      }

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

      // Check if user already has a booking with a different doctor
      if (existingBookings && existingBookings.length > 0) {
        const currentDoctorName = serviceData.doctor_name;
        const existingDoctorNames = existingBookings.map(booking => booking.services?.doctor_name).filter(Boolean);
        
        // Check if there's a booking with a different doctor
        const hasDifferentDoctor = existingDoctorNames.some(doctorName => doctorName !== currentDoctorName);
        
        if (hasDifferentDoctor) {
          throw new Error('لا يمكنك الحجز لدى أكثر من دكتور في نفس اليوم. يرجى إلغاء الحجز السابق أولاً أو الحجز لدى نفس الدكتور.');
        }
        
        // Check if there's already a booking with the same doctor (allow multiple bookings with same doctor)
        const hasSameDoctor = existingDoctorNames.some(doctorName => doctorName === currentDoctorName);
        if (hasSameDoctor) {
          console.log('User already has a booking with the same doctor, allowing multiple bookings');
        }
      }

      // Find or create doctor for this service
      let doctorId = null;
      if (serviceData.doctor_name) {
        // console.log('Looking for doctor:', serviceData.doctor_name, 'in medical center:', bookingData.medical_center_id);
        
        // First, try to find existing doctor
        const { data: existingDoctor, error: findError } = await supabase
          .from('doctors')
          .select('id, name')
          .eq('medical_center_id', bookingData.medical_center_id)
          .eq('name', serviceData.doctor_name)
          .single();

        if (findError && findError.code !== 'PGRST116') {
          console.error('Error finding doctor:', findError);
        }

        if (existingDoctor) {
          doctorId = existingDoctor.id;
            // console.log('Found existing doctor:', existingDoctor.name, 'with ID:', doctorId);
        } else {
          // console.log('Doctor not found, creating new doctor:', serviceData.doctor_name);
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
              // console.log('Created new doctor:', newDoctor.name, 'with ID:', doctorId);
          }
        }
      } else {
        // console.log('No doctor name in service data, will use general queue');
      }

      // Get next queue number for the specific doctor (or general if no doctor)
      let nextQueueNumber = 1;
      if (doctorId) {
        console.log('Getting queue number for doctor:', doctorId, 'on date:', bookingDate);
        
        // Try the safe function first
        const { data: doctorQueueNumber, error: queueError } = await (supabase as any)
          .rpc('get_next_doctor_queue_number_safe', {
            p_medical_center_id: bookingData.medical_center_id,
            p_doctor_id: doctorId,
            p_booking_date: bookingDate
          });
        
        if (queueError) {
          console.error('Error getting doctor queue number with safe function:', queueError);
          // Fallback to regular function
          const { data: fallbackNumber, error: fallbackError } = await (supabase as any)
            .rpc('get_next_doctor_queue_number', {
              p_medical_center_id: bookingData.medical_center_id,
              p_doctor_id: doctorId,
              p_booking_date: bookingDate
            });
          
          if (fallbackError) {
            console.error('Error getting doctor queue number with fallback:', fallbackError);
            nextQueueNumber = 1;
          } else {
            nextQueueNumber = fallbackNumber || 1;
          }
        } else {
          nextQueueNumber = doctorQueueNumber || 1;
        }
        
        console.log('Doctor queue number:', nextQueueNumber);
      } else {
        console.log('Getting general queue number for medical center:', bookingData.medical_center_id, 'on date:', bookingDate);
        // Use general queue number if no doctor
        const { data: generalQueueNumber, error: generalQueueError } = await (supabase as any)
          .rpc('get_next_queue_number', {
            p_medical_center_id: bookingData.medical_center_id,
            p_booking_date: bookingDate
          });
        
        if (generalQueueError) {
          console.error('Error getting general queue number:', generalQueueError);
        }
        
        nextQueueNumber = generalQueueNumber || 1;
        console.log('General queue number:', nextQueueNumber);
      }

      // Generate QR code
      const { data: qrCode, error: qrError } = await (supabase as any)
        .rpc('generate_booking_qr_code');

      if (qrError) {
        console.error('Error generating QR code:', qrError);
        throw new Error('خطأ في إنشاء رمز الاستجابة السريعة');
      }

      // console.log('Creating booking with data:', {
      //   patient_id: user.id,
      //   medical_center_id: bookingData.medical_center_id,
      //   service_id: bookingData.service_id,
      //   doctor_id: doctorId,
      //   booking_date: bookingDate,
      //   booking_time: bookingTime,
      //   queue_number: nextQueueNumber,
      //   qr_code: qrCode,
      //   status: 'pending',
      //   notes: bookingData.notes
      // });

      // Double-check that we're not creating duplicate queue numbers
      if (doctorId) {
        const { data: existingBookings } = await supabase
          .from('bookings')
          .select('queue_number')
          .eq('medical_center_id', bookingData.medical_center_id)
          .eq('doctor_id', doctorId)
          .eq('booking_date', bookingDate)
          .eq('queue_number', nextQueueNumber);
        
        if (existingBookings && existingBookings.length > 0) {
          console.warn('Queue number already exists, incrementing...');
          nextQueueNumber = nextQueueNumber + 1;
        }
      }

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
          queue_number: nextQueueNumber,
          qr_code: qrCode,
          status: 'pending',
          notes: bookingData.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }

        // console.log('Booking created successfully:', booking);

      // Create queue tracking entry
      const { error: queueError } = await supabase
        .from('queue_tracking')
        .insert({
          booking_id: booking.id,
          current_number: 0,
          waiting_count: 0,
          status: 'waiting'
        });

      if (queueError) {
        console.error('Error creating queue tracking:', queueError);
        // Don't throw error here, booking is already created
      }

      // Create notification for the patient
      const { error: notificationError } = await (supabase as any)
        .rpc('create_booking_notification', {
          p_patient_id: user.id,
          p_booking_id: booking.id,
          p_title: 'حجز جديد',
          p_message: 'تم إنشاء حجز جديد في المركز الطبي',
          p_type: 'booking_confirmed'
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't throw error here, booking is already created
      }

      // Refresh bookings list
      try {
        await fetchBookings();
      } catch (fetchError) {
        console.error('Error refreshing bookings:', fetchError);
        // Don't throw error here, booking is already created
      }

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

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

      // console.log('Fetching doctor queues for medical center:', medicalCenterId, 'on date:', today);

      // Get all doctor queues for this medical center (try fallback if main function fails)
      let { data, error } = await supabase
        .rpc('get_medical_center_doctor_queues', {
          p_medical_center_id: medicalCenterId,
          p_booking_date: today
        });

      // console.log('Main function result:', { data: data?.length || 0, error });

      // If no data or error, try fallback function
      if (!data || data.length === 0 || error) {
        // console.log('Trying fallback function for doctor queues...');
        const fallbackResult = await supabase
          .rpc('get_medical_center_doctor_queues_fallback', {
            p_medical_center_id: medicalCenterId,
            p_booking_date: today
          });
        
        // console.log('Fallback function result:', { data: fallbackResult.data?.length || 0, error: fallbackResult.error });
        
        if (fallbackResult.data && fallbackResult.data.length > 0) {
          data = fallbackResult.data;
          error = null;
        }
      }

      if (error) {
        console.error('Error fetching doctor queues:', error);
        throw error;
      }

      // console.log('Fetched doctor queues:', data?.length || 0, 'queues');
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

      // console.log('Fetching patients for doctor:', doctorId, 'in medical center:', medicalCenterId, 'on date:', today);

      // Get patients in this doctor's queue (try fallback if main function fails)
      let { data, error } = await supabase
        .rpc('get_doctor_queue_patients', {
          p_medical_center_id: medicalCenterId,
          p_doctor_id: doctorId,
          p_booking_date: today
        });

      // console.log('Main function result for patients:', { data: data?.length || 0, error });

      // If no data or error, try fallback function
      if (!data || data.length === 0 || error) {
        // console.log('Trying fallback function for doctor queue patients...');
        // Get doctor name from doctorQueues state or make a direct query
        const doctorQueue = doctorQueues.find(dq => dq.doctor_id === doctorId);
        if (doctorQueue) {
          const fallbackResult = await supabase
            .rpc('get_doctor_queue_patients_fallback', {
              p_medical_center_id: medicalCenterId,
              p_doctor_name: doctorQueue.doctor_name,
              p_booking_date: today
            });
          
          // console.log('Fallback function result for patients:', { data: fallbackResult.data?.length || 0, error: fallbackResult.error });
          
          if (fallbackResult.data && fallbackResult.data.length > 0) {
            data = fallbackResult.data;
            error = null;
          }
        }
      }

      if (error) throw error;

      // Get patient details for all patients (excluding manual patients)
      const patientIds = data?.filter(patient => !patient.notes?.includes('مريض يدوي -')).map(patient => patient.patient_id) || [];
      let patientsData = null;
      
      if (patientIds.length > 0) {
        const { data: fetchedPatientsData, error: patientsError } = await supabase
          .rpc('get_multiple_patient_details', { p_patient_ids: patientIds });

        if (patientsError) {
          console.warn('Error fetching patient details:', patientsError);
        } else {
          patientsData = fetchedPatientsData;
        }
      }

      // Combine patient data with queue data
      const patientsWithDetails: DoctorQueuePatient[] = data?.map(patient => {
        // Check if this is an emergency patient (queue_number = 0 or notes contain emergency)
        if (patient.queue_number === 0 || patient.notes?.includes('حالة طارئة -')) {
          // Extract emergency patient info from notes
          const notesMatch = patient.notes?.match(/حالة طارئة - (.+?) - (.+?)( - .+)?$/);
          return {
            ...patient,
            patient_name: notesMatch ? notesMatch[1] : 'حالة طارئة',
            patient_phone: notesMatch ? notesMatch[2] : 'غير متوفر',
            patient_email: 'غير متوفر'
          };
        } else if (patient.notes?.includes('مريض يدوي -')) {
          // Extract manual patient info from notes
          const notesMatch = patient.notes?.match(/مريض يدوي - (.+?) - (.+?)( - .+)?$/);
          return {
            ...patient,
            patient_name: notesMatch ? notesMatch[1] : 'مريض يدوي',
            patient_phone: notesMatch ? notesMatch[2] : 'غير متوفر',
            patient_email: 'غير متوفر'
          };
        } else {
          // Regular patient with account - use the data from the RPC function
          const patientDetails = patientsData?.find(p => p.id === patient.patient_id);
          return {
            ...patient,
            patient_name: patientDetails?.full_name || 'مريض',
            patient_phone: patientDetails?.phone || 'غير متوفر',
            patient_email: patientDetails?.email || 'غير متوفر'
          };
        }
      }) || [];

      return patientsWithDetails;
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

        // console.log('✅ Patient status updated successfully');
      
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

  // إعادة تنظيم الأدوار عند الإلغاء أو الحذف
  const reorganizeQueue = useCallback(async (doctorId: string, bookingDate: string) => {
    try {
      // console.log('Reorganizing queue for doctor:', doctorId, 'on date:', bookingDate);
      
      // جلب جميع الحجوزات النشطة للطبيب في هذا التاريخ
      const { data: activeBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('id, queue_number, status')
        .eq('doctor_id', doctorId)
        .eq('booking_date', bookingDate)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('queue_number', { ascending: true });

      if (fetchError) {
        console.error('Error fetching active bookings for reorganization:', fetchError);
        return;
      }

      if (!activeBookings || activeBookings.length === 0) {
        // console.log('No active bookings to reorganize');
        return;
      }

      // إعادة ترقيم الأدوار بشكل متتالي
      const updates = activeBookings.map((booking, index) => ({
        id: booking.id,
        queue_number: index + 1
      }));

      // تحديث الأدوار في قاعدة البيانات
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ queue_number: update.queue_number })
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating queue number for booking:', update.id, updateError);
        }
      }

      // console.log('✅ Queue reorganized successfully');
      await fetchDoctorQueues();
    } catch (err) {
      console.error('❌ Error reorganizing queue:', err);
      throw err;
    }
  }, [fetchDoctorQueues]);

  // إلغاء حجز وإعادة تنظيم الطابور
  const cancelBookingAndReorganize = useCallback(async (bookingId: string) => {
    try {
      // جلب معلومات الحجز أولاً
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('doctor_id, booking_date, queue_number')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching booking for cancellation:', fetchError);
        throw fetchError;
      }

      // تحديث حالة الحجز إلى ملغي
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error cancelling booking:', updateError);
        throw updateError;
      }

      // إعادة تنظيم الطابور إذا كان هناك طبيب محدد
      if (booking.doctor_id) {
        await reorganizeQueue(booking.doctor_id, booking.booking_date);
      }

      // console.log('✅ Booking cancelled and queue reorganized');
    } catch (err) {
      console.error('❌ Error cancelling booking and reorganizing:', err);
      throw err;
    }
  }, [reorganizeQueue]);

  // إضافة مريض يدوياً من المركز
  const addManualPatient = useCallback(async (patientData: {
    patientName: string;
    patientPhone: string;
    doctorId: string;
    serviceId: string;
    notes?: string;
  }) => {
    try {
      // console.log('Adding manual patient:', patientData);
      
      const today = new Date();
      const bookingDate = today.toISOString().split('T')[0];
      const bookingTime = today.toTimeString().split(' ')[0].substring(0, 5);

      // إنشاء معرف وهمي للمريض اليدوي (UUID ثابت للمرضى اليدويين)
      // نحتاج لاستخدام معرف موجود فعلياً في auth.users
      const manualPatientId = '130f849a-d894-4ce6-a78e-0df3812093de'; // معرف المستخدم الحالي

      // الحصول على رقم الدور التالي للطبيب
      const { data: nextQueueNumber, error: queueError } = await supabase
        .rpc('get_next_doctor_queue_number', {
          p_medical_center_id: medicalCenterId,
          p_doctor_id: patientData.doctorId,
          p_booking_date: bookingDate
        });

      if (queueError) {
        console.error('Error getting next queue number:', queueError);
        throw new Error('خطأ في الحصول على رقم الدور');
      }

      // إنشاء رمز QR فريد
      const { data: qrCode, error: qrError } = await supabase
        .rpc('generate_booking_qr_code');

      if (qrError) {
        console.error('Error generating QR code:', qrError);
        throw new Error('خطأ في إنشاء رمز الاستجابة السريعة');
      }

      // إنشاء الحجز مع معرف وهمي
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          patient_id: manualPatientId, // معرف وهمي للمريض اليدوي
          medical_center_id: medicalCenterId,
          service_id: patientData.serviceId,
          doctor_id: patientData.doctorId,
          booking_date: bookingDate,
          booking_time: bookingTime,
          queue_number: nextQueueNumber || 1,
          qr_code: qrCode,
          status: 'confirmed', // مؤكد مباشرة
          notes: `مريض يدوي - ${patientData.patientName} - ${patientData.patientPhone}${patientData.notes ? ' - ' + patientData.notes : ''}`
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating manual booking:', bookingError);
        throw new Error('خطأ في إنشاء الحجز');
      }

      // إنشاء إدخال في تتبع الطابور (مع الحقول الصحيحة)
      const { error: queueTrackingError } = await supabase
        .from('queue_tracking')
        .insert({
          booking_id: booking.id,
          current_number: nextQueueNumber || 1,
          waiting_count: 0,
          status: 'waiting',
          created_at: new Date().toISOString()
        });

      if (queueTrackingError) {
        console.warn('Error creating queue tracking entry:', queueTrackingError);
        // لا نوقف العملية إذا فشل إنشاء تتبع الطابور
      }

      // إنشاء إشعار (إذا كانت الدالة موجودة)
      try {
        // محاولة إنشاء إشعار - إذا فشلت فلا نوقف العملية
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            patient_id: manualPatientId,
            medical_center_id: medicalCenterId,
            title: 'تم إضافة مريض يدوي',
            message: `تم إضافة مريض يدوي: ${patientData.patientName} - رقم الدور: ${nextQueueNumber || 1}`,
            is_read: false
          });
        
        if (notificationError) {
          console.warn('Error creating notification:', notificationError);
        }
      } catch (notificationError) {
        console.warn('Error creating notification:', notificationError);
        // لا نوقف العملية إذا فشل إنشاء الإشعار
      }

      // تحديث قائمة طوابير الأطباء
      await fetchDoctorQueues();

      // console.log('✅ Manual patient added successfully');
      return booking;
    } catch (err) {
      console.error('❌ Error adding manual patient:', err);
      throw err;
    }
  }, [medicalCenterId, fetchDoctorQueues]);

  // إضافة مريض طارئ إلى طابور الأولوية
  const addEmergencyPatient = useCallback(async (patientData: {
    patientName: string;
    patientPhone: string;
    doctorId: string;
    serviceId: string;
    notes?: string;
  }) => {
    try {
      const today = new Date();
      const bookingDate = today.toISOString().split('T')[0];
      const bookingTime = today.toTimeString().split(' ')[0].substring(0, 5);

      // استخدام معرف المستخدم الحالي (الطبيب/الممرضة) للحالات الطارئة
      const { data: { user } } = await supabase.auth.getUser();
      const manualPatientId = user?.id || '130f849a-d894-4ce6-a78e-0df3812093de';

      // إنشاء رمز QR فريد
      const { data: qrCode, error: qrError } = await supabase
        .rpc('generate_booking_qr_code');

      if (qrError) {
        console.error('Error generating QR code:', qrError);
        throw new Error('خطأ في إنشاء رمز الاستجابة السريعة');
      }

      // إنشاء الحجز مع حالة طارئة
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          patient_id: manualPatientId,
          medical_center_id: medicalCenterId,
          service_id: patientData.serviceId,
          doctor_id: patientData.doctorId,
          booking_date: bookingDate,
          booking_time: bookingTime,
          queue_number: 0, // رقم 0 للحالات الطارئة
          qr_code: qrCode,
          status: 'confirmed', // حالة طارئة (نستخدم confirmed مع queue_number = 0)
          notes: `حالة طارئة - ${patientData.patientName} - ${patientData.patientPhone}${patientData.notes ? ' - ' + patientData.notes : ''}`
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating emergency booking:', bookingError);
        throw new Error('خطأ في إنشاء الحجز الطارئ');
      }

      // إنشاء إدخال في تتبع الطابور
      const { error: queueTrackingError } = await supabase
        .from('queue_tracking')
        .insert({
          booking_id: booking.id,
          current_number: 0,
          waiting_count: 0,
          status: 'waiting',
          created_at: new Date().toISOString()
        });

      if (queueTrackingError) {
        console.warn('Error creating emergency queue tracking entry:', queueTrackingError);
      }

      // إنشاء إشعار للمرضى الآخرين الذين يحجزون مع نفس الطبيب
      try {
        // جلب جميع المرضى الذين يحجزون مع نفس الطبيب اليوم
        const today = new Date().toISOString().split('T')[0];
        const { data: patientsWithSameDoctor, error: patientsError } = await supabase
          .from('bookings')
          .select('patient_id')
          .eq('medical_center_id', medicalCenterId)
          .eq('doctor_id', patientData.doctorId)
          .eq('booking_date', today)
          .in('status', ['pending', 'confirmed', 'in_progress'])
          .neq('patient_id', manualPatientId); // استبعاد المريض الطارئ نفسه

        if (patientsError) {
          console.warn('Error fetching patients with same doctor:', patientsError);
        } else if (patientsWithSameDoctor && patientsWithSameDoctor.length > 0) {
          // إنشاء إشعار لكل مريض يحجز مع نفس الطبيب
          const notifications = patientsWithSameDoctor.map(patient => ({
            patient_id: patient.patient_id,
            medical_center_id: medicalCenterId,
            title: 'حالة طارئة',
            message: `عذراً، هناك حالة طارئة مع طبيبك، سيتم تأخير المواعيد قليلاً`,
            is_read: false
          }));

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notifications);
          
          if (notificationError) {
            console.warn('Error creating emergency notifications:', notificationError);
          }
        }
      } catch (notificationError) {
        console.warn('Error creating emergency notifications:', notificationError);
      }

      // تحديث قائمة طوابير الأطباء
      await fetchDoctorQueues();

      return booking;
    } catch (err) {
      console.error('❌ Error adding emergency patient:', err);
      throw err;
    }
  }, [medicalCenterId, fetchDoctorQueues]);

  // تعيين تأخير للطبيب
  const setDoctorDelay = useCallback(async (doctorId: string, delayMinutes: number, reason: string) => {
    try {
      // جلب جميع المرضى الذين يحجزون مع نفس الطبيب اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: patientsWithSameDoctor, error: patientsError } = await supabase
        .from('bookings')
        .select('patient_id')
        .eq('medical_center_id', medicalCenterId)
        .eq('doctor_id', doctorId)
        .eq('booking_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (patientsError) {
        console.warn('Error fetching patients with same doctor:', patientsError);
      } else if (patientsWithSameDoctor && patientsWithSameDoctor.length > 0) {
        // إنشاء إشعار لكل مريض يحجز مع نفس الطبيب
        const notifications = patientsWithSameDoctor.map(patient => ({
          patient_id: patient.patient_id,
          medical_center_id: medicalCenterId,
          title: 'تأخير الطبيب',
          message: `دكتور متأخر ${delayMinutes} دقيقة - ${reason}. يمكنكم إعادة جدولة موعدكم`,
          is_read: false
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notificationError) {
          console.warn('Error creating delay notifications:', notificationError);
        }
      }

      // يمكن إضافة المزيد من المنطق هنا مثل تحديث حالة الطبيب
      console.log(`Doctor ${doctorId} delayed by ${delayMinutes} minutes: ${reason}`);
      
    } catch (err) {
      console.error('❌ Error setting doctor delay:', err);
      throw err;
    }
  }, [medicalCenterId]);

  // إعادة ترتيب الطابور يدوياً
  const reorderQueue = useCallback(async (doctorId: string, bookingId: string, newPosition: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // جلب جميع الحجوزات النشطة للطبيب
      const { data: activeBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('id, queue_number, status')
        .eq('doctor_id', doctorId)
        .eq('booking_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('queue_number', { ascending: true });

      if (fetchError) {
        console.error('Error fetching active bookings for reordering:', fetchError);
        return;
      }

      if (!activeBookings || activeBookings.length === 0) {
        return;
      }

      // إعادة ترتيب الأدوار
      const updates = activeBookings.map((booking, index) => {
        if (booking.id === bookingId) {
          return { id: booking.id, queue_number: newPosition };
        } else if (index >= newPosition) {
          return { id: booking.id, queue_number: index + 1 };
        } else {
          return { id: booking.id, queue_number: index + 1 };
        }
      });

      // تحديث الأدوار في قاعدة البيانات
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ queue_number: update.queue_number })
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating queue number for booking:', update.id, updateError);
        }
      }

      await fetchDoctorQueues();
    } catch (err) {
      console.error('❌ Error reordering queue:', err);
      throw err;
    }
  }, [fetchDoctorQueues]);

  // Professional Realtime subscription with proper debouncing
  const setupRealtimeSubscription = useCallback(() => {
    if (!medicalCenterId) return;

      // console.log('Setting up Realtime subscription for doctor queues:', medicalCenterId);

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

    // Create Realtime subscription with multiple tables
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
          filter: `medical_center_id=eq.${medicalCenterId}`
        },
        (payload) => {
          console.log('Realtime doctor change detected:', payload);
          debouncedFetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
          filter: `medical_center_id=eq.${medicalCenterId}`
        },
        (payload) => {
          console.log('Realtime service change detected:', payload);
          debouncedFetch();
        }
      )
      .subscribe((status) => {
        // console.log('Doctor queues Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Successfully connected to doctor queues Realtime updates');
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          // console.error('❌ Doctor queues Realtime subscription error');
          setIsRealtimeConnected(false);
        } else if (status === 'CLOSED') {
          // console.log('🔌 Doctor queues Realtime subscription closed');
          setIsRealtimeConnected(false);
        }
      });

    // Return cleanup function
    return () => {
      // console.log('Cleaning up doctor queues Realtime subscription');
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [medicalCenterId, fetchDoctorQueues]);

  // Professional setup with proper cleanup
  useEffect(() => {
    if (!medicalCenterId) return;

    // console.log('Initializing doctor queues for medical center:', medicalCenterId);

    // Initial fetch
    fetchDoctorQueues();

    // Setup Realtime subscription
    const cleanup = setupRealtimeSubscription();

    // Cleanup function
    return () => {
      // console.log('Cleaning up doctor queues hook');
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
    reorganizeQueue,
    cancelBookingAndReorganize,
    addManualPatient,
    addEmergencyPatient,
    setDoctorDelay,
    reorderQueue
  };
};

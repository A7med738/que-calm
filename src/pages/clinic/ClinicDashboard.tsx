import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Clock, User, SkipForward, CheckCircle, Settings, Stethoscope, Bell, Eye, Phone, Mail, Calendar, Wifi, WifiOff, RefreshCw, Plus, X, Trash2, AlertTriangle, Zap, RotateCcw } from "lucide-react";
import ServicesManagement from "@/components/clinic/ServicesManagement";
import { useNotifications } from "@/hooks/useNotifications";
import { useClinicBookings } from "@/hooks/useClinicBookings";
import { useDoctorQueues, DoctorQueue, DoctorQueuePatient } from "@/hooks/useDoctorQueues";
import { supabase } from "@/integrations/supabase/client";
import { testQueueSystem, reorganizeQueueForDoctor, getQueueStatistics } from "@/utils/queueTestUtils";

// Helper function to calculate remaining turns
const calculateRemainingTurns = (currentQueueNumber: number, waitingBookings: any[]) => {
  if (!currentQueueNumber || waitingBookings.length === 0) return waitingBookings.length;
  
  // Find the highest queue number in waiting bookings
  const maxQueueNumber = Math.max(...waitingBookings.map(booking => booking.queue_number));
  
  // Calculate remaining turns
  return maxQueueNumber - currentQueueNumber;
};

// Helper function to calculate turns remaining for a specific booking
const calculateTurnsRemaining = (bookingQueueNumber: number, currentQueueNumber: number) => {
  if (!currentQueueNumber) return 0;
  return Math.max(0, bookingQueueNumber - currentQueueNumber);
};

const ClinicDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("queue");
  const [clinicSession, setClinicSession] = useState<any>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [selectedDoctorQueue, setSelectedDoctorQueue] = useState<DoctorQueue | null>(null);
  const [doctorQueuePatients, setDoctorQueuePatients] = useState<DoctorQueuePatient[]>([]);
  const [loadingDoctorQueuePatients, setLoadingDoctorQueuePatients] = useState(false);
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [manualPatientData, setManualPatientData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    serviceId: '',
    notes: ''
  });
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [emergencyPatientData, setEmergencyPatientData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    serviceId: '',
    notes: ''
  });
  const [delayData, setDelayData] = useState({
    doctorId: '',
    delayMinutes: 15,
    reason: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  
  
  // Get notifications for the current user (medical center owner)
  const { notifications, getUnreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Get real bookings for the medical center (legacy - for backward compatibility)
  const { 
    bookings, 
    loading: bookingsLoading, 
    isRealtimeConnected: hookRealtimeConnected,
    lastUpdateTime: hookLastUpdateTime,
    refetch,
    getCurrentBooking, 
    getWaitingBookings, 
    updateBookingStatus,
    getCompletedCount,
    getPatientDetails
  } = useClinicBookings(clinicSession?.medical_center?.id || '');

  // Get doctor queues for the medical center (new system)
  const {
    doctorQueues,
    loading: doctorQueuesLoading,
    isRealtimeConnected: doctorQueuesRealtimeConnected,
    lastUpdateTime: doctorQueuesLastUpdateTime,
    refetch: refetchDoctorQueues,
    getDoctorQueuePatients,
    callNextPatient,
    skipPatient,
    completePatient,
    reorganizeQueue,
    cancelBookingAndReorganize,
    addManualPatient,
    addEmergencyPatient,
    setDoctorDelay,
    reorderQueue
  } = useDoctorQueues(clinicSession?.medical_center?.id || '');

  // Fetch completed count when medical center ID is available (with debouncing)
  useEffect(() => {
    if (clinicSession?.medical_center?.id) {
      const timeout = setTimeout(() => {
        getCompletedCount().then(setCompletedCount);
      }, 1000); // 1 second delay to avoid rapid updates
      
      return () => clearTimeout(timeout);
    }
  }, [clinicSession?.medical_center?.id, getCompletedCount]);

  // Auto-fix queue numbers on component mount and when data changes
  useEffect(() => {
    if (clinicSession?.medical_center?.id && doctorQueues.length > 0) {
      // Auto-fix queue numbers silently in background
      handleAutoFixQueueNumbers();
    }
  }, [clinicSession?.medical_center?.id, doctorQueues.length]);

  // جلب الخدمات المتاحة للمريض اليدوي
  useEffect(() => {
    const fetchServices = async () => {
      if (!clinicSession?.medical_center?.id) return;
      
      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, price, doctor_name, doctor_specialty')
          .eq('medical_center_id', clinicSession.medical_center.id)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching services:', error);
          return;
        }

        setAvailableServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [clinicSession?.medical_center?.id]);

  // Monitor realtime connection status
  useEffect(() => {
    const isConnected = hookRealtimeConnected || doctorQueuesRealtimeConnected;
    setIsRealtimeConnected(isConnected);
    console.log('Real-time connection status:', {
      hookRealtimeConnected,
      doctorQueuesRealtimeConnected,
      isConnected
    });
  }, [hookRealtimeConnected, doctorQueuesRealtimeConnected]);

  // Update last update time from hook
  useEffect(() => {
    if (hookLastUpdateTime || doctorQueuesLastUpdateTime) {
      setLastUpdateTime(hookLastUpdateTime || doctorQueuesLastUpdateTime);
    }
  }, [hookLastUpdateTime, doctorQueuesLastUpdateTime]);

  // Debug doctor queues data changes
  useEffect(() => {
    console.log('Doctor queues data updated:', {
      doctorQueuesCount: doctorQueues.length,
      totalWaiting: doctorQueues.reduce((sum, queue) => sum + queue.waiting_patients, 0),
      totalCompleted: doctorQueues.reduce((sum, queue) => sum + queue.completed_patients, 0),
      doctorQueues: doctorQueues.map(q => ({
        doctor: q.doctor_name,
        waiting: q.waiting_patients,
        completed: q.completed_patients,
        current: q.current_patient_queue_number,
        next: q.next_queue_number
      }))
    });
  }, [doctorQueues]);

  useEffect(() => {
    // تحقق من وجود جلسة المركز
    const session = localStorage.getItem('clinic_session');
    if (!session) {
      navigate('/clinic/auth');
      return;
    }

    try {
      const parsedSession = JSON.parse(session);
      
      // التحقق من صحة الجلسة (النظام الآمن)
      if (!parsedSession.medical_center || !parsedSession.user_id) {
        console.error('Invalid clinic session - missing required data');
        localStorage.removeItem('clinic_session');
        navigate('/clinic/auth');
        return;
      }

      setClinicSession(parsedSession);
    } catch (error) {
      console.error('Error parsing clinic session:', error);
      localStorage.removeItem('clinic_session');
      navigate('/clinic/auth');
    }
  }, [navigate]);

  const handleNextPatient = async () => {
    const currentBooking = getCurrentBooking();
    if (currentBooking) {
      try {
        // Mark current booking as completed
        await updateBookingStatus(currentBooking.id, 'completed');
        // Update completed count
        setCompletedCount(prev => prev + 1);
      } catch (error) {
        console.error('Error updating booking status:', error);
      }
    }
  };

  const handleSkipPatient = async () => {
    const currentBooking = getCurrentBooking();
    if (currentBooking) {
      try {
        // Mark current booking as no_show
        await updateBookingStatus(currentBooking.id, 'no_show');
      } catch (error) {
        console.error('Error updating booking status:', error);
      }
    }
  };

  const handleManualRefresh = async () => {
    try {
      await refetch();
      await refetchDoctorQueues();
      await getCompletedCount().then(setCompletedCount);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleSelectDoctorQueue = async (doctorQueue: DoctorQueue) => {
    setSelectedDoctorQueue(doctorQueue);
    setLoadingDoctorQueuePatients(true);
    try {
      const patients = await getDoctorQueuePatients(doctorQueue.doctor_id);
      setDoctorQueuePatients(patients);
    } catch (error) {
      console.error('Error fetching doctor queue patients:', error);
    } finally {
      setLoadingDoctorQueuePatients(false);
    }
  };

  const handleCallNextPatient = async (doctorId: string) => {
    try {
      await callNextPatient(doctorId);
      // Refresh the selected doctor queue
      if (selectedDoctorQueue) {
        await handleSelectDoctorQueue(selectedDoctorQueue);
      }
    } catch (error) {
      console.error('Error calling next patient:', error);
    }
  };

  const handleSkipPatientInQueue = async (bookingId: string) => {
    try {
      await skipPatient(bookingId);
      // Refresh the selected doctor queue
      if (selectedDoctorQueue) {
        await handleSelectDoctorQueue(selectedDoctorQueue);
      }
    } catch (error) {
      console.error('Error skipping patient:', error);
    }
  };

  const handleCompletePatientInQueue = async (bookingId: string) => {
    try {
      await completePatient(bookingId);
      // Refresh the selected doctor queue
      if (selectedDoctorQueue) {
        await handleSelectDoctorQueue(selectedDoctorQueue);
      }
    } catch (error) {
      console.error('Error completing patient:', error);
    }
  };

  // إلغاء حجز وإعادة تنظيم الطابور
  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBookingAndReorganize(bookingId);
      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء الحجز وإعادة تنظيم الطابور بنجاح",
      });
      // Refresh the selected doctor queue
      if (selectedDoctorQueue) {
        await handleSelectDoctorQueue(selectedDoctorQueue);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء الحجز",
        variant: "destructive",
      });
    }
  };

  // إضافة مريض يدوياً
  const handleAddManualPatient = async () => {
    if (!manualPatientData.patientName || !manualPatientData.patientPhone || !manualPatientData.doctorId || !manualPatientData.serviceId) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      await addManualPatient(manualPatientData);
      toast({
        title: "تم الإضافة",
        description: `تم إضافة المريض ${manualPatientData.patientName} بنجاح`,
      });
      
      // إعادة تعيين النموذج
      setManualPatientData({
        patientName: '',
        patientPhone: '',
        doctorId: '',
        serviceId: '',
        notes: ''
      });
      setShowAddPatientDialog(false);
      
      // تحديث الطابور المحدد
      if (selectedDoctorQueue) {
        await handleSelectDoctorQueue(selectedDoctorQueue);
      }
    } catch (error) {
      console.error('Error adding manual patient:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المريض",
        variant: "destructive",
      });
    }
  };

  // تحديث بيانات المريض اليدوي عند تغيير الخدمة
  const handleServiceChange = (serviceId: string) => {
    const selectedService = availableServices.find(s => s.id === serviceId);
    if (selectedService) {
      // البحث عن الطبيب المناسب لهذه الخدمة
      const doctorQueue = doctorQueues.find(dq => dq.doctor_name === selectedService.doctor_name);
      setManualPatientData(prev => ({
        ...prev,
        serviceId,
        doctorId: doctorQueue?.doctor_id || ''
      }));
    }
  };

  // إضافة مريض طارئ
  const handleAddEmergencyPatient = async () => {
    if (!emergencyPatientData.patientName || !emergencyPatientData.patientPhone || !emergencyPatientData.doctorId || !emergencyPatientData.serviceId) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة للحالة الطارئة",
        variant: "destructive",
      });
      return;
    }

    try {
      await addEmergencyPatient(emergencyPatientData);
      toast({
        title: "تم إضافة الحالة الطارئة",
        description: `تم إضافة ${emergencyPatientData.patientName} كحالة طارئة بنجاح`,
      });
      
      // إعادة تعيين النموذج
      setEmergencyPatientData({
        patientName: '',
        patientPhone: '',
        doctorId: '',
        serviceId: '',
        notes: ''
      });
      setShowEmergencyDialog(false);
      
      // تحديث الطابور المحدد
      if (selectedDoctorQueue) {
        await handleSelectDoctorQueue(selectedDoctorQueue);
      }
    } catch (error) {
      console.error('Error adding emergency patient:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الحالة الطارئة",
        variant: "destructive",
      });
    }
  };

  // تعيين تأخير للطبيب
  const handleSetDoctorDelay = async () => {
    if (!delayData.doctorId || !delayData.reason) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار الطبيب وكتابة سبب التأخير",
        variant: "destructive",
      });
      return;
    }

    try {
      await setDoctorDelay(delayData.doctorId, delayData.delayMinutes, delayData.reason);
      toast({
        title: "تم تعيين التأخير",
        description: `تم إشعار المرضى بتأخير الطبيب ${delayData.delayMinutes} دقيقة`,
      });
      
      // إعادة تعيين النموذج
      setDelayData({
        doctorId: '',
        delayMinutes: 15,
        reason: ''
      });
      setShowDelayDialog(false);
    } catch (error) {
      console.error('Error setting doctor delay:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعيين التأخير",
        variant: "destructive",
      });
    }
  };

  // تحديث بيانات المريض الطارئ عند تغيير الخدمة
  const handleEmergencyServiceChange = (serviceId: string) => {
    const selectedService = availableServices.find(s => s.id === serviceId);
    if (selectedService) {
      const doctorQueue = doctorQueues.find(dq => dq.doctor_name === selectedService.doctor_name);
      setEmergencyPatientData(prev => ({
        ...prev,
        serviceId,
        doctorId: doctorQueue?.doctor_id || ''
      }));
    }
  };


  const handleViewPatientDetails = async (booking: any) => {
    setSelectedPatient(booking);
    setLoadingPatientDetails(true);
    try {
      const details = await getPatientDetails(booking.patient_id);
      console.log('Patient details loaded:', details);
      setPatientDetails(details);
    } catch (error) {
      console.error('Error loading patient details:', error);
      setPatientDetails(null);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  const handleSignOut = async () => {
    // تسجيل عملية تسجيل الخروج في سجل الأنشطة
    if (clinicSession?.user_id && clinicSession?.medical_center?.id) {
      try {
        await supabase.rpc('log_audit_event', {
          p_user_id: clinicSession.user_id,
          p_medical_center_id: clinicSession.medical_center.id,
          p_action: 'LOGOUT',
          p_table_name: 'medical_centers',
          p_record_id: clinicSession.medical_center.id,
          p_new_values: { logout_time: new Date().toISOString() }
        });
      } catch (auditError) {
        console.error('Error logging logout audit event:', auditError);
        // لا نوقف العملية إذا فشل تسجيل السجل
      }
    }

    localStorage.removeItem('clinic_session');
    navigate('/clinic/auth');
  };

  // Auto-fix queue numbers function (silent, no user notifications)
  const handleAutoFixQueueNumbers = async () => {
    if (!clinicSession?.medical_center?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      let needsFix = false;
      
      // Check each doctor's queue for issues
      for (const doctorQueue of doctorQueues) {
        // Get all bookings for this doctor today
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('id, queue_number, created_at')
          .eq('medical_center_id', clinicSession.medical_center.id)
          .eq('doctor_id', doctorQueue.doctor_id)
          .eq('booking_date', today)
          .in('status', ['pending', 'confirmed', 'in_progress'])
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching bookings for auto-fix:', error);
          continue;
        }

        if (bookings && bookings.length > 0) {
          // Check if queue numbers are sequential
          for (let i = 0; i < bookings.length; i++) {
            const expectedQueueNumber = i + 1;
            if (bookings[i].queue_number !== expectedQueueNumber) {
              needsFix = true;
              break;
            }
          }

          // If issues found, fix them automatically
          if (needsFix) {
            console.log(`Auto-fixing queue for doctor ${doctorQueue.doctor_name}`);
            
            for (let i = 0; i < bookings.length; i++) {
              const newQueueNumber = i + 1;
              if (bookings[i].queue_number !== newQueueNumber) {
                await supabase
                  .from('bookings')
                  .update({ queue_number: newQueueNumber })
                  .eq('id', bookings[i].id);
                
                console.log(`Auto-updated booking ${bookings[i].id} to queue number ${newQueueNumber}`);
              }
            }
          }
        }
      }
      
      // Refresh data if fixes were applied
      if (needsFix) {
        console.log('Queue numbers auto-fixed, refreshing data...');
        await refetchDoctorQueues();
      }
      
    } catch (error) {
      console.error('Error in auto-fix queue numbers:', error);
    }
  };

  // Test queue system function
  const handleTestQueueSystem = async () => {
    if (!clinicSession?.medical_center?.id) return;
    
    try {
      toast({
        title: "اختبار النظام",
        description: "جاري اختبار نظام الطابور...",
      });

      // Test each doctor's queue
      for (const doctorQueue of doctorQueues) {
        const result = await testQueueSystem(clinicSession.medical_center.id, doctorQueue.doctor_id);
        
        if (!result.success) {
          toast({
            title: "مشكلة في الطابور",
            description: `مشكلة في طابور د. ${doctorQueue.doctor_name}: ${result.message}`,
            variant: "destructive",
          });
          
          // Try to reorganize the queue
          const reorganizeResult = await reorganizeQueueForDoctor(
            clinicSession.medical_center.id,
            doctorQueue.doctor_id,
            new Date().toISOString().split('T')[0]
          );
          
          if (reorganizeResult.success) {
            toast({
              title: "تم إصلاح الطابور",
              description: `تم إعادة تنظيم طابور د. ${doctorQueue.doctor_name}`,
            });
          }
        } else {
          console.log(`Queue test passed for Dr. ${doctorQueue.doctor_name}:`, result.data);
        }
      }
      
      toast({
        title: "تم الاختبار",
        description: "تم اختبار جميع طوابير الأطباء",
      });
      
      // Refresh the data
      await refetchDoctorQueues();
      
    } catch (error) {
      console.error('Error testing queue system:', error);
      toast({
        title: "خطأ في الاختبار",
        description: "حدث خطأ أثناء اختبار نظام الطابور",
        variant: "destructive",
      });
    }
  };

  // Fix existing queue numbers function
  const handleFixQueueNumbers = async () => {
    if (!clinicSession?.medical_center?.id) return;
    
    try {
      toast({
        title: "إصلاح أرقام الطابور",
        description: "جاري إصلاح أرقام الطابور الموجودة...",
      });

      const today = new Date().toISOString().split('T')[0];
      
      // Fix each doctor's queue
      for (const doctorQueue of doctorQueues) {
        // Get all bookings for this doctor today
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('id, queue_number, created_at')
          .eq('medical_center_id', clinicSession.medical_center.id)
          .eq('doctor_id', doctorQueue.doctor_id)
          .eq('booking_date', today)
          .in('status', ['pending', 'confirmed', 'in_progress'])
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching bookings for reorganization:', error);
          continue;
        }

        if (bookings && bookings.length > 0) {
          // Reorganize queue numbers sequentially
          for (let i = 0; i < bookings.length; i++) {
            const newQueueNumber = i + 1;
            if (bookings[i].queue_number !== newQueueNumber) {
              await supabase
                .from('bookings')
                .update({ queue_number: newQueueNumber })
                .eq('id', bookings[i].id);
              
              console.log(`Updated booking ${bookings[i].id} to queue number ${newQueueNumber}`);
            }
          }
        }
      }
      
      toast({
        title: "تم الإصلاح",
        description: "تم إصلاح جميع أرقام الطابور",
      });
      
      // Refresh the data
      await refetchDoctorQueues();
      
    } catch (error) {
      console.error('Error fixing queue numbers:', error);
      toast({
        title: "خطأ في الإصلاح",
        description: "حدث خطأ أثناء إصلاح أرقام الطابور",
        variant: "destructive",
      });
    }
  };

  // Get real data from bookings
      const currentBooking = getCurrentBooking();
      const waitingBookings = getWaitingBookings();
      const totalWaiting = waitingBookings.length;
      const remainingTurns = calculateRemainingTurns(currentBooking?.queue_number || 0, waitingBookings);

  const clinicInfo = {
    name: clinicSession?.medical_center?.name || "عيادة الدكتور محمد أحمد",
    todayPatients: bookings.length,
    currentStatus: "مفتوح"
  };

  const tabs = [
    { id: "queue", label: "الطابور المباشر", icon: Users },
    { id: "services", label: "إدارة الخدمات", icon: Stethoscope },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "settings", label: "الإعدادات", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">{clinicInfo.name}</h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-1">
                <span className="text-xs sm:text-sm text-muted-foreground">اليوم: {clinicInfo.todayPatients} مريض</span>
                <Badge className="bg-accent text-accent-foreground text-xs">{clinicInfo.currentStatus}</Badge>
                <div className="flex items-center gap-1">
                  {isRealtimeConnected ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">مباشر</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">غير متصل</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleManualRefresh}
                disabled={bookingsLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${bookingsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                تسجيل الخروج
              </Button>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-card border-b lg:border-b-0 lg:border-l min-h-auto lg:min-h-screen">
          <div className="p-3 sm:p-4">
            <nav className="flex lg:flex-col gap-2 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-right whitespace-nowrap lg:w-full ${
                      selectedTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                      {tab.id === "notifications" && getUnreadCount() > 0 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                          {getUnreadCount()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm lg:text-base">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
          {selectedTab === "queue" && (
            <div className="space-y-4 sm:space-y-6">

              {/* Header with Actions */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">طوابير الأطباء</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowEmergencyDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    حالة طارئة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDelayDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    تأخير طبيب
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPatientDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مريض
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchDoctorQueues();
                      refetch();
                    }}
                    disabled={doctorQueuesLoading || bookingsLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${(doctorQueuesLoading || bookingsLoading) ? 'animate-spin' : ''}`} />
                    تحديث
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    إصلاح تلقائي نشط
                  </div>
                </div>
              </div>

              {/* Doctor Queues Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {doctorQueuesLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">جاري تحميل طوابير الأطباء...</p>
                  </div>
                ) : doctorQueues.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا يوجد أطباء نشطين</p>
                  </div>
                ) : (
                  doctorQueues.map((doctorQueue) => (
                  <Card 
                    key={doctorQueue.doctor_id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDoctorQueue?.doctor_id === doctorQueue.doctor_id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectDoctorQueue(doctorQueue)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        {doctorQueue.doctor_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{doctorQueue.doctor_specialty}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <div className="text-xl font-bold text-primary transition-all duration-300 ease-in-out">
                            {doctorQueue.waiting_patients}
                          </div>
                          <p className="text-xs text-muted-foreground">في الانتظار</p>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-accent transition-all duration-300 ease-in-out">
                            {doctorQueue.completed_patients}
                          </div>
                          <p className="text-xs text-muted-foreground">تم فحصهم</p>
                        </div>
                      </div>
                      {doctorQueue.current_patient_queue_number > 0 && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-600">
                            الدور الحالي: {doctorQueue.current_patient_queue_number}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  ))
                )}
              </div>

              {/* Selected Doctor Queue Details */}
              {selectedDoctorQueue && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        طابور د. {selectedDoctorQueue.doctor_name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {isRealtimeConnected ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {isRealtimeConnected ? 'تحديث مباشر' : 'غير متصل'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedDoctorQueue.doctor_specialty}</p>
                  </CardHeader>
                  <CardContent>
                    {loadingDoctorQueuePatients ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground mt-2">جاري تحميل الطابور...</p>
                      </div>
                    ) : doctorQueuePatients.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">لا يوجد مرضى في الطابور</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Current Patient */}
                        {doctorQueuePatients.find(p => p.status === 'in_progress') && (
                          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-primary">دورك الآن</h3>
                                <p className="text-sm text-muted-foreground">
                                  {doctorQueuePatients.find(p => p.status === 'in_progress')?.patient_name}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleCompletePatientInQueue(
                                    doctorQueuePatients.find(p => p.status === 'in_progress')?.booking_id || ''
                                  )}
                                  className="bg-accent hover:bg-accent/90"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  انتهى
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSkipPatientInQueue(
                                    doctorQueuePatients.find(p => p.status === 'in_progress')?.booking_id || ''
                                  )}
                                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                >
                                  <SkipForward className="h-4 w-4 mr-1" />
                                  تأجيل
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Waiting Patients */}
                        <div className="space-y-2">
                          {doctorQueuePatients
                            .filter(p => p.status === 'pending' || p.status === 'confirmed')
                            .sort((a, b) => a.queue_number - b.queue_number)
                            .map((patient, index) => (
                            <div key={patient.booking_id} className={`flex items-center justify-between p-3 rounded-lg ${
                              patient.queue_number === 0 || patient.notes?.includes('حالة طارئة -')
                                ? 'bg-red-50 border border-red-200' 
                                : 'bg-muted/30'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  patient.queue_number === 0 || patient.notes?.includes('حالة طارئة -')
                                    ? 'bg-red-100' 
                                    : 'bg-primary/10'
                                }`}>
                                  {patient.queue_number === 0 || patient.notes?.includes('حالة طارئة -') ? (
                                    <span className="text-red-600 text-lg">🚨</span>
                                  ) : (
                                    <span className="font-bold text-primary text-sm">{patient.queue_number}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm flex items-center gap-2">
                                    {patient.patient_name}
                                    {(patient.queue_number === 0 || patient.notes?.includes('حالة طارئة -')) && (
                                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                        طارئ
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{patient.service_name}</p>
                                  <p className="text-xs text-muted-foreground">{patient.booking_time}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {index === 0 && !doctorQueuePatients.find(p => p.status === 'in_progress') && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCallNextPatient(selectedDoctorQueue.doctor_id)}
                                    className="bg-primary hover:bg-primary/90"
                                  >
                                    <User className="h-4 w-4 mr-1" />
                                    استدعاء
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewPatientDetails(patient)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  تفاصيل
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      إلغاء
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>تأكيد الإلغاء</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        هل أنت متأكد من إلغاء حجز {patient.patient_name}؟ سيتم إعادة تنظيم الطابور تلقائياً.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleCancelBooking(patient.booking_id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        تأكيد الإلغاء
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Overall Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground transition-all duration-300 ease-in-out">
                      {doctorQueues.reduce((sum, queue) => sum + queue.waiting_patients, 0)}
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">إجمالي المنتظرين</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground transition-all duration-300 ease-in-out">{doctorQueues.length}</div>
                    <p className="text-muted-foreground text-sm sm:text-base">الأطباء النشطين</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-accent mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground transition-all duration-300 ease-in-out">
                      {doctorQueues.reduce((sum, queue) => sum + queue.completed_patients, 0)}
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">تم فحصهم اليوم</p>
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

          {selectedTab === "services" && (
            <div className="space-y-4 sm:space-y-6">
              <ServicesManagement medicalCenterId={clinicSession?.medical_center?.id || ''} />
            </div>
          )}


          {selectedTab === "notifications" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl">الإشعارات</CardTitle>
                    {getUnreadCount() > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {getUnreadCount()} غير مقروء
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs"
                        >
                          تعيين الكل كمقروء
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                      لا توجد إشعارات
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.is_read 
                              ? 'bg-muted/50 border-muted' 
                              : 'bg-primary/5 border-primary/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm sm:text-base">
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                              <p className="text-muted-foreground text-xs sm:text-sm mb-2">
                                {notification.message}
                              </p>
                              {notification.patient_name && (
                                <p className="text-xs text-muted-foreground">
                                  المريض: {notification.patient_name}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.created_at).toLocaleString('ar-SA')}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs"
                              >
                                تعيين كمقروء
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === "settings" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">إعدادات المركز</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                    قريباً - صفحة الإعدادات
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Patient Details Dialog */}
          <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تفاصيل المريض</DialogTitle>
                <DialogDescription>
                  عرض تفاصيل المريض ومعلومات الحجز
                </DialogDescription>
              </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{patientDetails?.full_name || selectedPatient.patient_name}</h3>
                      <p className="text-sm text-muted-foreground">رقم الطابور: {selectedPatient.queue_number}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{patientDetails?.phone || selectedPatient.patient_phone || 'غير متوفر'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{patientDetails?.email || selectedPatient.patient_email || 'غير متوفر'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedPatient.booking_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedPatient.booking_time}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">تفاصيل الخدمة</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>الخدمة:</strong> {selectedPatient.service_name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>الطبيب:</strong> {selectedPatient.doctor_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>السعر:</strong> {selectedPatient.service_price} ريال
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">حالة الحجز</h4>
                    <Badge 
                      variant={selectedPatient.status === 'pending' ? 'secondary' : 
                              selectedPatient.status === 'confirmed' ? 'default' : 
                              selectedPatient.status === 'in_progress' ? 'default' : 'destructive'}
                    >
                      {selectedPatient.status === 'pending' ? 'في الانتظار' :
                       selectedPatient.status === 'confirmed' ? 'مؤكد' :
                       selectedPatient.status === 'in_progress' ? 'قيد التنفيذ' :
                       selectedPatient.status === 'completed' ? 'مكتمل' :
                       selectedPatient.status === 'cancelled' ? 'ملغي' : 'لم يحضر'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {loadingPatientDetails ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">جاري تحميل التفاصيل الإضافية...</p>
                </div>
              ) : patientDetails && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">معلومات إضافية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">
                        <strong>تاريخ التسجيل:</strong>
                      </p>
                      <p>{new Date(patientDetails.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">
                        <strong>معرف المستخدم:</strong>
                      </p>
                      <p className="font-mono text-xs">{patientDetails.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPatient.notes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">ملاحظات</h4>
                  <p className="text-sm text-muted-foreground">{selectedPatient.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Manual Patient Dialog */}
      <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مريض يدوياً</DialogTitle>
            <DialogDescription>
              إضافة مريض جديد إلى الطابور مباشرة من المركز
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientName">اسم المريض *</Label>
              <Input
                id="patientName"
                value={manualPatientData.patientName}
                onChange={(e) => setManualPatientData(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="أدخل اسم المريض"
              />
            </div>
            <div>
              <Label htmlFor="patientPhone">رقم الهاتف *</Label>
              <Input
                id="patientPhone"
                value={manualPatientData.patientPhone}
                onChange={(e) => setManualPatientData(prev => ({ ...prev, patientPhone: e.target.value }))}
                placeholder="أدخل رقم الهاتف"
                type="tel"
              />
            </div>
            <div>
              <Label htmlFor="service">الخدمة *</Label>
              <Select value={manualPatientData.serviceId} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  {loadingServices ? (
                    <SelectItem value="" disabled>جاري التحميل...</SelectItem>
                  ) : availableServices.length === 0 ? (
                    <SelectItem value="" disabled>لا توجد خدمات متاحة</SelectItem>
                  ) : (
                    availableServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {service.doctor_name} ({service.price} ريال)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={manualPatientData.notes}
                onChange={(e) => setManualPatientData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddPatientDialog(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddManualPatient}
                disabled={!manualPatientData.patientName || !manualPatientData.patientPhone || !manualPatientData.serviceId}
              >
                إضافة المريض
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Patient Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              إضافة حالة طارئة
            </DialogTitle>
            <DialogDescription>
              إضافة مريض بحالة طارئة يحتاج أولوية في الطابور
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emergency-patient-name">اسم المريض *</Label>
              <Input
                id="emergency-patient-name"
                value={emergencyPatientData.patientName}
                onChange={(e) => setEmergencyPatientData(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="اسم المريض"
              />
            </div>
            <div>
              <Label htmlFor="emergency-patient-phone">رقم الهاتف *</Label>
              <Input
                id="emergency-patient-phone"
                value={emergencyPatientData.patientPhone}
                onChange={(e) => setEmergencyPatientData(prev => ({ ...prev, patientPhone: e.target.value }))}
                placeholder="رقم الهاتف"
              />
            </div>
            <div>
              <Label htmlFor="emergency-service">الخدمة *</Label>
              <Select onValueChange={handleEmergencyServiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.doctor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="emergency-notes">ملاحظات إضافية</Label>
              <Textarea
                id="emergency-notes"
                value={emergencyPatientData.notes}
                onChange={(e) => setEmergencyPatientData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="وصف الحالة الطارئة..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleAddEmergencyPatient}
              className="bg-red-600 hover:bg-red-700"
            >
              إضافة حالة طارئة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctor Delay Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              تعيين تأخير للطبيب
            </DialogTitle>
            <DialogDescription>
              إشعار المرضى بتأخير الطبيب والسماح لهم بإعادة جدولة مواعيدهم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delay-doctor">الطبيب *</Label>
              <Select onValueChange={(value) => setDelayData(prev => ({ ...prev, doctorId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الطبيب" />
                </SelectTrigger>
                <SelectContent>
                  {doctorQueues.map((queue) => (
                    <SelectItem key={queue.doctor_id} value={queue.doctor_id}>
                      {queue.doctor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="delay-minutes">مدة التأخير (دقيقة) *</Label>
              <Select onValueChange={(value) => setDelayData(prev => ({ ...prev, delayMinutes: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مدة التأخير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="45">45 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة واحدة</SelectItem>
                  <SelectItem value="90">ساعة ونصف</SelectItem>
                  <SelectItem value="120">ساعتان</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="delay-reason">سبب التأخير *</Label>
              <Textarea
                id="delay-reason"
                value={delayData.reason}
                onChange={(e) => setDelayData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="مثال: حالة طارئة، موعد طويل، مشكلة تقنية..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelayDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSetDoctorDelay}
              className="bg-orange-600 hover:bg-orange-700"
            >
              إشعار المرضى
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicDashboard;
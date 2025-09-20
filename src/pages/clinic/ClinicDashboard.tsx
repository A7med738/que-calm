import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, Clock, User, SkipForward, CheckCircle, Settings, Stethoscope, Bell, Eye, Phone, Mail, Calendar, Wifi, WifiOff, RefreshCw } from "lucide-react";
import ServicesManagement from "@/components/clinic/ServicesManagement";
import { useNotifications } from "@/hooks/useNotifications";
import { useClinicBookings } from "@/hooks/useClinicBookings";
import { useDoctorQueues, DoctorQueue, DoctorQueuePatient } from "@/hooks/useDoctorQueues";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  
  
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
    completePatient
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

  // Monitor realtime connection status
  useEffect(() => {
    setIsRealtimeConnected(hookRealtimeConnected || doctorQueuesRealtimeConnected);
  }, [hookRealtimeConnected, doctorQueuesRealtimeConnected]);

  // Update last update time from hook
  useEffect(() => {
    if (hookLastUpdateTime || doctorQueuesLastUpdateTime) {
      setLastUpdateTime(hookLastUpdateTime || doctorQueuesLastUpdateTime);
    }
  }, [hookLastUpdateTime, doctorQueuesLastUpdateTime]);

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

              {/* Doctor Queues Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {doctorQueues.map((doctorQueue) => (
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
                          <div className="text-xl font-bold text-primary">{doctorQueue.waiting_patients}</div>
                          <p className="text-xs text-muted-foreground">في الانتظار</p>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-accent">{doctorQueue.completed_patients}</div>
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
                ))}
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
                            <div key={patient.booking_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="font-bold text-primary text-sm">{patient.queue_number}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{patient.patient_name}</p>
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
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {doctorQueues.reduce((sum, queue) => sum + queue.waiting_patients, 0)}
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">إجمالي المنتظرين</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{doctorQueues.length}</div>
                    <p className="text-muted-foreground text-sm sm:text-base">الأطباء النشطين</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-accent mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
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
    </div>
  );
};

export default ClinicDashboard;
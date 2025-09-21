import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Users, Clock, CheckCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PatientBottomNavigation from "@/components/patient/PatientBottomNavigation";

const QueueTracking = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [currentNumber, setCurrentNumber] = useState(0);
  const [myNumber, setMyNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  
  // Fetch real booking data
  const fetchBookingData = useCallback(async () => {
    if (!bookingId) {
      console.log('QueueTracking: Missing bookingId', { bookingId });
      return;
    }
    
    if (!user) {
        // console.log('QueueTracking: User not loaded yet, waiting...', { bookingId });
      return;
    }
    
    try {
      setLoading(true);
        // console.log('QueueTracking: Fetching booking data for ID:', bookingId);
      
      // Get booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('patient_bookings_with_details')
        .select('*')
        .eq('id', bookingId)
        .eq('patient_id', user.id)
        .single();

      if (bookingError) {
        console.error('QueueTracking: Error fetching booking:', bookingError);
        throw bookingError;
      }
      
        // console.log('QueueTracking: Booking data fetched successfully:', bookingData);
      setBooking(bookingData);

      // Calculate the patient's actual position in the doctor's queue manually
      const today = new Date().toISOString().split('T')[0];
      
      // Use the queue_number directly from the booking - it should be correct
      // The queue_number is calculated correctly in useBookings.ts
      setMyNumber(bookingData.queue_number);
      
      // Also fetch all bookings for this doctor to show waiting count
      const { data: doctorQueueData, error: doctorQueueError } = await supabase
        .from('bookings')
        .select('id, queue_number, status, patient_id, created_at')
        .eq('medical_center_id', bookingData.medical_center_id)
        .eq('doctor_id', bookingData.doctor_id)
        .eq('booking_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('queue_number', { ascending: true }); // Order by queue_number, not created_at

      if (doctorQueueError) {
        console.warn('QueueTracking: Error fetching doctor queue data:', doctorQueueError);
      } else {
        // Find the patient's position in the doctor's queue based on queue_number
        const patientIndex = doctorQueueData?.findIndex(booking => booking.id === bookingId);
        const patientPosition = patientIndex + 1;
        
        // Double-check: if the calculated position differs from stored queue_number, update it
        if (patientPosition !== bookingData.queue_number) {
          console.log(`🔧 Queue number mismatch detected: stored=${bookingData.queue_number}, calculated=${patientPosition}`);
          setMyNumber(patientPosition);
        }
        
        console.log('🔍 Queue position calculation (manual):', {
          bookingId,
          doctorId: bookingData.doctor_id,
          medicalCenterId: bookingData.medical_center_id,
          doctorQueueData: doctorQueueData?.map(b => ({ 
            id: b.id, 
            queue_number: b.queue_number, 
            status: b.status, 
            created_at: b.created_at,
            patient_id: b.patient_id
          })),
          patientIndex,
          patientPosition,
          originalQueueNumber: bookingData.queue_number,
          totalPatientsInQueue: doctorQueueData?.length || 0,
          currentPatientQueueNumber: bookingData.queue_number,
          isPositionCorrect: patientPosition === bookingData.queue_number
        });
      }

      // Get current queue number for the same doctor today
      const { data: currentQueueData, error: queueError } = await supabase
        .from('bookings')
        .select('queue_number')
        .eq('medical_center_id', bookingData.medical_center_id)
        .eq('doctor_id', bookingData.doctor_id)
        .eq('booking_date', today)
        .eq('status', 'in_progress')
        .order('queue_number', { ascending: true })
        .limit(1);

      if (queueError) {
        console.warn('QueueTracking: Error fetching current queue data:', queueError);
      }

      setCurrentNumber(currentQueueData?.[0]?.queue_number || 0);
      
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId, user]);

  useEffect(() => {
    fetchBookingData();
    
    // Set up real-time updates with auto-fix
    const interval = setInterval(() => {
      fetchBookingData();
      handleAutoFixQueuePosition();
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [fetchBookingData]);

  // Auto-fix queue position function
  const handleAutoFixQueuePosition = async () => {
    if (!bookingId) return;
    
    try {
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select('medical_center_id, doctor_id, queue_number, created_at')
        .eq('id', bookingId)
        .single();

      if (error || !bookingData) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Get all bookings for this doctor today ordered by queue_number
      const { data: doctorQueueData, error: doctorQueueError } = await supabase
        .from('bookings')
        .select('id, queue_number, status, patient_id, created_at')
        .eq('medical_center_id', bookingData.medical_center_id)
        .eq('doctor_id', bookingData.doctor_id)
        .eq('booking_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('queue_number', { ascending: true }); // Order by queue_number

      if (doctorQueueError || !doctorQueueData) return;

      // Find the patient's position in the doctor's queue based on queue_number order
      const patientIndex = doctorQueueData.findIndex(booking => booking.id === bookingId);
      const patientPosition = patientIndex + 1;
      
      // Auto-fix if position is wrong (this should rarely happen now)
      if (patientPosition !== bookingData.queue_number) {
        console.log(`🔧 Auto-fixing queue position: ${bookingData.queue_number} -> ${patientPosition}`);
        await supabase
          .from('bookings')
          .update({ queue_number: patientPosition })
          .eq('id', bookingId);
        
        setMyNumber(patientPosition);
      } else {
        // Ensure the display shows the correct number
        setMyNumber(bookingData.queue_number);
      }
      
    } catch (error) {
      console.error('Error in auto-fix queue position:', error);
    }
  };

  const waitingCount = Math.max(0, myNumber - currentNumber);
  const progress = myNumber > 0 ? Math.min(100, (currentNumber / myNumber) * 100) : 0;
  const isMyTurn = currentNumber >= myNumber;

  const bookingDetails = booking ? {
    centerName: booking.medical_center_name,
    serviceName: booking.service_name,
    bookingTime: booking.booking_time,
    estimatedTime: waitingCount > 0 ? `${waitingCount * 15} دقيقة` : "الآن"
  } : {
    centerName: "جاري التحميل...",
    serviceName: "جاري التحميل...",
    bookingTime: "جاري التحميل...",
    estimatedTime: "جاري التحميل..."
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الطابور...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-bl from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">لم يتم العثور على الحجز</p>
          <Link to="/patient/dashboard">
            <Button className="mt-4">العودة للقائمة</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-bl from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/patient/dashboard"
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              <span>العودة للرئيسية</span>
            </Link>
            <div className="text-sm text-muted-foreground">
              رقم الحجز: {bookingId}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Status Alert */}
        {isMyTurn && (
          <div className="mb-8">
            <Card className="border-accent bg-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 text-accent">
                  <CheckCircle className="h-8 w-8" />
                  <div>
                    <h3 className="text-xl font-bold">حان دورك الآن!</h3>
                    <p>يرجى التوجه إلى الاستقبال</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Queue Display */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Current Queue Numbers */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-lg font-medium text-muted-foreground mb-2">دورك</h2>
                <div className="text-6xl font-bold text-primary mb-2">{myNumber}</div>
                <p className="text-muted-foreground">رقم دورك في الطابور</p>
                {waitingCount > 0 && (
                  <p className="text-sm text-blue-600 mt-2 font-medium">
                    متبقي {waitingCount} شخص أمامك
                  </p>
                )}
                {waitingCount === 0 && myNumber > 0 && currentNumber > 0 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    دورك الآن!
                  </p>
                )}
                {waitingCount === 0 && myNumber > 0 && currentNumber === 0 && (
                  <p className="text-sm text-orange-600 mt-2 font-medium">
                    في انتظار بدء الطابور
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-lg font-medium text-muted-foreground mb-2">الدور الحالي</h2>
                <div className="text-6xl font-bold text-accent mb-2">{currentNumber}</div>
                <p className="text-muted-foreground">الدور الذي تتم خدمته الآن</p>
              </CardContent>
            </Card>
          </div>

          {/* Queue Progress */}
          <div className="flex flex-col justify-center space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground mb-2">
                      <Users className="h-6 w-6" />
                      <span>أمامك {waitingCount} منتظرين</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>التقدم</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <div className="font-medium text-foreground">وقت الحجز</div>
                      <div className="text-muted-foreground">{bookingDetails.bookingTime}</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">الوقت المتوقع</div>
                      <div className="text-muted-foreground">{bookingDetails.estimatedTime}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">تفاصيل الحجز</h3>
                <p className="text-muted-foreground">معلومات موعدك الطبي</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">المركز الطبي</h4>
                <p className="text-muted-foreground">{bookingDetails.centerName}</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">نوع الخدمة</h4>
                <p className="text-muted-foreground">{bookingDetails.serviceName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 justify-center">
          <Button variant="outline" size="lg">
            <Clock className="h-4 w-4 mr-2" />
            تأجيل الموعد
          </Button>
          <Button variant="outline" size="lg">
            إلغاء الحجز
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <PatientBottomNavigation />
      
      {/* Add bottom padding to prevent content from being hidden behind the bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default QueueTracking;
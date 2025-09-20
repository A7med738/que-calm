import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  ArrowLeft,
  Stethoscope, 
  MapPin, 
  Star, 
  Calendar, 
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMedicalCenter } from '@/hooks/useMedicalCenter';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import PatientBottomNavigation from '@/components/patient/PatientBottomNavigation';

interface BookingFormData {
  notes: string;
}

const BookingForm = () => {
  const { centerId, serviceId } = useParams<{ centerId: string; serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { center, services, loading: centerLoading } = useMedicalCenter(centerId || '');
  const { createBooking, loading: bookingLoading } = useBookings();
  const { toast } = useToast();

  const [step, setStep] = useState<'patient-info' | 'confirmation'>('patient-info');
  const [formData, setFormData] = useState<BookingFormData>({
    notes: ''
  });

  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    // console.log('BookingForm - services:', services);
    // console.log('BookingForm - serviceId:', serviceId);
    if (services && serviceId) {
      const service = services.find(s => s.id === serviceId);
      // console.log('BookingForm - found service:', service);
      setSelectedService(service);
    }
  }, [services, serviceId]);

  const handleInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      notes: value
    }));
  };

  const handleNextStep = () => {
    if (!user) {
      toast({
        title: "خطأ في المصادقة",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      navigate('/patient/login');
      return;
    }
    setStep('confirmation');
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !center) return;

    try {
      // console.log('Creating booking with data:', {
      //   medical_center_id: center.id,
      //   service_id: selectedService.id,
      //   notes: formData.notes
      // });

      const booking = await createBooking({
        medical_center_id: center.id,
        service_id: selectedService.id,
        notes: formData.notes
      });

      // console.log('Booking created successfully:', booking);

      toast({
        title: "تم الحجز بنجاح",
        description: "تم تأكيد حجزك وسيتم إشعارك عند اقتراب دورك",
      });

      // Navigate to queue tracking with the booking ID
      if (booking && booking.id) {
        // console.log('Navigating to queue tracking with booking ID:', booking.id);
        navigate(`/patient/queue/${booking.id}`);
      } else {
        // console.log('No booking ID available, navigating to dashboard');
        // Fallback to dashboard if booking ID is not available
        navigate('/patient/dashboard');
      }
    } catch (error) {
      console.error('Error in handleConfirmBooking:', error);
      toast({
        title: "خطأ في الحجز",
        description: "حدث خطأ أثناء تأكيد الحجز، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  if (centerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">المركز غير موجود</h2>
          <p className="text-muted-foreground mb-4">المركز المطلوب غير متاح</p>
          <Link to="/patient/dashboard">
            <Button>العودة للقائمة</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedService) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">الخدمة غير موجودة</h2>
          <p className="text-muted-foreground mb-4">الخدمة المطلوبة غير متاحة</p>
          <Link to={`/patient/center/${centerId}`}>
            <Button>العودة لتفاصيل المركز</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex justify-center sm:justify-start mb-4 sm:mb-6">
            <Link
              to={`/patient/center/${centerId}`}
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>العودة لتفاصيل المركز</span>
            </Link>
          </div>

          <div className="text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {step === 'patient-info' ? 'تأكيد معلومات الحجز' : 'تأكيد الحجز'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'patient-info' 
                ? 'تأكد من معلوماتك وأضف أي ملاحظات إضافية' 
                : 'تأكد من صحة المعلومات قبل تأكيد الحجز'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Service Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                تفاصيل الخدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedService.name}</h3>
                  <p className="text-primary font-medium">{selectedService.doctor_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedService.doctor_specialty}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{selectedService.price} جنيه</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{center.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>{center.rating}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{center.hours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>متاح الآن</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Patient Information */}
          {step === 'patient-info' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  تأكيد معلومات الحجز
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Information Display */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-muted-foreground">معلوماتك المسجلة</h4>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => navigate('/patient/dashboard?tab=profile')}
                       className="gap-2 text-xs"
                     >
                       <Edit className="h-3 w-3" />
                       تعديل المعلومات
                     </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {user?.user_metadata?.full_name || user?.email || 'غير محدد'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user?.email || 'غير محدد'}</span>
                    </div>
                    {user?.user_metadata?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.user_metadata.phone}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    هذه المعلومات ستُرسل للمركز الطبي مع طلب الحجز
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    ملاحظات إضافية
                  </label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="أي ملاحظات أو معلومات إضافية للمركز الطبي..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button onClick={handleNextStep} className="gap-2">
                    <span>التالي</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Confirmation */}
          {step === 'confirmation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  تأكيد الحجز
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Info Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">معلومات المريض</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.user_metadata?.full_name || user?.email || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.email || 'غير محدد'}</span>
                    </div>
                    {user?.user_metadata?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.user_metadata.phone}</span>
                      </div>
                    )}
                  </div>
                  {formData.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>ملاحظات:</strong> {formData.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Booking Summary */}
                <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">ملخص الحجز</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>الخدمة:</span>
                      <span className="font-medium">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الطبيب:</span>
                      <span className="font-medium">{selectedService.doctor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>التخصص:</span>
                      <span className="font-medium">{selectedService.doctor_specialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>السعر:</span>
                      <span className="font-bold text-primary">{selectedService.price} جنيه</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('patient-info')}
                    className="gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>تعديل المعلومات</span>
                  </Button>
                  
                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    className="gap-2 flex-1"
                  >
                    {bookingLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>جاري التأكيد...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>تأكيد الحجز</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <PatientBottomNavigation />
      
      {/* Add bottom padding to prevent content from being hidden behind the bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default BookingForm;

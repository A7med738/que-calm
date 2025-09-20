import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Users, Clock, CheckCircle, Building2 } from "lucide-react";

const QueueTracking = () => {
  const { bookingId } = useParams();
  const [currentNumber, setCurrentNumber] = useState(15);
  const [myNumber, setMyNumber] = useState(18);
  
  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNumber(prev => {
        if (prev < myNumber) {
          return prev + 1;
        }
        return prev;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [myNumber]);

  const waitingCount = Math.max(0, myNumber - currentNumber);
  const progress = Math.min(100, (currentNumber / myNumber) * 100);
  const isMyTurn = currentNumber >= myNumber;

  const bookingDetails = {
    centerName: "عيادة الدكتور محمد أحمد",
    serviceName: "كشف وتشخيص",
    bookingTime: "2:30 م",
    estimatedTime: "3:15 م"
  };

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
                    <p className="text-muted-foreground">الانتظار المتوقع: {Math.max(5, waitingCount * 5)} دقائق</p>
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
    </div>
  );
};

export default QueueTracking;
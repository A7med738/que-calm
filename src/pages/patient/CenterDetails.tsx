import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Star, User, Stethoscope, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMedicalCenter } from "@/hooks/useMedicalCenter";

const CenterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { center, services, loading: centerLoading, error: centerError } = useMedicalCenter(id || "");

  const handleBookService = async (serviceId: string, serviceName: string) => {
    if (!user) {
      toast({
        title: "خطأ في الحجز",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      navigate("/patient/login");
      return;
    }

    // Navigate to booking form
    navigate(`/patient/booking/${id}/${serviceId}`);
  };

  // Show loading state
  if (centerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات المركز...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (centerError || !center) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">خطأ في تحميل المركز</h1>
          <p className="text-muted-foreground mb-6">
            {centerError || "المركز الطبي غير موجود"}
          </p>
          <Button onClick={() => navigate("/patient/dashboard")}>
            العودة للرئيسية
          </Button>
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
              to="/patient/dashboard"
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>العودة للقائمة</span>
            </Link>
          </div>

          {/* Center Hero */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-2xl flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
            </div>
            
            <div className="flex-1 text-center sm:text-right w-full">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{center.name}</h1>
              <p className="text-lg sm:text-xl text-primary font-medium mb-3">{center.specialty}</p>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6 text-muted-foreground mb-4">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm sm:text-base">{center.rating}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base">{center.address}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base">{center.hours}</span>
                </div>
              </div>
              
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center sm:text-right">{center.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Services Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-foreground">الخدمات المتاحة</h2>
          <div className="grid gap-4 sm:gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2">
                            {service.name}
                          </h3>
                          {service.doctor_name && (
                            <div className="flex items-center gap-2 mb-3">
                              <User className="h-4 w-4 text-primary" />
                              <span className="text-sm sm:text-base text-primary font-medium">{service.doctor_name}</span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="text-xl sm:text-2xl font-bold text-primary">{service.price} جنيه</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="font-medium">
                                {service.waiting_count || 0} منتظرين
                              </span>
                              {(service.waiting_count || 0) > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  (متوقع: {(service.waiting_count || 0) * 15} دقيقة)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={
                            (service.waiting_count || 0) === 0 ? "default" :
                            (service.waiting_count || 0) <= 2 ? "secondary" : "destructive"
                          }
                          className={
                            (service.waiting_count || 0) === 0 ? "bg-green-100 text-green-800" :
                            (service.waiting_count || 0) <= 2 ? "bg-yellow-100 text-yellow-800" : 
                            "bg-red-100 text-red-800"
                          }
                        >
                          {(service.waiting_count || 0) === 0 ? "متاح فوراً" :
                           (service.waiting_count || 0) <= 2 ? "متاح قريباً" : 
                           (service.waiting_count || 0) <= 5 ? "مزدحم" : "مزدحم جداً"}
                        </Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleBookService(service.id, service.name)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto text-sm sm:text-base"
                        size="lg"
                      >
                        احجز دورك الآن
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CenterDetails;
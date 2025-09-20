import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Clock, Star, User, Stethoscope, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CenterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock center data
  const center = {
    id: Number(id),
    name: "عيادة الدكتور محمد أحمد",
    specialty: "طب الأسنان",
    image: "/placeholder.svg",
    rating: 4.8,
    address: "شارع الملك فهد، الرياض",
    phone: "011-234-5678",
    hours: "السبت - الخميس: 9:00 ص - 9:00 م",
    description: "عيادة متخصصة في طب الأسنان مع أحدث التقنيات والأجهزة الطبية. نقدم خدمات شاملة من التنظيف والحشوات إلى التقويم والزراعة.",
    services: [
      { id: 1, name: "كشف وتشخيص", price: 150, waitingCount: 3, estimatedWait: 15 },
      { id: 2, name: "تنظيف الأسنان", price: 200, waitingCount: 2, estimatedWait: 10 },
      { id: 3, name: "حشو الأسنان", price: 300, waitingCount: 5, estimatedWait: 25 },
      { id: 4, name: "استشارة تقويم", price: 100, waitingCount: 1, estimatedWait: 5 }
    ],
    doctors: [
      { name: "د. محمد أحمد", specialty: "استشاري طب الأسنان", experience: "15 سنة خبرة" },
      { name: "د. فاطمة السالم", specialty: "أخصائية تقويم الأسنان", experience: "8 سنوات خبرة" }
    ]
  };

  const handleBookService = (serviceId: number, serviceName: string) => {
    // Simulate booking
    const bookingId = Math.random().toString(36).substr(2, 9);
    
    toast({
      title: "تم حجز الدور بنجاح",
      description: `تم حجز دورك لخدمة ${serviceName}`,
    });
    
    navigate(`/patient/queue/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/patient/dashboard"
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              <span>العودة للقائمة</span>
            </Link>
          </div>

          {/* Center Hero */}
          <div className="flex gap-6 items-start">
            <div className="w-32 h-32 bg-muted rounded-2xl flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-16 w-16 text-muted-foreground" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{center.name}</h1>
              <p className="text-xl text-primary font-medium mb-3">{center.specialty}</p>
              
              <div className="flex items-center gap-6 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{center.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{center.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{center.hours}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">{center.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Services Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">الخدمات المتاحة</h2>
          <div className="grid gap-6">
            {center.services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-card-foreground mb-2">
                            {service.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="text-2xl font-bold text-primary">{service.price} ريال</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{service.waitingCount} منتظرين</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>الانتظار المتوقع: {service.estimatedWait} دقيقة</span>
                            </div>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={service.waitingCount <= 2 ? "default" : "secondary"}
                          className={service.waitingCount <= 2 ? "bg-accent text-accent-foreground" : ""}
                        >
                          {service.waitingCount <= 2 ? "متاح الآن" : "مزدحم"}
                        </Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleBookService(service.id, service.name)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
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

        {/* Doctors Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">الأطباء العاملون</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {center.doctors.map((doctor, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">{doctor.name}</h3>
                      <p className="text-primary font-medium">{doctor.specialty}</p>
                      <p className="text-sm text-muted-foreground">{doctor.experience}</p>
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
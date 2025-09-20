import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, Stethoscope, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-bl from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              نخبة الطب
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-4">
              نظام حديث لإدارة طوابير الانتظار في المراكز الطبية
            </p>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-12 px-4">
              احجز دورك بسهولة، تابع الطابور مباشرة، ووفر وقتك الثمين
            </p>

            {/* User Type Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto px-4">
              <Card className="p-4 sm:p-6 md:p-8 hover:shadow-lg transition-all duration-300 group">
                <div className="text-center">
                  <div className="bg-accent/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-accent/20 transition-colors">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-card-foreground">أنا مريض</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                    ابحث عن المراكز الطبية، احجز دورك، وتابع الطابور مباشرة
                  </p>
                  <Link to="/patient/login">
                    <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm sm:text-base">
                      تسجيل الدخول كمريض
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-4 sm:p-6 md:p-8 hover:shadow-lg transition-all duration-300 group">
                <div className="text-center">
                  <div className="bg-primary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-card-foreground">مركز طبي</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                    أدر طوابير مركزك الطبي بفعالية ونظم مواعيد المرضى
                  </p>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>خطوات الدخول:</strong><br/>
                      1. سجل دخولك من هنا أولاً<br/>
                      2. ثم ادخل الرقم التسلسلي للمركز
                    </p>
                  </div>
                  <Link to="/clinic/login">
                    <Button size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium text-sm sm:text-base">
                      تسجيل الدخول كمركز طبي
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/30 py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">مميزات النظام</h2>
            <p className="text-muted-foreground text-base sm:text-lg px-4">حلول ذكية لتحسين تجربة الرعاية الصحية</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center px-4">
              <div className="bg-accent/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">توفير الوقت</h3>
              <p className="text-sm sm:text-base text-muted-foreground">احجز دورك من المنزل وتجنب الانتظار الطويل</p>
            </div>

            <div className="text-center px-4">
              <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">رعاية أفضل</h3>
              <p className="text-sm sm:text-base text-muted-foreground">نظام منظم يحسن من جودة الخدمة الطبية</p>
            </div>

            <div className="text-center px-4 sm:col-span-2 md:col-span-1">
              <div className="bg-accent/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">سهولة الاستخدام</h3>
              <p className="text-sm sm:text-base text-muted-foreground">واجهة بسيطة ومفهومة للجميع</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Index;
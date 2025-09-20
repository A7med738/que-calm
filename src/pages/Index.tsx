import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, Stethoscope, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-bl from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              نخبة الطب
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              نظام حديث لإدارة طوابير الانتظار في المراكز الطبية
            </p>
            <p className="text-lg text-muted-foreground mb-12">
              احجز دورك بسهولة، تابع الطابور مباشرة، ووفر وقتك الثمين
            </p>

            {/* User Type Selection */}
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <Card className="p-8 hover:shadow-lg transition-all duration-300 group">
                <div className="text-center">
                  <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                    <Users className="h-10 w-10 text-accent" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-card-foreground">أنا مريض</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    ابحث عن المراكز الطبية، احجز دورك، وتابع الطابور مباشرة
                  </p>
                  <Link to="/patient/login">
                    <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium">
                      تسجيل الدخول كمريض
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-all duration-300 group">
                <div className="text-center">
                  <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-card-foreground">مركز طبي</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    أدر طوابير مركزك الطبي بفعالية ونظم مواعيد المرضى
                  </p>
                  <Link to="/clinic/login">
                    <Button size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium">
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
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">مميزات النظام</h2>
            <p className="text-muted-foreground text-lg">حلول ذكية لتحسين تجربة الرعاية الصحية</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">توفير الوقت</h3>
              <p className="text-muted-foreground">احجز دورك من المنزل وتجنب الانتظار الطويل</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">رعاية أفضل</h3>
              <p className="text-muted-foreground">نظام منظم يحسن من جودة الخدمة الطبية</p>
            </div>

            <div className="text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">سهولة الاستخدام</h3>
              <p className="text-muted-foreground">واجهة بسيطة ومفهومة للجميع</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
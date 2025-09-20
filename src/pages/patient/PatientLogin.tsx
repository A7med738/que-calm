import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Users, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const PatientLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp, signIn, loading } = useAuth();
  const { isAdmin, isClinicAdmin, isPatient, loading: roleLoading } = useUserRole();

  // Smart redirect based on user role
  useEffect(() => {
    if (user && !loading && !roleLoading) {
      if (isAdmin()) {
        navigate("/admin/dashboard", { replace: true });
      } else if (isClinicAdmin()) {
        navigate("/clinic/dashboard", { replace: true });
      } else if (isPatient()) {
        navigate("/patient/dashboard", { replace: true });
      } else {
        // Default to patient dashboard if no specific role
        navigate("/patient/dashboard", { replace: true });
      }
    }
  }, [user, loading, roleLoading, isAdmin, isClinicAdmin, isPatient, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            title: "خطأ في تسجيل الدخول",
            description: error.message === "Invalid login credentials" 
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: "مرحباً بك في نظام نخبة الطب",
          });
          // سيتم التوجيه تلقائياً بواسطة useEffect
        }
      } else {
        if (!name.trim()) {
          toast({
            title: "خطأ",
            description: "يرجى إدخال الاسم الكامل",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(email, password, name, phone);
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "البريد مستخدم مسبقاً",
              description: "هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام بريد آخر.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "خطأ في إنشاء الحساب",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: "تحقق من بريدك الإلكتروني لتأكيد الحساب",
          });
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-3 sm:mb-4 text-sm sm:text-base">
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>العودة للرئيسية</span>
          </Link>
          <div className="bg-accent/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {isLogin ? "تسجيل دخول المريض" : "إنشاء حساب مريض جديد"}
          </h1>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              {isLogin ? "أهلاً بعودتك" : "انضم إلينا اليوم"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {isLogin 
                ? "سجل دخولك للوصول إلى حسابك" 
                : "أنشئ حساباً جديداً لحجز المواعيد"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm sm:text-base">الاسم الكامل</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    required={!isLogin}
                    className="text-right text-sm sm:text-base"
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="text-right text-sm sm:text-base"
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm sm:text-base">تاريخ الميلاد (اختياري)</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="text-right text-sm sm:text-base"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    required
                    className="pr-9 sm:pr-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    required
                    className="pr-9 sm:pr-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm sm:text-base"
                size="lg"
                disabled={isSubmitting || loading}
              >
                {isSubmitting 
                  ? (isLogin ? "جاري تسجيل الدخول..." : "جاري إنشاء الحساب...") 
                  : (isLogin ? "تسجيل الدخول" : "إنشاء الحساب")
                }
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base"
              >
                {isLogin 
                  ? "ليس لديك حساب؟ أنشئ حساباً جديداً"
                  : "لديك حساب بالفعل؟ سجل دخولك"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientLogin;
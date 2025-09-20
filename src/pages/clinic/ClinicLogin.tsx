import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ClinicLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
      }

      // تسجيل دخول المستخدم
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${data.user.email}`,
        });

        // توجيه المستخدم إلى صفحة تسجيل دخول المركز
        navigate("/clinic/auth");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            تسجيل دخول المركز الطبي
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            الخطوة الأولى: سجل دخولك كمركز طبي
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              أهلاً بعودتكم
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              أدخلوا بيانات تسجيل الدخول للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="أدخل البريد الإلكتروني"
                    required
                    className="pr-9 sm:pr-10 text-right text-sm sm:text-base"
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
                    className="pr-9 sm:pr-10 text-right text-sm sm:text-base"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm sm:text-base"
                size="lg"
                disabled={loading}
              >
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                بعد تسجيل الدخول، ستتمكن من إدخال الرقم التسلسلي للمركز
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicLogin;

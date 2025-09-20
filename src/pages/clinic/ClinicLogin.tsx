import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Mail, Lock, MapPin, Phone, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClinicLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Simulate login
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة تحكم المركز الطبي",
      });
      navigate("/clinic/dashboard");
    } else {
      // Simulate registration
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "يمكنك الآن تسجيل الدخول وإدارة مركزك الطبي",
      });
      setIsLogin(true);
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
            {isLogin ? "دخول المركز الطبي" : "تسجيل مركز طبي جديد"}
          </h1>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              {isLogin ? "أهلاً بعودتكم" : "انضموا إلى شبكتنا"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {isLogin 
                ? "ادخلوا للوحة تحكم المركز" 
                : "سجلوا مركزكم الطبي في منصتنا"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="text-sm sm:text-base">اسم المركز الطبي</Label>
                  <Input
                    id="clinicName"
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="أدخل اسم المركز الطبي"
                    required={!isLogin}
                    className="text-right text-sm sm:text-base"
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="serialNumber" className="text-sm sm:text-base">الرقم التسلسلي</Label>
                  <div className="relative">
                    <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="serialNumber"
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="أدخل الرقم التسلسلي المخصص لمركزك"
                      required={!isLogin}
                      className="pr-9 sm:pr-10 text-right text-sm sm:text-base"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    هذا الرقم مخصص لمركزك الطبي للتحكم في إدارة المركز
                  </p>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm sm:text-base">العنوان</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="عنوان المركز الطبي"
                      required={!isLogin}
                      className="pr-9 sm:pr-10 text-right text-sm sm:text-base"
                    />
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="02-xxxx-xxxx"
                      required={!isLogin}
                      className="pr-9 sm:pr-10 text-right text-sm sm:text-base"
                    />
                  </div>
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
                    placeholder="clinic@example.com"
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm sm:text-base"
                size="lg"
              >
                {isLogin ? "تسجيل الدخول" : "تسجيل المركز"}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 transition-colors text-sm sm:text-base"
              >
                {isLogin 
                  ? "مركز جديد؟ سجل مركزك معنا"
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

export default ClinicLogin;
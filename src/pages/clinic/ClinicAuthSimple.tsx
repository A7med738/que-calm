import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ClinicAuthSimple = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!serialNumber.trim()) {
        throw new Error('الرقم التسلسلي مطلوب');
      }

      // التحقق من وجود مستخدم مسجل دخول (مطلوب للنظام الآمن)
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً كمركز طبي. يرجى تسجيل الدخول من الصفحة الرئيسية.');
      }

      // البحث عن المركز الطبي بالرقم التسلسلي
      const { data: medicalCenter, error: centerError } = await supabase
        .from('medical_centers')
        .select('*')
        .eq('serial_number', serialNumber.trim())
        .eq('status', 'active')
        .single();

      if (centerError || !medicalCenter) {
        throw new Error('الرقم التسلسلي غير صحيح أو المركز غير نشط');
      }

      // ربط المركز بالمستخدم (النظام الآمن)
      if (!medicalCenter.owner_id) {
        // ربط تلقائي للمركز الجديد
        const { error: updateError } = await supabase
          .from('medical_centers')
          .update({ owner_id: user.id })
          .eq('id', medicalCenter.id);

        if (updateError) {
          console.error('Error linking center to user:', updateError);
          throw new Error('خطأ في ربط المركز بالمستخدم');
        } else {
          // تحديث بيانات المركز المحلية
          medicalCenter.owner_id = user.id;
        }
      } else if (medicalCenter.owner_id !== user.id) {
        throw new Error('هذا المركز مربوط بمستخدم آخر. لا يمكنك الوصول إليه.');
      }

      // إنشاء جلسة آمنة للمركز
      const clinicSession = {
        medical_center: medicalCenter,
        serial_number: serialNumber,
        user_id: user.id, // مضمون وجوده في النظام الآمن
        login_time: new Date().toISOString()
      };

      // حفظ الجلسة في localStorage
      localStorage.setItem('clinic_session', JSON.stringify(clinicSession));

      // تسجيل عملية تسجيل الدخول في سجل الأنشطة
      try {
        await supabase.rpc('log_audit_event', {
          p_user_id: user.id,
          p_medical_center_id: medicalCenter.id,
          p_action: 'LOGIN',
          p_table_name: 'medical_centers',
          p_record_id: medicalCenter.id,
          p_new_values: { login_time: new Date().toISOString() }
        });
      } catch (auditError) {
        console.error('Error logging audit event:', auditError);
        // لا نوقف العملية إذا فشل تسجيل السجل
      }

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك في لوحة تحكم ${medicalCenter.name}`,
      });

      navigate("/clinic/dashboard");
    } catch (error) {
      console.error("Auth error:", error);
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
            دخول المركز الطبي
          </h1>
          {!user && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>تنبيه:</strong> يجب تسجيل الدخول أولاً من الصفحة الرئيسية قبل الدخول كمركز طبي.
              </p>
              <Link to="/" className="inline-block mt-2 text-sm text-amber-600 hover:text-amber-800 underline">
                تسجيل الدخول الآن
              </Link>
            </div>
          )}
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              أهلاً بعودتكم
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              أدخلوا الرقم التسلسلي للوصول إلى لوحة تحكم المركز
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-sm sm:text-base">الرقم التسلسلي</Label>
                <div className="relative">
                  <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    id="serialNumber"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="أدخل الرقم التسلسلي"
                    required
                    disabled={!user}
                    className="pr-9 sm:pr-10 text-right text-sm sm:text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  الرقم التسلسلي المخصص لمركزكم الطبي
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm sm:text-base"
                size="lg"
                disabled={loading || !user}
              >
                {loading ? "جاري تسجيل الدخول..." : !user ? "يجب تسجيل الدخول أولاً" : "تسجيل الدخول"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                لا تملك رقم تسلسلي؟ تواصل مع إدارة النظام
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicAuthSimple;

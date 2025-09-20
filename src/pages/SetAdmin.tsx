import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const SetAdmin = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const setAsAdmin = async () => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // إضافة المستخدم كـ admin
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });

      if (error) {
        // إذا كان موجود بالفعل، لا مشكلة
        if (error.code === '23505') {
          toast({
            title: "تم بالفعل",
            description: "أنت admin بالفعل!",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم تعيينك كـ admin!",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ: " + (error as Error).message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">تعيين Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                User ID: {user.id}
              </p>
              <Button 
                onClick={setAsAdmin}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'جاري...' : 'تعيين نفسي كـ Admin'}
              </Button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              يجب تسجيل الدخول أولاً
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetAdmin;

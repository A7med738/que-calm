import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface SmartRouterProps {
  children: React.ReactNode;
}

const SmartRouter = ({ children }: SmartRouterProps) => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading, isAdmin, isClinicAdmin, isPatient } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // انتظار انتهاء التحميل
    if (authLoading || roleLoading) {
      return;
    }

    // إذا كان المستخدم مسجل دخول
    if (user) {
      // التحقق من نوع المستخدم والتوجيه المناسب
      if (isAdmin()) {
        // console.log('User is admin, redirecting to admin dashboard');
        navigate('/admin/dashboard', { replace: true });
      } else if (isClinicAdmin()) {
        // console.log('User is clinic admin, redirecting to clinic dashboard');
        navigate('/clinic/dashboard', { replace: true });
      } else if (isPatient()) {
        // console.log('User is patient, redirecting to patient dashboard');
        navigate('/patient/dashboard', { replace: true });
      } else {
        // إذا لم يكن لديه دور محدد، افترض أنه مريض
        // console.log('User has no specific role, defaulting to patient dashboard');
        navigate('/patient/dashboard', { replace: true });
      }
    }
    // إذا لم يكن مسجل دخول، اتركه في الصفحة الحالية (صفحة الاختيار)
  }, [user, authLoading, roleLoading, isAdmin, isClinicAdmin, isPatient, navigate]);

  // عرض شاشة التحميل أثناء التحقق من حالة المستخدم
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من حالة المستخدم...</p>
        </div>
      </div>
    );
  }

  // إذا كان المستخدم مسجل دخول، لا تعرض المحتوى (سيتم التوجيه)
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التوجيه...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن مسجل دخول، اعرض المحتوى (صفحة الاختيار)
  return <>{children}</>;
};

export default SmartRouter;

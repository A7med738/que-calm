# إصلاح خطأ User Roles

## 🚨 المشكلة:
```
Error: infinite recursion detected in policy for relation "user_roles"
```

## 🔍 السبب:
المشكلة في سياسات الأمان (RLS policies) لجدول `user_roles`. السياسات تحاول التحقق من دور المستخدم من نفس الجدول الذي نحاول قراءته منه، مما يسبب recursion لا نهائي.

## ✅ الحل:

### **الخطوة 1: تشغيل Migration الجديد**
```sql
-- في Supabase Dashboard، قم بتشغيل:
supabase/migrations/20250120000002_fix_user_roles_policies.sql
```

### **الخطوة 2: التحقق من الإصلاح**
1. **أعد تحميل الصفحة**
2. **تأكد من عدم ظهور الخطأ** في Console
3. **تحقق من ظهور أيقونة الإدارة** في الملف الشخصي

## 🔧 ما تم إصلاحه:

### **1. سياسات الأمان الجديدة:**
- **إزالة السياسات المتكررة** التي تسبب recursion
- **سياسات مبسطة** تعتمد على user ID مباشرة
- **تحقق مباشر** من المستخدم المحدد كـ admin

### **2. دوال محسنة:**
```sql
-- دالة is_admin محسنة
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is the specific admin user
  IF user_uuid = '130f849a-d894-4ce6-a78e-0df3812093de'::uuid THEN
    RETURN TRUE;
  END IF;
  
  -- For other users, check the user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;
```

### **3. Hook محسن:**
- **معالجة أخطاء السياسات** بشكل أفضل
- **Fallback mechanism** عند فشل جلب الدور
- **تحقق مباشر** من المستخدم المحدد كـ admin

## 🎯 النتيجة المتوقعة:

### **بعد الإصلاح:**
1. **لا توجد أخطاء** في Console
2. **أيقونة الإدارة تظهر** في الملف الشخصي للمدير
3. **الوصول إلى لوحة الإدارة** يعمل بشكل طبيعي
4. **جميع الوظائف** تعمل بدون مشاكل

### **للمستخدم المحدد (130f849a-d894-4ce6-a78e-0df3812093de):**
- **Badge "مدير النظام"** يظهر في الملف الشخصي
- **زر "لوحة تحكم الإدارة"** يظهر في إعدادات الحساب
- **الوصول المباشر** إلى `/admin/dashboard`

## 🔄 إذا استمر الخطأ:

### **الحل البديل:**
1. **احذف جدول user_roles** مؤقتاً
2. **أعد إنشاؤه** بدون سياسات معقدة
3. **أضف المستخدم كـ admin** يدوياً

### **أو استخدم الحل المؤقت:**
```typescript
// في useUserRole.ts، استخدم هذا التحقق المؤقت:
const isAdmin = () => {
  return user?.id === '130f849a-d894-4ce6-a78e-0df3812093de';
};
```

## 📋 خطوات التحقق:

1. ✅ **تشغيل Migration الجديد**
2. ✅ **إعادة تحميل الصفحة**
3. ✅ **تسجيل دخول المستخدم المحدد**
4. ✅ **الذهاب إلى تبويب "حسابي"**
5. ✅ **التحقق من ظهور أيقونة الإدارة**
6. ✅ **اختبار الوصول إلى لوحة الإدارة**

النظام سيعمل بشكل طبيعي بعد تطبيق هذا الإصلاح! 🚀

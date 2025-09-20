# إصلاح خطأ سياسات الخدمات

## 🚨 المشكلة:
```
ERROR: 42710: policy "Admins can manage all services" for table "services" already exists
```

## 🔍 السبب:
السياسة `"Admins can manage all services"` موجودة بالفعل في قاعدة البيانات، والمحاولة لإنشائها مرة أخرى تسبب خطأ.

## ✅ الحل:

### **الخطوة 1: تشغيل Migration الآمن الجديد**
```sql
-- في Supabase Dashboard، قم بتشغيل:
supabase/migrations/20250120000008_fix_services_policies.sql
```

### **الخطوة 2: التحقق من الإصلاح**
1. **أعد تحميل الصفحة**
2. **اذهب إلى** `http://localhost:8082/clinic/auth`
3. **سجل دخول** برقم تسلسلي صحيح
4. **انقر على تبويب "إدارة الخدمات"**
5. **انقر "إضافة خدمة"**
6. **املأ البيانات وانقر "إضافة الخدمة"**

## 🔧 ما تم إصلاحه:

### **1. Migration آمن:**
```sql
-- التحقق من وجود الأعمدة قبل إضافتها
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'doctor_name') THEN
        ALTER TABLE public.services ADD COLUMN doctor_name TEXT;
    END IF;
END $$;
```

### **2. حذف السياسات بأمان:**
```sql
-- التحقق من وجود السياسات قبل حذفها
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Admins can manage all services') THEN
        DROP POLICY "Admins can manage all services" ON public.services;
    END IF;
END $$;
```

### **3. إنشاء السياسات الجديدة:**
```sql
-- سياسات محدثة للخدمات
CREATE POLICY "Users can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Clinic admins can manage their services" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all services" ON public.services
  FOR ALL USING (public.is_admin());
```

## 🎯 النتيجة المتوقعة:

### **بعد الإصلاح:**
- ✅ **إنشاء الخدمات** يعمل بدون أخطاء
- ✅ **حفظ جميع البيانات** - اسم الطبيب، التخصص، الحالة
- ✅ **عرض الخدمات** في قائمة الخدمات
- ✅ **تعديل الخدمات** يعمل بشكل صحيح
- ✅ **تفعيل/إلغاء تفعيل** يعمل بدون مشاكل

### **للمراكز الطبية:**
- ✅ **إضافة الخدمات** يعمل بدون مشاكل
- ✅ **تعديل الخدمات** يعمل بشكل صحيح
- ✅ **إدارة الحالة** يعمل بدون أخطاء
- ✅ **جميع الوظائف** متاحة

## 🔄 إذا استمر الخطأ:

### **الحل اليدوي:**
```sql
-- 1. حذف السياسات الموجودة يدوياً
DROP POLICY IF EXISTS "Users can view services" ON public.services;
DROP POLICY IF EXISTS "Clinic admins can manage their services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;

-- 2. إضافة الأعمدة المفقودة
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_specialty TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. تحديث السجلات الموجودة
UPDATE public.services 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

-- 4. جعل الحقل مطلوب
ALTER TABLE public.services 
ALTER COLUMN is_active SET NOT NULL;

-- 5. إنشاء الفهرس
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- 6. إنشاء السياسات الجديدة
CREATE POLICY "Users can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Clinic admins can manage their services" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all services" ON public.services
  FOR ALL USING (public.is_admin());
```

## 📋 خطوات التحقق:

1. ✅ **تشغيل Migration الآمن الجديد**
2. ✅ **إعادة تحميل الصفحة**
3. ✅ **الذهاب إلى** `/clinic/auth`
4. ✅ **اختبار إضافة خدمة جديدة**
5. ✅ **التحقق من ظهور الخدمة في القائمة**
6. ✅ **اختبار تعديل الخدمة**
7. ✅ **اختبار تفعيل/إلغاء تفعيل**

## 🚀 النتيجة النهائية:

النظام سيعمل بشكل طبيعي بعد تطبيق هذا الإصلاح! 🎉

### **المميزات:**
- **إنشاء الخدمات** يعمل بدون أخطاء
- **حفظ جميع البيانات** بشكل صحيح
- **إدارة شاملة** للخدمات
- **أداء محسن** بدون أخطاء قاعدة البيانات

### **للمراكز الطبية:**
- **إضافة الخدمات** يعمل بدون مشاكل
- **تعديل الخدمات** يعمل بشكل صحيح
- **إدارة الحالة** يعمل بدون أخطاء
- **جميع الوظائف** متاحة

الآن يمكنك إضافة الخدمات بدون مشاكل! 🚀

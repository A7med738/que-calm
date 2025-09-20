# إصلاح خطأ إنشاء الخدمات

## 🚨 المشكلة:
```
Failed to load resource: the server responded with a status of 400
Error creating service: Object
```

## 🔍 السبب:
المشكلة أن جدول `services` في قاعدة البيانات لا يحتوي على الحقول المطلوبة:
- `doctor_name` - اسم الطبيب
- `doctor_specialty` - تخصص الطبيب  
- `is_active` - حالة النشاط

## ✅ الحل:

### **الخطوة 1: تشغيل Migration الجديد**
```sql
-- في Supabase Dashboard، قم بتشغيل:
supabase/migrations/20250120000007_update_services_table.sql
```

### **الخطوة 2: التحقق من الإصلاح**
1. **أعد تحميل الصفحة**
2. **اذهب إلى** `http://localhost:8082/clinic/auth`
3. **سجل دخول** برقم تسلسلي صحيح
4. **انقر على تبويب "إدارة الخدمات"**
5. **انقر "إضافة خدمة"**
6. **املأ البيانات وانقر "إضافة الخدمة"**

## 🔧 ما تم إصلاحه:

### **1. تحديث جدول services:**
```sql
-- إضافة الحقول المفقودة
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_specialty TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- تحديث السجلات الموجودة
UPDATE public.services 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

-- جعل الحقل مطلوب
ALTER TABLE public.services 
ALTER COLUMN is_active SET NOT NULL;
```

### **2. تحديث RLS Policies:**
```sql
-- سياسات جديدة للخدمات
CREATE POLICY "Users can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Clinic admins can manage their services" ON public.services
  FOR ALL USING (
    medical_center_id IN (
      SELECT id FROM public.medical_centers 
      WHERE admin_id = auth.uid()
    )
  );
```

### **3. تحديث Hook useClinicServices:**
```typescript
// إصلاح دالة createService
const createService = async (serviceData: ServiceForm) => {
  const { data, error } = await supabase
    .from('services')
    .insert({
      name: serviceData.name,
      description: serviceData.description,
      price: serviceData.price,
      duration_minutes: serviceData.duration_minutes,
      doctor_name: serviceData.doctor_name,
      doctor_specialty: serviceData.doctor_specialty,
      medical_center_id: medicalCenterId,
      is_active: true,
      status: 'active'
    })
    .select()
    .single();
};
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

### **الحل البديل:**
```sql
-- حذف وإعادة إنشاء جدول services
DROP TABLE IF EXISTS public.services CASCADE;

-- إعادة إنشاء الجدول بالحقول الصحيحة
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_center_id UUID NOT NULL REFERENCES public.medical_centers(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  doctor_name TEXT,
  doctor_specialty TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## 📋 خطوات التحقق:

1. ✅ **تشغيل Migration الجديد**
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

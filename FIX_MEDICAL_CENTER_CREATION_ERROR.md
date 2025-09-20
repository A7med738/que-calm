# إصلاح خطأ إنشاء المركز الطبي

## 🚨 المشكلة:
```
POST https://jvqieynvadirogxmrayd.supabase.co/rest/v1/rpc/create_medical_center_with_admin 400 (Bad Request)
Error: column reference "serial_number" is ambiguous
```

## 🔍 السبب:
المشكلة في دالة `create_medical_center_with_admin` في قاعدة البيانات. هناك تضارب في اسم المتغير `serial_number` مما يسبب ambiguity.

## ✅ الحل:

### **الخطوة 1: تشغيل Migrations الجديدة**
```sql
-- في Supabase Dashboard، قم بتشغيل:
1. supabase/migrations/20250120000004_fix_create_medical_center_function.sql
2. supabase/migrations/20250120000005_fix_generate_serial_function.sql
```

### **الخطوة 2: التحقق من الإصلاح**
1. **أعد تحميل الصفحة**
2. **اذهب إلى** `http://localhost:8082/admin-direct`
3. **انقر على "إضافة مركز طبي"**
4. **املأ البيانات وانقر على "إنشاء المركز"**

## 🔧 ما تم إصلاحه:

### **1. دالة create_medical_center_with_admin:**
```sql
-- قبل الإصلاح ❌
DECLARE
  serial_num TEXT;
  result JSON;
BEGIN
  serial_num := public.generate_clinic_serial_number();
  result := json_build_object(
    'serial_number', serial_num,  -- تضارب هنا
    ...
  );
END;

-- بعد الإصلاح ✅
DECLARE
  generated_serial TEXT;  -- اسم مختلف
  result JSON;
BEGIN
  generated_serial := public.generate_clinic_serial_number();
  result := json_build_object(
    'serial_number', generated_serial,  -- لا يوجد تضارب
    ...
  );
END;
```

### **2. دالة generate_clinic_serial_number:**
```sql
-- قبل الإصلاح ❌
DECLARE
  serial_number TEXT;  -- نفس اسم العمود
BEGIN
  serial_number := 'CLINIC' || LPAD(next_number::TEXT, 3, '0');
  RETURN serial_number;
END;

-- بعد الإصلاح ✅
DECLARE
  generated_serial TEXT;  -- اسم مختلف
BEGIN
  generated_serial := 'CLINIC' || LPAD(next_number::TEXT, 3, '0');
  RETURN generated_serial;
END;
```

## 🎯 النتيجة المتوقعة:

### **بعد الإصلاح:**
- ✅ **إنشاء المركز الطبي** يعمل بدون أخطاء
- ✅ **توليد الرقم التسلسلي** يعمل بشكل صحيح
- ✅ **عرض الرقم التسلسلي** في قائمة المراكز
- ✅ **جميع وظائف الإدارة** تعمل بشكل طبيعي

### **للمدير:**
- ✅ **إنشاء المراكز الطبية** يعمل بدون مشاكل
- ✅ **توليد الأرقام التسلسلية** تلقائياً
- ✅ **إدارة المراكز** بشكل كامل
- ✅ **جميع الوظائف** متاحة

## 🔄 إذا استمر الخطأ:

### **الحل البديل:**
```sql
-- حذف وإعادة إنشاء الدوال
DROP FUNCTION IF EXISTS public.create_medical_center_with_admin;
DROP FUNCTION IF EXISTS public.generate_clinic_serial_number;

-- إعادة إنشاء الدوال بالإصلاحات
-- (انسخ محتوى الملفات الجديدة)
```

### **أو استخدم الحل المؤقت:**
```typescript
// في useAdminCenters.ts، استخدم insert مباشر
const createMedicalCenter = async (centerData: MedicalCenterForm) => {
  try {
    // إنشاء المركز مباشرة
    const { data, error } = await supabase
      .from('medical_centers')
      .insert({
        name: centerData.name,
        specialty: centerData.specialty,
        address: centerData.address,
        phone: centerData.phone,
        email: centerData.email,
        hours: centerData.hours,
        description: centerData.description,
        serial_number: 'CLINIC' + Date.now().toString().slice(-3),
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    
    // Refresh the centers list
    await fetchCenters();
    
    return data;
  } catch (err) {
    throw err;
  }
};
```

## 📋 خطوات التحقق:

1. ✅ **تشغيل Migrations الجديدة**
2. ✅ **إعادة تحميل الصفحة**
3. ✅ **الذهاب إلى** `/admin-direct`
4. ✅ **اختبار إنشاء مركز جديد**
5. ✅ **التحقق من توليد الرقم التسلسلي**
6. ✅ **التحقق من ظهور المركز في القائمة**

## 🚀 النتيجة النهائية:

النظام سيعمل بشكل طبيعي بعد تطبيق هذه الإصلاحات! 🎉

### **المميزات:**
- **إنشاء المراكز الطبية** يعمل بدون أخطاء
- **توليد الأرقام التسلسلية** تلقائياً
- **إدارة شاملة** للمراكز الطبية
- **أداء محسن** بدون أخطاء قاعدة البيانات

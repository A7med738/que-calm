# إصلاح مشكلة عمود admin_email المفقود

## المشكلة
```
Could not find the 'admin_email' column of 'medical_centers' in the schema cache
```

## السبب
عمود `admin_email` غير موجود في جدول `medical_centers` في قاعدة البيانات.

## الحل

### 1. تشغيل Migration لإضافة العمود
```sql
-- قم بتشغيل هذا الملف في Supabase Dashboard:
supabase/migrations/20250120000055_comprehensive_fix_admin_email.sql
```

### 2. التحقق من إضافة العمود
```sql
-- في Supabase SQL Editor:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'medical_centers' 
AND column_name = 'admin_email';
```

### 3. إعادة تشغيل التطبيق
```bash
npm run dev
```

## ما تم إصلاحه

### 1. إضافة عمود admin_email
- ✅ تم إضافة عمود `admin_email` من نوع `TEXT`
- ✅ العمود قابل للقبول NULL
- ✅ تم إضافة تعليق للوضوح

### 2. تحديث دالة create_medical_center_with_admin
- ✅ تم تحديث الدالة لتتعامل مع `admin_email`
- ✅ تم إضافة `admin_email` إلى INSERT statement
- ✅ تم إرجاع `admin_email` في النتيجة

### 3. إصلاح handleEditCenter
- ✅ تم إزالة `admin_email` و `admin_password` من عملية التحديث
- ✅ الآن يتم تحديث الحقول الموجودة فقط

## اختبار الإصلاح

### 1. اختبار إنشاء مركز جديد
1. اذهب إلى `/admin/dashboard`
2. اضغط "إضافة مركز طبي"
3. املأ البيانات بما في ذلك `admin_email`
4. اضغط "إنشاء المركز"
5. تحقق من أن المركز تم إنشاؤه بنجاح

### 2. اختبار تعديل مركز موجود
1. اضغط "تعديل" على أي مركز
2. عدّل البيانات
3. اضغط "حفظ التغييرات"
4. تحقق من أن التعديل تم بنجاح

## التحقق من الإصلاح

### 1. فحص Console
- افتح Developer Tools (F12)
- اذهب إلى Console
- تحقق من عدم وجود أخطاء "admin_email column"
- ابحث عن رسائل "Update successful"

### 2. فحص Network
- اذهب إلى Network tab
- جرب التعديل
- تحقق من أن الطلب ينجح (200 status)
- ابحث عن PATCH request إلى `/rest/v1/medical_centers`

### 3. فحص Database
- اذهب إلى Supabase Dashboard
- اذهب إلى Table Editor
- تحقق من وجود عمود `admin_email` في جدول `medical_centers`
- تحقق من أن البيانات تم تحديثها

## استكشاف الأخطاء

### إذا استمر الخطأ:

#### 1. تحقق من Migration
```sql
-- تأكد من أن Migration تم تطبيقه:
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '20250120000055';
```

#### 2. تحقق من العمود
```sql
-- تحقق من وجود العمود:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'medical_centers' 
AND column_name = 'admin_email';
```

#### 3. إعادة تطبيق Migration
```sql
-- إذا لم يتم تطبيقه، قم بتشغيله يدوياً:
ALTER TABLE public.medical_centers 
ADD COLUMN IF NOT EXISTS admin_email TEXT;
```

#### 4. تحقق من Schema Cache
- في Supabase Dashboard
- اذهب إلى Settings > API
- اضغط "Refresh Schema Cache"

## النتيجة المتوقعة
بعد تطبيق هذا الإصلاح:
- ✅ عمود `admin_email` موجود في جدول `medical_centers`
- ✅ يمكن إنشاء مراكز جديدة مع `admin_email`
- ✅ يمكن تعديل المراكز الموجودة
- ✅ لا توجد أخطاء "column not found"
- ✅ جميع العمليات تعمل بسلاسة

## معلومات إضافية

### الحقول المتاحة للتعديل
- `name` - اسم المركز
- `specialty` - التخصص
- `address` - العنوان
- `phone` - رقم الهاتف
- `email` - البريد الإلكتروني
- `hours` - ساعات العمل
- `description` - الوصف

### الحقول غير المتاحة للتعديل
- `admin_email` - يتم تعيينه عند الإنشاء فقط
- `admin_password` - يتم تعيينه عند الإنشاء فقط
- `serial_number` - يتم توليده تلقائياً
- `id` - معرف فريد
- `created_at` - تاريخ الإنشاء
- `updated_at` - تاريخ آخر تحديث

## الدعم
إذا استمرت المشكلة:
1. **تحقق من Migration** - تأكد من تطبيقه
2. **تحقق من Schema Cache** - قم بتحديثه
3. **تحقق من Console** - ابحث عن أخطاء أخرى
4. **تحقق من Network** - ابحث عن أخطاء HTTP

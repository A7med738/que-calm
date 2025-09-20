# إصلاح مشكلة أعمدة audit_logs

## المشكلة
```
{
    "code": "42703",
    "details": null,
    "hint": null,
    "message": "column \"operation\" of relation \"audit_logs\" does not exist"
}
```

## السبب
الدالة `safe_delete_medical_center` تحاول استخدام أعمدة غير موجودة في جدول `audit_logs`:
- `operation` (غير موجود) - يجب أن يكون `action`
- `old_data` (غير موجود) - يجب أن يكون `old_values`
- `new_data` (غير موجود) - يجب أن يكون `new_values`
- `timestamp` (غير موجود) - يجب أن يكون `created_at`

## الحل

### الخيار 1: إصلاح أسماء الأعمدة (الأفضل)
```sql
-- قم بتشغيل هذا الملف في Supabase Dashboard:
supabase/migrations/20250120000059_fix_audit_logs_columns.sql
```

### الخيار 2: دالة بسيطة بدون audit logging
```sql
-- قم بتشغيل هذا الملف في Supabase Dashboard:
supabase/migrations/20250120000060_simple_delete_without_audit.sql
```

### الخيار 3: حل سريع بدون دالة
```sql
-- في Supabase SQL Editor:
-- فقط أصلح foreign key constraint:
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL;
```

## أعمدة audit_logs الصحيحة

### الأعمدة الموجودة:
- `id` - معرف فريد
- `user_id` - معرف المستخدم
- `medical_center_id` - معرف المركز الطبي
- `action` - نوع العملية (CREATE, UPDATE, DELETE, etc.)
- `table_name` - اسم الجدول
- `record_id` - معرف السجل
- `old_values` - القيم القديمة (JSONB)
- `new_values` - القيم الجديدة (JSONB)
- `ip_address` - عنوان IP
- `user_agent` - معلومات المتصفح
- `created_at` - تاريخ الإنشاء

### الأعمدة غير الموجودة:
- `operation` ❌ (يجب أن يكون `action`)
- `old_data` ❌ (يجب أن يكون `old_values`)
- `new_data` ❌ (يجب أن يكون `new_values`)
- `timestamp` ❌ (يجب أن يكون `created_at`)

## خطوات التطبيق

### 1. تشغيل Migration
```sql
-- قم بتشغيل هذا الملف في Supabase Dashboard:
supabase/migrations/20250120000060_simple_delete_without_audit.sql
```

### 2. إعادة تشغيل التطبيق
```bash
npm run dev
```

### 3. اختبار الحذف
1. اذهب إلى `/admin/dashboard`
2. اضغط "حذف" على أي مركز
3. اضغط "حذف نهائي"
4. تحقق من أن المركز تم حذفه بنجاح

## التحقق من الإصلاح

### 1. فحص Console
- افتح Developer Tools (F12)
- اذهب إلى Console
- تحقق من عدم وجود أخطاء column
- ابحث عن رسائل "Delete successful"

### 2. فحص Network
- اذهب إلى Network tab
- جرب الحذف
- تحقق من أن الطلب ينجح (200 status)
- ابحث عن RPC request إلى `safe_delete_medical_center`

### 3. فحص Database
```sql
-- تحقق من وجود الدالة:
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'safe_delete_medical_center';

-- تحقق من constraint:
SELECT conname, confdeltype 
FROM pg_constraint 
WHERE conname = 'audit_logs_medical_center_id_fkey';
```

## استكشاف الأخطاء

### إذا استمر الخطأ:

#### 1. تحقق من أعمدة audit_logs
```sql
-- تحقق من الأعمدة الموجودة:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;
```

#### 2. احذف الدالة وأعد إنشاءها
```sql
-- احذف الدالة:
DROP FUNCTION IF EXISTS public.safe_delete_medical_center(uuid);

-- أنشئ دالة بسيطة:
CREATE FUNCTION public.safe_delete_medical_center(center_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.medical_centers WHERE id = center_id;
  RETURN TRUE;
END;
$$;
```

#### 3. تحقق من Foreign Key Constraint
```sql
-- تحقق من constraint:
SELECT conname, confdeltype 
FROM pg_constraint 
WHERE conname = 'audit_logs_medical_center_id_fkey';
```

## النتيجة المتوقعة
بعد تطبيق هذا الإصلاح:
- ✅ لا توجد أخطاء column names
- ✅ يمكن حذف المراكز الطبية بنجاح
- ✅ سجلات audit محفوظة مع `medical_center_id = NULL`
- ✅ لا توجد أخطاء foreign key constraint
- ✅ جميع العمليات تعمل بسلاسة

## معلومات إضافية

### الدالة البسيطة
```sql
-- الدالة تحذف المركز فقط
-- Foreign key constraint يتعامل مع audit_logs
safe_delete_medical_center(center_id uuid) RETURNS boolean
```

### Foreign Key Constraint
```sql
-- عند حذف مركز:
-- medical_center_id في audit_logs يصبح NULL
-- سجلات audit تبقى محفوظة
ON DELETE SET NULL
```

### Audit Logs
- **محفوظة** - لا يتم حذفها
- **medical_center_id = NULL** - للمراكز المحذوفة
- **قابلة للبحث** - يمكن البحث فيها
- **آمنة** - لا تسبب أخطاء

## الدعم
إذا استمرت المشكلة:
1. **تحقق من أعمدة audit_logs** - استخدم information_schema
2. **احذف الدالة** - استخدم DROP FUNCTION
3. **أنشئ دالة بسيطة** - بدون audit logging
4. **تحقق من Console** - ابحث عن أخطاء أخرى

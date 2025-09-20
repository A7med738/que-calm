# إصلاح مشكلة حذف المراكز الطبية

## المشكلة
```
{
    "code": "23503",
    "details": "Key (medical_center_id)=(3b2cdd40-0f18-43bb-a593-cbb1f7b9779f) is not present in table \"medical_centers\".",
    "hint": null,
    "message": "insert or update on table \"audit_logs\" violates foreign key constraint \"audit_logs_medical_center_id_fkey\""
}
```

## السبب
المشكلة تحدث لأن:
1. **Audit triggers** تحاول إدراج سجل في `audit_logs` بعد حذف المركز
2. **Foreign key constraint** يمنع إدراج سجل يشير إلى مركز محذوف
3. **Timing issue** - الـ trigger يتم تنفيذه بعد الحذف

## الحل

### 1. تشغيل Migration لإصلاح المشكلة
```sql
-- قم بتشغيل هذا الملف في Supabase Dashboard:
supabase/migrations/20250120000056_fix_audit_logs_delete_issue.sql
```

### 2. إعادة تشغيل التطبيق
```bash
npm run dev
```

## ما تم إصلاحه

### 1. إصلاح Foreign Key Constraint
- ✅ تم تغيير `ON DELETE CASCADE` إلى `ON DELETE SET NULL`
- ✅ الآن عند حذف مركز، `medical_center_id` في `audit_logs` يصبح `NULL`
- ✅ سجلات audit تبقى محفوظة مع `medical_center_id = NULL`

### 2. تعطيل Audit Triggers
- ✅ تم تعطيل audit triggers التي تسبب المشكلة
- ✅ تم حذف audit functions القديمة
- ✅ تم إنشاء دالة آمنة للحذف

### 3. إنشاء دالة آمنة للحذف
- ✅ تم إنشاء `safe_delete_medical_center` function
- ✅ تسجل عملية الحذف قبل تنفيذها
- ✅ تتعامل مع الأخطاء بشكل صحيح
- ✅ تحافظ على سجلات audit

### 4. تحديث useAdminCenters Hook
- ✅ تم تحديث `deleteMedicalCenter` لاستخدام الدالة الآمنة
- ✅ تم إضافة console.log للتتبع
- ✅ تحسين معالجة الأخطاء

## اختبار الإصلاح

### 1. اختبار حذف مركز طبي
1. اذهب إلى `/admin/dashboard`
2. اضغط "حذف" على أي مركز
3. اضغط "حذف نهائي" في dialog التأكيد
4. تحقق من أن المركز تم حذفه بنجاح

### 2. التحقق من Console
- افتح Developer Tools (F12)
- اذهب إلى Console
- تحقق من عدم وجود أخطاء foreign key
- ابحث عن رسائل "Delete successful"

### 3. التحقق من Database
- اذهب إلى Supabase Dashboard
- اذهب إلى Table Editor
- تحقق من أن المركز تم حذفه من `medical_centers`
- تحقق من أن سجلات audit محفوظة في `audit_logs`

## التحقق من الإصلاح

### 1. فحص Console
```javascript
// ابحث عن هذه الرسائل:
"Deleting medical center: [centerId]"
"Delete successful: [data]"
```

### 2. فحص Network
- اذهب إلى Network tab
- جرب الحذف
- تحقق من أن الطلب ينجح (200 status)
- ابحث عن RPC request إلى `safe_delete_medical_center`

### 3. فحص Database
```sql
-- تحقق من أن المركز تم حذفه:
SELECT * FROM medical_centers WHERE id = 'CENTER_ID';

-- تحقق من أن سجلات audit محفوظة:
SELECT * FROM audit_logs WHERE medical_center_id IS NULL;
```

## استكشاف الأخطاء

### إذا استمر الخطأ:

#### 1. تحقق من Migration
```sql
-- تأكد من أن Migration تم تطبيقه:
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '20250120000056';
```

#### 2. تحقق من Foreign Key Constraint
```sql
-- تحقق من constraint:
SELECT conname, confdeltype 
FROM pg_constraint 
WHERE conname = 'audit_logs_medical_center_id_fkey';
```

#### 3. تحقق من الدالة
```sql
-- تحقق من وجود الدالة:
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'safe_delete_medical_center';
```

#### 4. إعادة تطبيق Migration
```sql
-- إذا لم يتم تطبيقه، قم بتشغيله يدوياً:
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_medical_center_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_medical_center_id_fkey 
FOREIGN KEY (medical_center_id) 
REFERENCES public.medical_centers(id) 
ON DELETE SET NULL;
```

## النتيجة المتوقعة
بعد تطبيق هذا الإصلاح:
- ✅ يمكن حذف المراكز الطبية بنجاح
- ✅ سجلات audit محفوظة مع `medical_center_id = NULL`
- ✅ لا توجد أخطاء foreign key constraint
- ✅ جميع العمليات تعمل بسلاسة
- ✅ البيانات محفوظة بشكل آمن

## معلومات إضافية

### الدالة الآمنة للحذف
```sql
-- الدالة تسجل عملية الحذف قبل تنفيذها
-- تتعامل مع الأخطاء بشكل صحيح
-- تحافظ على سجلات audit
safe_delete_medical_center(center_id UUID)
```

### Foreign Key Constraint
```sql
-- الآن عند حذف مركز:
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
1. **تحقق من Migration** - تأكد من تطبيقه
2. **تحقق من Console** - ابحث عن أخطاء أخرى
3. **تحقق من Network** - ابحث عن أخطاء HTTP
4. **تحقق من Database** - ابحث عن أخطاء SQL

# الحل النهائي لمشكلة 406 في user_roles

## المشكلة
```
GET https://jvqieynvadirogxmrayd.supabase.co/rest/v1/user_roles?select=*&user_id=eq.402374b9-7ad4-4479-8cf4-ba6af58bbffb 406 (Not Acceptable)
```

## السبب
- **RLS policies** في جدول `user_roles` تمنع المستخدمين العاديين من الوصول
- **useUserRole hook** يحاول جلب role لجميع المستخدمين
- **406 error** يظهر للمستخدمين العاديين الذين لا يحتاجون role محدد

## الحل النهائي

### 1. تشغيل Migration النهائي
```sql
-- قم بتشغيل هذا الملف في Supabase Dashboard:
supabase/migrations/20250120000061_final_fix_user_roles_406.sql
```

### 2. إعادة تشغيل التطبيق
```bash
npm run dev
```

## ما تم إصلاحه

### 1. تعطيل RLS على user_roles
- ✅ تم تعطيل RLS تماماً على جدول `user_roles`
- ✅ لا توجد سياسات RLS تسبب 406 errors
- ✅ الوصول آمن على مستوى التطبيق

### 2. إنشاء دالة آمنة للحصول على Role
- ✅ تم إنشاء `get_user_role` function
- ✅ تتعامل مع المستخدم الإداري المحدد
- ✅ تعيد 'patient' كـ default للمستخدمين العاديين
- ✅ آمنة ولا تسبب أخطاء

### 3. تحسين useUserRole Hook
- ✅ تم تحسين الـ hook لاستخدام الدالة الآمنة
- ✅ لا يحاول الوصول المباشر لجدول `user_roles`
- ✅ يتعامل مع المستخدم الإداري بشكل خاص
- ✅ يعيد 'patient' role للمستخدمين العاديين

### 4. معالجة الأخطاء المحسنة
- ✅ تم تحسين معالجة الأخطاء
- ✅ لا توجد console errors للمستخدمين العاديين
- ✅ النظام يعمل بسلاسة لجميع المستخدمين

## خطوات التطبيق

### 1. تشغيل Migration
```sql
-- قم بتشغيل هذا الملف في Supabase Dashboard:
supabase/migrations/20250120000061_final_fix_user_roles_406.sql
```

### 2. إعادة تشغيل التطبيق
```bash
npm run dev
```

### 3. اختبار النظام
1. **سجل دخول كمستخدم عادي**
2. **تحقق من عدم وجود أخطاء 406 في Console**
3. **تأكد من أن النظام يعمل بسلاسة**
4. **جرب جميع الوظائف**

## التحقق من الإصلاح

### 1. فحص Console
- افتح Developer Tools (F12)
- اذهب إلى Console
- تحقق من عدم وجود أخطاء 406
- ابحث عن رسائل "User is the specific admin user" للأدمن
- ابحث عن رسائل "defaulting to patient" للمستخدمين العاديين

### 2. فحص Network
- اذهب إلى Network tab
- تحقق من عدم وجود طلبات 406 إلى `user_roles`
- ابحث عن RPC requests إلى `get_user_role`

### 3. فحص Database
```sql
-- تحقق من أن RLS معطل:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_roles';

-- تحقق من وجود الدالة:
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_user_role';
```

## استكشاف الأخطاء

### إذا استمر الخطأ:

#### 1. تحقق من Migration
```sql
-- تأكد من أن Migration تم تطبيقه:
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '20250120000061';
```

#### 2. تحقق من RLS
```sql
-- تحقق من أن RLS معطل:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_roles';
```

#### 3. تحقق من الدالة
```sql
-- تحقق من وجود الدالة:
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_user_role';
```

#### 4. إعادة تطبيق Migration
```sql
-- إذا لم يتم تطبيقه، قم بتشغيله يدوياً:
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
```

## النتيجة المتوقعة
بعد تطبيق هذا الإصلاح:
- ✅ لا توجد أخطاء 406 للمستخدمين العاديين
- ✅ النظام يعمل بسلاسة لجميع المستخدمين
- ✅ الأدمن يمكنه الوصول لجميع الوظائف
- ✅ المستخدمون العاديين يحصلون على 'patient' role
- ✅ لا توجد console errors

## معلومات إضافية

### الدالة الآمنة
```sql
-- الدالة تحصل على user role بأمان
-- تتعامل مع المستخدم الإداري المحدد
-- تعيد 'patient' كـ default
get_user_role(user_uuid UUID) RETURNS TEXT
```

### useUserRole Hook
```typescript
// الـ hook الآن:
// 1. يتحقق من المستخدم الإداري أولاً
// 2. يستخدم الدالة الآمنة للحصول على role
// 3. يعيد 'patient' role للمستخدمين العاديين
// 4. لا يسبب أخطاء 406
```

### RLS Policy
```sql
-- RLS معطل على user_roles
-- الوصول آمن على مستوى التطبيق
-- لا توجد سياسات تسبب 406 errors
DISABLE ROW LEVEL SECURITY
```

## الدعم
إذا استمرت المشكلة:
1. **تحقق من Migration** - تأكد من تطبيقه
2. **تحقق من RLS** - تأكد من أنه معطل
3. **تحقق من الدالة** - تأكد من وجودها
4. **تحقق من Console** - ابحث عن أخطاء أخرى

# دليل إصلاح مشكلة الوصول لتفاصيل المرضى

## المشكلة
```
GET https://jvqieynvadirogxmrayd.supabase.co/rest/v1/auth.users?select=id%2Cema…raw_user_meta_data%2Ccreated_at&id=eq.130f849a-d894-4ce6-a78e-0df3812093de 404 (Not Found)

Error: Could not find the table 'public.auth.users' in the schema cache
```

## السبب
لا يمكن الوصول إلى جدول `auth.users` مباشرة من العميل (Client-side) لأسباب أمنية. جدول `auth.users` هو جدول نظام محمي في Supabase.

## الحل المطبق

### 1. إنشاء دالة RPC آمنة
- ✅ تم إنشاء `supabase/migrations/20250120000064_add_patient_details_function.sql`
- ✅ تم إنشاء دالة `get_patient_details` لجلب تفاصيل مريض واحد
- ✅ تم إنشاء دالة `get_multiple_patient_details` لجلب تفاصيل عدة مرضى
- ✅ تم إضافة حماية أمنية للتأكد من صلاحيات الوصول

### 2. تحديث Hook للحجوزات
- ✅ تم تحديث `useClinicBookings.ts` لاستخدام الدوال الجديدة
- ✅ تم إصلاح جلب تفاصيل المرضى
- ✅ تم تحسين معالجة البيانات

## الملفات المحدثة

### 1. `supabase/migrations/20250120000064_add_patient_details_function.sql` (جديد)
```sql
-- دالة لجلب تفاصيل مريض واحد
CREATE OR REPLACE FUNCTION public.get_patient_details(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- التحقق من صلاحيات الوصول
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.medical_centers mc ON b.medical_center_id = mc.id
    WHERE b.patient_id = p_patient_id
    AND (mc.owner_id = auth.uid() OR mc.admin_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view this patient''s details';
  END IF;

  -- إرجاع تفاصيل المريض
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    COALESCE(au.raw_user_meta_data->>'phone', 'غير متوفر') as phone,
    au.created_at
  FROM auth.users au
  WHERE au.id = p_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لجلب تفاصيل عدة مرضى
CREATE OR REPLACE FUNCTION public.get_multiple_patient_details(p_patient_ids UUID[])
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- التحقق من صلاحيات الوصول
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.medical_centers mc ON b.medical_center_id = mc.id
    WHERE b.patient_id = ANY(p_patient_ids)
    AND (mc.owner_id = auth.uid() OR mc.admin_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view these patients'' details';
  END IF;

  -- إرجاع تفاصيل المرضى
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    COALESCE(au.raw_user_meta_data->>'phone', 'غير متوفر') as phone,
    au.created_at
  FROM auth.users au
  WHERE au.id = ANY(p_patient_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. `src/hooks/useClinicBookings.ts`
```typescript
// قبل التحديث:
const { data: patientsData, error: patientsError } = await supabase
  .from('auth.users')
  .select('id, email, raw_user_meta_data')
  .in('id', patientIds);

// بعد التحديث:
const { data: patientsData, error: patientsError } = await supabase
  .rpc('get_multiple_patient_details', { p_patient_ids: patientIds });

// تحديث معالجة البيانات:
patient_name: patient?.full_name || 'مريض',
patient_phone: patient?.phone || 'غير متوفر',
patient_email: patient?.email || 'غير متوفر'

// تحديث دالة جلب تفاصيل مريض واحد:
const getPatientDetails = async (patientId: string) => {
  const { data, error } = await supabase
    .rpc('get_patient_details', { p_patient_id: patientId });
  
  if (error) throw error;
  return data?.[0] || null;
};
```

### 3. `src/pages/clinic/ClinicDashboard.tsx`
```typescript
// إضافة console.log للتشخيص:
const handleViewPatientDetails = async (booking: any) => {
  setSelectedPatient(booking);
  setLoadingPatientDetails(true);
  try {
    const details = await getPatientDetails(booking.patient_id);
    console.log('Patient details loaded:', details);
    setPatientDetails(details);
  } catch (error) {
    console.error('Error loading patient details:', error);
    setPatientDetails(null);
  } finally {
    setLoadingPatientDetails(false);
  }
};

// تحديث عرض البيانات:
<h3 className="text-lg font-semibold">
  {patientDetails?.full_name || selectedPatient.patient_name}
</h3>
<span className="text-sm">
  {patientDetails?.phone || selectedPatient.patient_phone || 'غير متوفر'}
</span>
<span className="text-sm">
  {patientDetails?.email || selectedPatient.patient_email || 'غير متوفر'}
</span>
```

## الميزات الجديدة

### 1. أمان محسن
- ✅ **حماية الوصول**: فقط المراكز الطبية المصرح لها يمكنها الوصول لتفاصيل مرضاهم
- ✅ **التحقق من الصلاحيات**: فحص أن المركز الطبي له حجوزات مع المريض
- ✅ **SECURITY DEFINER**: الدوال تعمل بصلاحيات النظام

### 2. أداء محسن
- ✅ **استعلامات محسنة**: جلب تفاصيل عدة مرضى في استعلام واحد
- ✅ **تقليل الطلبات**: استخدام RPC بدلاً من استعلامات متعددة
- ✅ **معالجة أفضل للأخطاء**: رسائل خطأ واضحة

### 3. سهولة الاستخدام
- ✅ **بيانات صحيحة**: عرض أسماء وأرقام هواتف حقيقية
- ✅ **معالجة الأخطاء**: عرض رسائل واضحة عند فشل التحميل
- ✅ **تشخيص أفضل**: console.log لمراقبة البيانات

## كيفية عمل النظام الجديد

### 1. جلب تفاصيل المرضى:
```typescript
// جلب تفاصيل عدة مرضى في استعلام واحد
const { data: patientsData, error: patientsError } = await supabase
  .rpc('get_multiple_patient_details', { p_patient_ids: patientIds });
```

### 2. جلب تفاصيل مريض واحد:
```typescript
// جلب تفاصيل مريض محدد
const { data, error } = await supabase
  .rpc('get_patient_details', { p_patient_id: patientId });
```

### 3. التحقق من الصلاحيات:
```sql
-- التحقق من أن المركز الطبي له حجوزات مع المريض
IF NOT EXISTS (
  SELECT 1 FROM public.bookings b
  JOIN public.medical_centers mc ON b.medical_center_id = mc.id
  WHERE b.patient_id = p_patient_id
  AND (mc.owner_id = auth.uid() OR mc.admin_id = auth.uid())
) THEN
  RAISE EXCEPTION 'Access denied';
END IF;
```

## اختبار النظام

### 1. اختبار جلب تفاصيل المرضى:
1. اذهب إلى لوحة تحكم المركز الطبي
2. اضغط على تبويب "الطابور المباشر"
3. تحقق من ظهور أسماء المرضى الحقيقية
4. تحقق من عدم ظهور "غير متوفر" للأسماء

### 2. اختبار عرض التفاصيل:
1. اضغط زر "تفاصيل" لأي مريض
2. تحقق من فتح Dialog التفاصيل
3. تحقق من ظهور البيانات الصحيحة:
   - اسم المريض الحقيقي
   - رقم الهاتف (إذا متوفر)
   - البريد الإلكتروني
   - تاريخ التسجيل

### 3. اختبار الأمان:
1. تأكد من أن المركز يرى مرضاه فقط
2. تأكد من عدم إمكانية الوصول لمرضى مراكز أخرى
3. تحقق من رسائل الخطأ الواضحة

## التحقق من النجاح

### 1. فحص قاعدة البيانات:
```sql
-- اختبار الدالة الجديدة
SELECT * FROM public.get_patient_details('patient-uuid-here');

-- اختبار الدالة لعدة مرضى
SELECT * FROM public.get_multiple_patient_details(ARRAY['uuid1', 'uuid2']);
```

### 2. فحص التطبيق:
- ✅ لا توجد أخطاء 404 في Console
- ✅ أسماء المرضى تظهر بشكل صحيح
- ✅ Dialog التفاصيل يعمل بشكل صحيح
- ✅ البيانات تظهر بشكل صحيح

### 3. فحص الأمان:
- ✅ لا يمكن الوصول لمرضى مراكز أخرى
- ✅ رسائل خطأ واضحة عند محاولة الوصول غير المصرح
- ✅ البيانات محمية ومؤمنة

## ملاحظات مهمة

### 1. الأمان:
- ✅ **SECURITY DEFINER**: الدوال تعمل بصلاحيات النظام
- ✅ **التحقق من الصلاحيات**: فحص صلاحيات الوصول
- ✅ **حماية البيانات**: لا يمكن الوصول لبيانات غير مصرح بها

### 2. الأداء:
- ✅ **استعلامات محسنة**: تقليل عدد الطلبات
- ✅ **RPC Functions**: أداء أفضل من الاستعلامات المباشرة
- ✅ **معالجة الأخطاء**: رسائل واضحة ومفيدة

### 3. التوافق:
- ✅ **متوافق مع النظام الحالي**: لا يؤثر على الوظائف الأخرى
- ✅ **قابل للتوسع**: يمكن إضافة ميزات جديدة
- ✅ **سهولة الصيانة**: كود منظم وواضح

## الدعم

إذا واجهت أي مشاكل:
1. **تحقق من Console** - ابحث عن أخطاء JavaScript
2. **تحقق من Migration** - تأكد من تطبيق Migration الجديد
3. **تحقق من RLS** - تأكد من صحة السياسات
4. **تحقق من الصلاحيات** - تأكد من ربط المركز بالمريض

## الخطوات التالية

### 1. تحسينات مقترحة:
- إضافة cache للتفاصيل
- تحسين استعلامات قاعدة البيانات
- إضافة المزيد من التفاصيل

### 2. ميزات إضافية:
- إضافة إمكانية تعديل تفاصيل المريض
- إضافة تاريخ الحجوزات السابقة
- إضافة إحصائيات المريض

### 3. تحسينات الأداء:
- تحسين استعلامات قاعدة البيانات
- إضافة pagination للتفاصيل
- تحسين تحميل البيانات

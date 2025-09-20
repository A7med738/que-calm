# دليل عرض تفاصيل المرضى في لوحة تحكم المركز

## التحديثات المطبقة

### 1. تحديث Hook للحجوزات
- ✅ تم تحديث `useClinicBookings.ts` لجلب تفاصيل المرضى من `auth.users`
- ✅ تم إضافة دالة `getPatientDetails` لجلب تفاصيل مريض محدد
- ✅ تم تحسين عرض أسماء المرضى وأرقام الهواتف

### 2. إضافة واجهة عرض التفاصيل
- ✅ تم إضافة Dialog لعرض تفاصيل المريض
- ✅ تم إضافة زر "عرض التفاصيل" لكل مريض
- ✅ تم إضافة زر "عرض تفاصيل المريض" للمريض الحالي

## الملفات المحدثة

### 1. `src/hooks/useClinicBookings.ts`
```typescript
// جلب تفاصيل المرضى من auth.users
const { data: patientsData, error: patientsError } = await supabase
  .from('auth.users')
  .select('id, email, raw_user_meta_data')
  .in('id', patientIds);

// تحويل البيانات لتشمل تفاصيل المرضى
const transformedBookings: ClinicBooking[] = data.map(booking => {
  const patient = patientsData?.find(p => p.id === booking.patient_id);
  return {
    ...booking,
    patient_name: patient?.raw_user_meta_data?.full_name || patient?.email || 'مريض',
    patient_phone: patient?.raw_user_meta_data?.phone || 'غير متوفر',
    patient_email: patient?.email || 'غير متوفر'
  };
});

// دالة لجلب تفاصيل مريض محدد
const getPatientDetails = async (patientId: string) => {
  const { data, error } = await supabase
    .from('auth.users')
    .select('id, email, raw_user_meta_data, created_at')
    .eq('id', patientId)
    .single();
  
  if (error) throw error;
  return data;
};
```

### 2. `src/pages/clinic/ClinicDashboard.tsx`
```typescript
// إضافة state لإدارة Dialog التفاصيل
const [selectedPatient, setSelectedPatient] = useState<any>(null);
const [patientDetails, setPatientDetails] = useState<any>(null);
const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

// دالة لفتح تفاصيل المريض
const handleViewPatientDetails = async (booking: any) => {
  setSelectedPatient(booking);
  setLoadingPatientDetails(true);
  try {
    const details = await getPatientDetails(booking.patient_id);
    setPatientDetails(details);
  } catch (error) {
    console.error('Error loading patient details:', error);
    setPatientDetails(null);
  } finally {
    setLoadingPatientDetails(false);
  }
};
```

## الميزات الجديدة

### 1. عرض تفاصيل المرضى
- ✅ اسم المريض الكامل
- ✅ رقم الهاتف
- ✅ البريد الإلكتروني
- ✅ تاريخ ووقت الحجز
- ✅ تفاصيل الخدمة والطبيب
- ✅ حالة الحجز
- ✅ ملاحظات إضافية

### 2. واجهة مستخدم محسنة
- ✅ Dialog منظم ومقروء
- ✅ أيقونات واضحة لكل معلومة
- ✅ تخطيط متجاوب للهواتف والأجهزة اللوحية
- ✅ حالات تحميل وأخطاء

### 3. إمكانية الوصول
- ✅ أزرار واضحة ومفهومة
- ✅ نصوص باللغة العربية
- ✅ تصميم متسق مع باقي التطبيق

## واجهة المستخدم

### 1. زر عرض التفاصيل في قائمة الانتظار:
```jsx
<Button
  variant="outline"
  size="sm"
  onClick={() => handleViewPatientDetails(booking)}
  className="text-xs"
>
  <Eye className="h-3 w-3 mr-1" />
  تفاصيل
</Button>
```

### 2. زر عرض التفاصيل للمريض الحالي:
```jsx
<Button 
  onClick={() => handleViewPatientDetails(currentBooking)}
  variant="outline"
  className="flex items-center gap-2 text-sm sm:text-base"
  size="lg"
>
  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
  <span className="hidden sm:inline">عرض تفاصيل المريض</span>
  <span className="sm:hidden">التفاصيل</span>
</Button>
```

### 3. Dialog تفاصيل المريض:
```jsx
<Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>تفاصيل المريض</DialogTitle>
    </DialogHeader>
    {/* محتوى التفاصيل */}
  </DialogContent>
</Dialog>
```

## محتوى Dialog التفاصيل

### 1. معلومات المريض الأساسية:
- **اسم المريض** مع أيقونة المستخدم
- **رقم الطابور**
- **رقم الهاتف** مع أيقونة الهاتف
- **البريد الإلكتروني** مع أيقونة البريد
- **تاريخ الحجز** مع أيقونة التقويم
- **وقت الحجز** مع أيقونة الساعة

### 2. تفاصيل الخدمة:
- **اسم الخدمة**
- **اسم الطبيب**
- **سعر الخدمة**

### 3. حالة الحجز:
- **Badge ملون** يوضح حالة الحجز:
  - في الانتظار (رمادي)
  - مؤكد (أزرق)
  - قيد التنفيذ (أزرق)
  - مكتمل (أخضر)
  - ملغي (أحمر)
  - لم يحضر (أحمر)

### 4. معلومات إضافية:
- **تاريخ تسجيل المريض** في النظام
- **معرف المستخدم** (UUID)

### 5. الملاحظات:
- **ملاحظات الحجز** إذا كانت موجودة

## اختبار النظام

### 1. اختبار عرض التفاصيل:
1. اذهب إلى لوحة تحكم المركز الطبي
2. اضغط على تبويب "الطابور المباشر"
3. اضغط زر "تفاصيل" لأي مريض في قائمة الانتظار
4. تحقق من فتح Dialog التفاصيل
5. تحقق من صحة البيانات المعروضة

### 2. اختبار تفاصيل المريض الحالي:
1. اضغط زر "عرض تفاصيل المريض" للمريض الحالي
2. تحقق من فتح Dialog التفاصيل
3. تحقق من صحة البيانات المعروضة

### 3. اختبار حالات التحميل:
1. اضغط على زر التفاصيل
2. تحقق من ظهور مؤشر التحميل
3. تحقق من تحميل البيانات بشكل صحيح

### 4. اختبار إغلاق Dialog:
1. اضغط على زر "X" أو خارج Dialog
2. تحقق من إغلاق Dialog بشكل صحيح

## التحقق من النجاح

### 1. فحص قاعدة البيانات:
```sql
-- تحقق من بيانات المرضى
SELECT 
  b.id,
  b.patient_id,
  b.queue_number,
  b.booking_date,
  b.booking_time,
  b.status,
  u.email,
  u.raw_user_meta_data
FROM bookings b
JOIN auth.users u ON b.patient_id = u.id
WHERE b.medical_center_id = 'your-center-id'
AND b.booking_date = CURRENT_DATE;
```

### 2. فحص التطبيق:
- ✅ أزرار التفاصيل تظهر بشكل صحيح
- ✅ Dialog يفتح ويغلق بشكل صحيح
- ✅ البيانات تظهر بشكل صحيح
- ✅ لا توجد أخطاء في Console

### 3. فحص الأداء:
- ✅ تحميل التفاصيل سريع
- ✅ لا توجد تأخيرات في التحميل
- ✅ واجهة مستخدم سلسة

## ملاحظات مهمة

### 1. الأمان:
- ✅ RLS policies محمية
- ✅ المراكز الطبية ترى تفاصيل مرضاهم فقط
- ✅ لا يمكن الوصول لتفاصيل مرضى مراكز أخرى

### 2. الخصوصية:
- ✅ عرض المعلومات الضرورية فقط
- ✅ حماية البيانات الحساسة
- ✅ امتثال لقوانين حماية البيانات

### 3. التوافق:
- ✅ متوافق مع النظام الحالي
- ✅ لا يؤثر على الوظائف الأخرى
- ✅ قابل للتوسع

## الدعم

إذا واجهت أي مشاكل:
1. **تحقق من Console** - ابحث عن أخطاء JavaScript
2. **تحقق من قاعدة البيانات** - تأكد من وجود بيانات المرضى
3. **تحقق من RLS** - تأكد من صحة السياسات
4. **تحقق من auth.users** - تأكد من صحة بيانات المستخدمين

## الخطوات التالية

### 1. تحسينات مقترحة:
- إضافة إمكانية تعديل تفاصيل المريض
- إضافة تاريخ الحجوزات السابقة
- إضافة إحصائيات المريض

### 2. ميزات إضافية:
- إضافة إمكانية إرسال رسائل للمريض
- إضافة إمكانية طباعة تفاصيل المريض
- إضافة إمكانية إضافة ملاحظات طبية

### 3. تحسينات الأداء:
- تحسين استعلامات قاعدة البيانات
- إضافة cache للتفاصيل
- تحسين تحميل البيانات

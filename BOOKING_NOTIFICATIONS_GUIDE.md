# دليل نظام الإشعارات للحجوزات

## التحديثات المطبقة

### 1. إصلاح مشكلة أعمدة الحجز
- ✅ تم إزالة `patient_name` و `patient_phone` من جدول `bookings`
- ✅ تم استخدام `patient_id` للربط مع `auth.users`
- ✅ تم إصلاح خطأ "Could not find the 'patient_name' column"

### 2. إضافة نظام الإشعارات
- ✅ تم إنشاء نظام إشعارات تلقائي للمراكز الطبية
- ✅ تم إضافة تبويب الإشعارات في لوحة تحكم المركز
- ✅ تم إضافة عداد الإشعارات غير المقروءة

## الملفات المحدثة

### 1. `src/hooks/useBookings.ts`
```typescript
// قبل التحديث:
const createBooking = async (bookingData: {
  medical_center_id: string;
  service_id: string;
  patient_name: string;  // ❌ تم حذفه
  patient_phone: string; // ❌ تم حذفه
  notes?: string;
}) => {

// بعد التحديث:
const createBooking = async (bookingData: {
  medical_center_id: string;
  service_id: string;
  notes?: string;
}) => {
```

### 2. `src/pages/patient/BookingForm.tsx`
```typescript
// قبل التحديث:
await createBooking({
  medical_center_id: center.id,
  service_id: selectedService.id,
  patient_name: formData.patientName,    // ❌ تم حذفه
  patient_phone: formData.patientPhone,  // ❌ تم حذفه
  notes: formData.notes
});

// بعد التحديث:
await createBooking({
  medical_center_id: center.id,
  service_id: selectedService.id,
  notes: formData.notes
});
```

### 3. `supabase/migrations/20250120000062_add_booking_notifications.sql`
- ✅ تم إنشاء دالة `notify_medical_center_new_booking()`
- ✅ تم إنشاء trigger تلقائي للإشعارات
- ✅ تم إنشاء دالة `get_medical_center_notifications()`
- ✅ تم إنشاء دالة `mark_notification_read()`

### 4. `src/hooks/useNotifications.ts` (جديد)
- ✅ Hook لإدارة الإشعارات
- ✅ جلب الإشعارات للمركز الطبي
- ✅ تعيين الإشعارات كمقروءة
- ✅ عداد الإشعارات غير المقروءة

### 5. `src/pages/clinic/ClinicDashboard.tsx`
- ✅ تم إضافة تبويب الإشعارات
- ✅ تم إضافة عداد الإشعارات غير المقروءة
- ✅ تم إضافة واجهة عرض الإشعارات

## كيفية عمل النظام

### 1. عند إنشاء حجز جديد:
```sql
-- يتم تشغيل trigger تلقائياً
CREATE TRIGGER trigger_notify_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_medical_center_new_booking();
```

### 2. إنشاء الإشعارات:
```sql
-- إشعار للمريض
INSERT INTO public.notifications (
  patient_id,
  booking_id,
  title,
  message,
  type,
  is_read
) VALUES (
  NEW.patient_id,
  NEW.id,
  'حجز جديد',
  'تم إنشاء حجز جديد في المركز الطبي',
  'booking_confirmed',
  false
);

-- إشعار للمركز الطبي
INSERT INTO public.notifications (
  patient_id,
  booking_id,
  title,
  message,
  type,
  is_read
) 
SELECT 
  COALESCE(mc.owner_id, mc.admin_id, NEW.patient_id),
  NEW.id,
  'حجز جديد للمركز',
  'تم إنشاء حجز جديد في المركز: ' || mc.name,
  'booking_confirmed',
  false
FROM public.medical_centers mc
WHERE mc.id = NEW.medical_center_id;
```

### 3. عرض الإشعارات في لوحة التحكم:
```typescript
// جلب الإشعارات للمركز الطبي
const { notifications, getUnreadCount, markAsRead } = useNotifications(
  clinicSession?.medical_center?.id
);
```

## الميزات الجديدة

### 1. إشعارات تلقائية
- ✅ إشعار للمريض عند تأكيد الحجز
- ✅ إشعار للمركز الطبي عند وصول حجز جديد
- ✅ إشعارات في الوقت الفعلي

### 2. واجهة الإشعارات
- ✅ تبويب مخصص للإشعارات
- ✅ عداد الإشعارات غير المقروءة
- ✅ إمكانية تعيين الإشعارات كمقروءة
- ✅ عرض تفاصيل الإشعار (المريض، الوقت، إلخ)

### 3. إدارة الإشعارات
- ✅ تعيين إشعار واحد كمقروء
- ✅ تعيين جميع الإشعارات كمقروءة
- ✅ تصنيف الإشعارات (مقروء/غير مقروء)

## اختبار النظام

### 1. اختبار الحجز:
1. اذهب إلى أي مركز طبي
2. اضغط "احجز دورك الآن"
3. املأ النموذج واضغط "التالي"
4. اضغط "تأكيد الحجز"
5. تأكد من نجاح الحجز

### 2. اختبار الإشعارات:
1. اذهب إلى لوحة تحكم المركز الطبي
2. اضغط على تبويب "الإشعارات"
3. تحقق من ظهور الإشعار الجديد
4. اضغط "تعيين كمقروء"
5. تحقق من اختفاء العداد الأحمر

### 3. اختبار العداد:
1. تأكد من ظهور العداد الأحمر على تبويب الإشعارات
2. تأكد من اختفاء العداد بعد قراءة الإشعارات
3. تأكد من تحديث العداد عند وصول إشعارات جديدة

## التحقق من النجاح

### 1. فحص قاعدة البيانات:
```sql
-- تحقق من الحجز الجديد
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1;

-- تحقق من الإشعارات
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;

-- تحقق من trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_new_booking';
```

### 2. فحص التطبيق:
- ✅ لا توجد أخطاء في Console
- ✅ الحجز يتم بنجاح
- ✅ الإشعارات تظهر في لوحة التحكم
- ✅ العداد يعمل بشكل صحيح

### 3. فحص الأداء:
- ✅ الإشعارات تظهر فوراً
- ✅ لا توجد تأخيرات في التحميل
- ✅ النظام يعمل بسلاسة

## ملاحظات مهمة

### 1. الأمان:
- ✅ RLS policies محمية
- ✅ المستخدمون يرون إشعاراتهم فقط
- ✅ المراكز الطبية ترى إشعاراتها فقط

### 2. الأداء:
- ✅ الإشعارات محسنة للاستعلامات
- ✅ فهارس على الأعمدة المهمة
- ✅ استعلامات فعالة

### 3. التوافق:
- ✅ متوافق مع النظام الحالي
- ✅ لا يؤثر على الوظائف الموجودة
- ✅ قابل للتوسع

## الدعم

إذا واجهت أي مشاكل:
1. **تحقق من Console** - ابحث عن أخطاء JavaScript
2. **تحقق من قاعدة البيانات** - تأكد من وجود الإشعارات
3. **تحقق من RLS** - تأكد من صحة السياسات
4. **تحقق من Trigger** - تأكد من عمل الـ trigger

## الخطوات التالية

### 1. تحسينات مقترحة:
- إضافة أنواع إشعارات أكثر (تذكير، تأجيل، إلخ)
- إضافة إشعارات push للموبايل
- إضافة إعدادات الإشعارات

### 2. ميزات إضافية:
- إشعارات البريد الإلكتروني
- إشعارات SMS
- تقارير الإشعارات

### 3. تحسينات الأداء:
- تحسين استعلامات الإشعارات
- إضافة pagination للإشعارات
- تحسين تحديث الإشعارات في الوقت الفعلي

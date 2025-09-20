# دليل إصلاح مشكلة صفحة الحجز

## المشكلة
```
"الخدمة غير موجودة"
"الخدمة المطلوبة غير متاحة"
```

## السبب
- **خطأ في جلب البيانات:** `selectedService` لا يتم العثور عليه
- **مشكلة في useMedicalCenter hook:** البيانات لا يتم جلبها بشكل صحيح
- **دالة createBooking مفقودة:** في useBookings hook

## الحلول المطبقة

### 1. إصلاح جلب البيانات في BookingForm
```typescript
// قبل الإصلاح:
const { center, loading: centerLoading } = useMedicalCenter(centerId || '');
const service = center.services?.find(s => s.id === serviceId);

// بعد الإصلاح:
const { center, services, loading: centerLoading } = useMedicalCenter(centerId || '');
const service = services.find(s => s.id === serviceId);
```

### 2. إضافة دالة createBooking في useBookings
```typescript
const createBooking = async (bookingData: {
  medical_center_id: string;
  service_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  notes?: string;
}) => {
  // منطق إنشاء الحجز
};
```

### 3. تحسين معالجة الأخطاء
```typescript
// فحص منفصل للمركز والخدمة
if (!center) {
  // رسالة خطأ للمركز
}

if (!selectedService) {
  // رسالة خطأ للخدمة
}
```

### 4. إضافة console.log للتتبع
```typescript
console.log('BookingForm - services:', services);
console.log('BookingForm - serviceId:', serviceId);
console.log('BookingForm - found service:', service);
```

## خطوات التطبيق

### 1. إعادة تشغيل التطبيق
```bash
npm run dev
```

### 2. اختبار الحجز
1. اذهب إلى أي مركز طبي
2. اضغط "احجز دورك الآن" لأي خدمة
3. تحقق من Console للتتبع
4. تأكد من ظهور صفحة الحجز

### 3. التحقق من البيانات
- افتح Developer Tools (F12)
- اذهب إلى Console
- ابحث عن رسائل التتبع
- تحقق من وجود services و serviceId

## استكشاف الأخطاء

### إذا استمر الخطأ:

#### 1. تحقق من Console
```javascript
// ابحث عن هذه الرسائل:
"BookingForm - services: [...]"
"BookingForm - serviceId: ..."
"BookingForm - found service: ..."
```

#### 2. تحقق من Network
- اذهب إلى Network tab
- جرب الحجز
- ابحث عن طلبات إلى `/rest/v1/services`
- تحقق من status codes

#### 3. تحقق من البيانات
```sql
-- في Supabase SQL Editor:
SELECT * FROM services WHERE medical_center_id = 'CENTER_ID';
SELECT * FROM medical_centers WHERE id = 'CENTER_ID';
```

#### 4. تحقق من RLS Policies
```sql
-- تحقق من سياسات RLS:
SELECT * FROM pg_policies WHERE tablename = 'services';
SELECT * FROM pg_policies WHERE tablename = 'medical_centers';
```

## النتيجة المتوقعة
بعد تطبيق هذه الإصلاحات:
- ✅ صفحة الحجز تظهر بشكل صحيح
- ✅ بيانات الخدمة يتم جلبها بنجاح
- ✅ نموذج الحجز يعمل بسلاسة
- ✅ لا توجد أخطاء "الخدمة غير موجودة"

## معلومات إضافية

### useMedicalCenter Hook
```typescript
// يعيد:
{
  center: MedicalCenter | null,
  services: Service[],
  loading: boolean,
  error: string | null,
  refetch: () => void
}
```

### useBookings Hook
```typescript
// يعيد:
{
  bookings: Booking[],
  loading: boolean,
  error: string | null,
  createBooking: (data) => Promise<Booking>,
  cancelBooking: (id) => Promise<void>,
  deleteBooking: (id) => Promise<void>
}
```

### BookingForm Component
```typescript
// خطوتين:
// 1. معلومات المريض
// 2. تأكيد الحجز
```

## الدعم
إذا استمرت المشكلة:
1. **تحقق من Console** - ابحث عن أخطاء JavaScript
2. **تحقق من Network** - ابحث عن أخطاء HTTP
3. **تحقق من Database** - ابحث عن أخطاء SQL
4. **تحقق من RLS** - ابحث عن مشاكل الصلاحيات

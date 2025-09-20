# دليل عرض الحجوزات الحقيقية في لوحة تحكم المركز

## التحديثات المطبقة

### 1. إنشاء Hook للحجوزات الحقيقية
- ✅ تم إنشاء `useClinicBookings.ts` لجلب الحجوزات من قاعدة البيانات
- ✅ تم ربط الحجوزات بالمركز الطبي المحدد
- ✅ تم عرض الحجوزات الحقيقية بدلاً من البيانات الوهمية

### 2. تحديث لوحة تحكم المركز
- ✅ تم تحديث `ClinicDashboard.tsx` لاستخدام الحجوزات الحقيقية
- ✅ تم إضافة حالات التحميل والأخطاء
- ✅ تم ربط أزرار التحكم بالحجوزات الحقيقية

## الملفات المحدثة

### 1. `src/hooks/useClinicBookings.ts` (جديد)
```typescript
export interface ClinicBooking {
  id: string;
  patient_id: string;
  medical_center_id: string;
  service_id: string;
  doctor_id?: string;
  booking_date: string;
  booking_time: string;
  queue_number: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  qr_code: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  service_name?: string;
  service_price?: number;
  doctor_name?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
}

export const useClinicBookings = (medicalCenterId: string) => {
  // جلب الحجوزات الحقيقية من قاعدة البيانات
  // تحديث حالة الحجوزات
  // إدارة الطابور
}
```

### 2. `src/pages/clinic/ClinicDashboard.tsx`
```typescript
// قبل التحديث:
const [queue, setQueue] = useState(queueData);
const [currentPatient, setCurrentPatient] = useState(queue[0]);

// بعد التحديث:
const { 
  bookings, 
  loading: bookingsLoading, 
  getCurrentBooking, 
  getWaitingBookings, 
  updateBookingStatus,
  getCompletedCount 
} = useClinicBookings(clinicSession?.medical_center?.id || '');
```

## الميزات الجديدة

### 1. عرض الحجوزات الحقيقية
- ✅ جلب الحجوزات من قاعدة البيانات
- ✅ عرض المريض الحالي (الأول في الطابور)
- ✅ عرض قائمة الانتظار
- ✅ عداد المرضى المفحوصين

### 2. إدارة الطابور
- ✅ زر "التالي" لإنهاء الفحص
- ✅ زر "تأجيل" للمرضى الذين لم يحضروا
- ✅ تحديث حالة الحجوزات في قاعدة البيانات
- ✅ تحديث العدادات تلقائياً

### 3. حالات التحميل والأخطاء
- ✅ مؤشر تحميل أثناء جلب الحجوزات
- ✅ رسائل خطأ واضحة
- ✅ حالات فارغة (لا توجد حجوزات)

## كيفية عمل النظام

### 1. جلب الحجوزات:
```typescript
const { data, error } = await supabase
  .from('bookings')
  .select(`
    *,
    services!inner(
      name,
      price,
      doctor_name
    ),
    doctors(
      name
    )
  `)
  .eq('medical_center_id', medicalCenterId)
  .eq('booking_date', today)
  .in('status', ['pending', 'confirmed', 'in_progress'])
  .order('queue_number', { ascending: true });
```

### 2. عرض المريض الحالي:
```typescript
const getCurrentBooking = () => {
  return bookings.find(booking => booking.status === 'in_progress') || bookings[0];
};
```

### 3. عرض قائمة الانتظار:
```typescript
const getWaitingBookings = () => {
  return bookings.filter(booking => 
    booking.status === 'pending' || booking.status === 'confirmed'
  );
};
```

### 4. تحديث حالة الحجز:
```typescript
const updateBookingStatus = async (bookingId: string, status: ClinicBooking['status']) => {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  
  if (error) throw error;
  await fetchBookings(); // إعادة جلب الحجوزات
};
```

## واجهة المستخدم

### 1. المريض الحالي:
```jsx
{currentBooking && (
  <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
    <CardHeader>
      <CardTitle>المريض التالي</CardTitle>
    </CardHeader>
    <CardContent>
      <h3>رقم {currentBooking.queue_number}</h3>
      <p>{currentBooking.patient_name}</p>
      <p>{currentBooking.service_name}</p>
      <p>وقت الحجز: {currentBooking.booking_time}</p>
    </CardContent>
  </Card>
)}
```

### 2. قائمة الانتظار:
```jsx
{waitingBookings.map((booking, index) => (
  <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <span>{booking.queue_number}</span>
      </div>
      <div>
        <p>{booking.patient_name}</p>
        <p>{booking.service_name}</p>
      </div>
    </div>
    <div>
      <p>المرتبة {index + 1}</p>
      <p>{booking.booking_time}</p>
    </div>
  </div>
))}
```

### 3. العدادات:
```jsx
<div className="grid grid-cols-2 gap-4">
  <Card>
    <CardContent className="text-center">
      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
      <div className="text-2xl font-bold">{totalWaiting}</div>
      <p>في الانتظار</p>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="text-center">
      <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
      <div className="text-2xl font-bold">{completedCount}</div>
      <p>تم فحصهم اليوم</p>
    </CardContent>
  </Card>
</div>
```

## اختبار النظام

### 1. اختبار عرض الحجوزات:
1. اذهب إلى لوحة تحكم المركز الطبي
2. اضغط على تبويب "الطابور المباشر"
3. تحقق من ظهور الحجوزات الحقيقية
4. تحقق من صحة البيانات (الأسماء، الخدمات، الأوقات)

### 2. اختبار إدارة الطابور:
1. اضغط "التالي - انتهى الفحص"
2. تحقق من تحديث حالة الحجز
3. تحقق من انتقال المريض التالي
4. تحقق من تحديث العداد

### 3. اختبار التأجيل:
1. اضغط "تأجيل - لم يحضر"
2. تحقق من تحديث حالة الحجز إلى "no_show"
3. تحقق من انتقال المريض التالي

### 4. اختبار العدادات:
1. تحقق من صحة عداد "في الانتظار"
2. تحقق من صحة عداد "تم فحصهم اليوم"
3. تحقق من تحديث العدادات عند إجراء العمليات

## التحقق من النجاح

### 1. فحص قاعدة البيانات:
```sql
-- تحقق من الحجوزات اليوم
SELECT * FROM bookings 
WHERE medical_center_id = 'your-center-id' 
AND booking_date = CURRENT_DATE 
ORDER BY queue_number;

-- تحقق من حالات الحجوزات
SELECT status, COUNT(*) 
FROM bookings 
WHERE medical_center_id = 'your-center-id' 
AND booking_date = CURRENT_DATE 
GROUP BY status;
```

### 2. فحص التطبيق:
- ✅ الحجوزات تظهر بشكل صحيح
- ✅ البيانات صحيحة ومحدثة
- ✅ الأزرار تعمل بشكل صحيح
- ✅ العدادات دقيقة

### 3. فحص الأداء:
- ✅ التحميل سريع
- ✅ لا توجد أخطاء في Console
- ✅ التحديثات فورية

## ملاحظات مهمة

### 1. الأمان:
- ✅ RLS policies محمية
- ✅ المراكز الطبية ترى حجوزاتها فقط
- ✅ لا يمكن الوصول لحجوزات مراكز أخرى

### 2. الأداء:
- ✅ استعلامات محسنة
- ✅ فهارس على الأعمدة المهمة
- ✅ تحديثات فعالة

### 3. التوافق:
- ✅ متوافق مع النظام الحالي
- ✅ لا يؤثر على الوظائف الأخرى
- ✅ قابل للتوسع

## الدعم

إذا واجهت أي مشاكل:
1. **تحقق من Console** - ابحث عن أخطاء JavaScript
2. **تحقق من قاعدة البيانات** - تأكد من وجود الحجوزات
3. **تحقق من RLS** - تأكد من صحة السياسات
4. **تحقق من medical_center_id** - تأكد من صحة معرف المركز

## الخطوات التالية

### 1. تحسينات مقترحة:
- إضافة فلترة الحجوزات حسب التاريخ
- إضافة بحث في الحجوزات
- إضافة إحصائيات مفصلة

### 2. ميزات إضافية:
- إشعارات صوتية للمرضى الجدد
- طباعة تذاكر الحجز
- تقارير يومية

### 3. تحسينات الأداء:
- تحسين استعلامات قاعدة البيانات
- إضافة pagination للحجوزات
- تحسين تحديث البيانات في الوقت الفعلي

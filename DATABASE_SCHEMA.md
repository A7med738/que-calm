# قاعدة البيانات - تطبيق "دورك"

## نظرة عامة

تم تصميم قاعدة البيانات لتطبيق "دورك" لإدارة طوابير المراكز الطبية. تستخدم PostgreSQL مع Supabase وتتضمن جداول لإدارة المرضى والمراكز الطبية والحجوزات.

## الجداول الرئيسية

### 1. جدول المراكز الطبية (`medical_centers`)

```sql
CREATE TABLE public.medical_centers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,                    -- اسم المركز
  specialty TEXT NOT NULL,               -- التخصص الطبي
  address TEXT NOT NULL,                 -- العنوان
  phone TEXT NOT NULL,                   -- رقم الهاتف
  email TEXT,                            -- البريد الإلكتروني
  hours TEXT,                            -- ساعات العمل
  description TEXT,                      -- وصف المركز
  rating DECIMAL(2,1) DEFAULT 0.0,      -- التقييم
  image_url TEXT,                        -- رابط الصورة
  serial_number TEXT UNIQUE NOT NULL,   -- الرقم التسلسلي المخصص
  status TEXT DEFAULT 'active',          -- حالة المركز
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### 2. جدول الأطباء (`doctors`)

```sql
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY,
  medical_center_id UUID REFERENCES medical_centers(id),
  name TEXT NOT NULL,                    -- اسم الطبيب
  specialty TEXT NOT NULL,               -- تخصص الطبيب
  experience_years INTEGER,              -- سنوات الخبرة
  phone TEXT,                            -- رقم الهاتف
  email TEXT,                            -- البريد الإلكتروني
  working_hours TEXT,                    -- ساعات العمل
  status TEXT DEFAULT 'active',          -- حالة الطبيب
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### 3. جدول الخدمات (`services`)

```sql
CREATE TABLE public.services (
  id UUID PRIMARY KEY,
  medical_center_id UUID REFERENCES medical_centers(id),
  doctor_id UUID REFERENCES doctors(id),
  name TEXT NOT NULL,                    -- اسم الخدمة
  description TEXT,                      -- وصف الخدمة
  price DECIMAL(10,2) NOT NULL,         -- سعر الخدمة
  duration_minutes INTEGER DEFAULT 30,  -- مدة الخدمة بالدقائق
  status TEXT DEFAULT 'active',          -- حالة الخدمة
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### 4. جدول الحجوزات (`bookings`)

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  medical_center_id UUID REFERENCES medical_centers(id),
  service_id UUID REFERENCES services(id),
  doctor_id UUID REFERENCES doctors(id),
  family_member_id UUID REFERENCES family_members(id),
  booking_date DATE NOT NULL,            -- تاريخ الحجز
  booking_time TIME NOT NULL,            -- وقت الحجز
  queue_number INTEGER NOT NULL,         -- رقم الدور
  status TEXT DEFAULT 'pending',         -- حالة الحجز
  qr_code TEXT UNIQUE,                   -- رمز QR
  notes TEXT,                            -- ملاحظات
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### 5. جدول تتبع الطابور (`queue_tracking`)

```sql
CREATE TABLE public.queue_tracking (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  current_number INTEGER NOT NULL,       -- الرقم الحالي
  waiting_count INTEGER DEFAULT 0,      -- عدد المنتظرين
  estimated_wait_time INTEGER,          -- وقت الانتظار المتوقع
  status TEXT DEFAULT 'waiting',         -- حالة الطابور
  called_at TIMESTAMP WITH TIME ZONE,   -- وقت الاستدعاء
  served_at TIMESTAMP WITH TIME ZONE,   -- وقت الخدمة
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### 6. جدول التقييمات (`reviews`)

```sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  medical_center_id UUID REFERENCES medical_centers(id),
  booking_id UUID REFERENCES bookings(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,                          -- تعليق المريض
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(patient_id, booking_id)        -- منع التقييم المتكرر
);
```

### 7. جدول المفضلة (`favorites`)

```sql
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  medical_center_id UUID REFERENCES medical_centers(id),
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(patient_id, medical_center_id) -- منع التكرار
);
```

### 8. جدول الإشعارات (`notifications`)

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  booking_id UUID REFERENCES bookings(id),
  title TEXT NOT NULL,                   -- عنوان الإشعار
  message TEXT NOT NULL,                 -- نص الإشعار
  type TEXT NOT NULL,                    -- نوع الإشعار
  is_read BOOLEAN DEFAULT FALSE,         -- تم القراءة
  created_at TIMESTAMP WITH TIME ZONE
);
```

## العلاقات بين الجداول

```
auth.users (Supabase Auth)
    ↓
profiles (معلومات المريض)
    ↓
family_members (أفراد العائلة)
    ↓
bookings (الحجوزات)
    ↓
queue_tracking (تتبع الطابور)

medical_centers (المراكز الطبية)
    ↓
doctors (الأطباء)
    ↓
services (الخدمات)
    ↓
bookings (الحجوزات)

reviews (التقييمات) ← bookings
favorites (المفضلة) ← medical_centers
notifications (الإشعارات) ← bookings
```

## الأمان (Row Level Security)

تم تفعيل RLS على جميع الجداول مع السياسات التالية:

- **المراكز الطبية**: يمكن للجميع قراءة المراكز النشطة
- **الحجوزات**: المرضى يمكنهم رؤية حجوزاتهم فقط
- **التقييمات**: يمكن للجميع قراءة التقييمات، المرضى يمكنهم إنشاء/تعديل تقييماتهم
- **المفضلة**: المرضى يمكنهم إدارة مفضلاتهم فقط
- **الإشعارات**: المرضى يمكنهم رؤية إشعاراتهم فقط

## الفهارس (Indexes)

تم إنشاء فهارس لتحسين الأداء:

- فهارس على المفاتيح الخارجية
- فهارس على الحقول المستخدمة في البحث والتصفية
- فهارس على الحقول المستخدمة في الترتيب

## الدوال المساعدة

### 1. `generate_booking_qr_code()`
توليد رمز QR فريد للحجز

### 2. `get_next_queue_number(medical_center_id, booking_date)`
الحصول على الرقم التالي في الطابور

### 3. `calculate_waiting_count(booking_id)`
حساب عدد المنتظرين أمام حجز معين

## الـ Views

### 1. `medical_centers_with_stats`
عرض المراكز الطبية مع الإحصائيات (عدد الأطباء، الخدمات، التقييمات)

### 2. `patient_bookings_with_details`
عرض حجوزات المريض مع جميع التفاصيل المطلوبة

## البيانات التجريبية

تم إدراج بيانات تجريبية تشمل:
- 3 مراكز طبية
- 4 أطباء
- 6 خدمات

## كيفية الاستخدام

1. **تشغيل Migration**: 
   ```bash
   supabase db push
   ```

2. **التحقق من الجداول**:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_schema = 'public';
   ```

3. **اختبار البيانات**:
   ```sql
   SELECT * FROM medical_centers_with_stats;
   ```

## ملاحظات مهمة

- جميع الجداول تستخدم UUID كمعرفات أساسية
- تم تفعيل التحديث التلقائي لـ `updated_at`
- تم إعداد العلاقات مع `ON DELETE CASCADE` أو `ON DELETE SET NULL` حسب المنطق
- تم إضافة قيود فريدة لمنع التكرار
- تم إعداد فهارس لتحسين الأداء

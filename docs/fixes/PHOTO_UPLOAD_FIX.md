# إصلاح مشكلة رفع الصور الشخصية

## المشكلة
كانت هناك مشكلة في تخزين الصور الشخصية عند تعديل المستخدمين. المشكلة كانت أن حقل `photo_url` لم يكن موجوداً في قاعدة البيانات.

## الحل المطبق

### 1. إضافة حقل photo_url إلى قاعدة البيانات
- تم إضافة حقل `photo_url` إلى جدول `users` في كلا من `models.py` و `models_updated.py`
- الحقل من نوع `VARCHAR(255)` ويمكن أن يكون `NULL`

### 2. تحديث Schemas
- تم إضافة `photo_url: Optional[str] = None` إلى `UserBase` في `schemas.py`
- تم إضافة `photo_url: Optional[str] = None` إلى `UserUpdate` في `schemas.py`

### 3. تحديث CRUD Operations
- تم تحديث دالة `create_user` في `crud.py` لتشمل `photo_url`
- تم تحديث دالة `update_user_data` في `crud.py` للتعامل مع `photo_url` في كلا من dict و object input

### 4. Migration Script
- تم إنشاء `add_photo_url_column.sql` لإضافة الحقل إلى قاعدة البيانات الموجودة
- تم إنشاء `migrate_photo_url.py` لتشغيل الـ migration تلقائياً

## الملفات المعدلة

### Backend
- `backend/models.py` - إضافة حقل photo_url
- `backend/models_updated.py` - إضافة حقل photo_url  
- `backend/schemas.py` - إضافة photo_url إلى UserBase و UserUpdate
- `backend/crud.py` - تحديث create_user و update_user_data
- `backend/add_photo_url_column.sql` - SQL migration script
- `backend/migrate_photo_url.py` - Python migration script

### Frontend
- الواجهة الأمامية كانت تعمل بشكل صحيح بالفعل وتتوقع وجود حقل `photo_url`

## كيفية التشغيل

1. تأكد من تشغيل الـ migration:
```bash
cd backend
source venv/bin/activate
python migrate_photo_url.py
```

2. أعد تشغيل الـ backend server:
```bash
cd backend
source venv/bin/activate
python main.py
```

3. أعد تشغيل الـ frontend:
```bash
npm run dev
```

## الاختبار

الآن يمكنك:
1. الذهاب إلى صفحة إدارة المستخدمين
2. إنشاء مستخدم جديد أو تعديل مستخدم موجود
3. رفع صورة شخصية
4. حفظ التغييرات
5. ستلاحظ أن الصورة الشخصية تظهر في قائمة المستخدمين

## ملاحظات

- الصور يتم تحويلها إلى base64 وتخزينها كـ URL
- الحد الأقصى لحجم الصورة هو 5 ميجابايت
- الصور المدعومة: JPG, PNG, GIF
- إذا لم يتم رفع صورة، سيظهر الحرفين الأولين من الاسم كـ fallback

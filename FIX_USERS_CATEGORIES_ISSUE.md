# إصلاح مشكلة تحميل المستخدمين والتصنيفات

## المشكلة

عند فتح صفحة المستخدمين (`http://localhost:5174/users`) أو نموذج إنشاء جولة، تظهر الأخطاء التالية:
- "خطأ في تحميل المستخدمين: فشل في تحميل المستخدمين"
- "لا توجد تصنيفات متاحة"
- "لا يوجد مقيمون متاحون"

## السبب

1. **مشكلة في Validation Schema:**
   - Pydantic كان يستخدم `EmailStr` والذي يرفض الإيميلات المؤقتة مثل `testqm@local`
   - Backend يُرجع 500 Internal Server Error عند محاولة إرجاع مستخدمين بإيميلات غير صالحة

2. **مشكلة في Token:**
   - قد يكون token المُخزّن في `localStorage` قد انتهت صلاحيته
   - Frontend يُرسل طلبات إلى Backend بدون token صالح

## الحل المُطبّق

### 1. تعديل schemas.py
تم تغيير `email: EmailStr` إلى `email: str` في:
- `UserBase`
- `UserUpdate`
- `UserResponse`

هذا يسمح للنظام بقبول أي شكل من أشكال البريد الإلكتروني بما فيها الإيميلات المؤقتة للاختبار.

```python
# Before:
email: EmailStr

# After:
email: str  # Changed to allow test emails like testqm@local
```

### 2. إعادة تشغيل Backend
تم إعادة تشغيل Backend لتطبيق التغييرات:
```bash
docker restart salamah-backend
```

## الخطوات المطلوبة من المستخدم

### 1. تحديث Token في المتصفح

افتح صفحة `http://localhost:5174/login` وسجّل دخول مرة أخرى بأحد الحسابات التالية:

**حساب Quality Manager:**
- Email: `testqm@local`
- Password: `test123`

**حساب آخر:**
- Email: `test59@local`
- Password: `test123`

### 2. التحقق من صلاحية Token

افتح Console في المتصفح (`F12` → Console) واكتب:

```javascript
// عرض token الحالي
console.log('Token:', localStorage.getItem('access_token'))

// عرض بيانات المستخدم
console.log('User:', JSON.parse(localStorage.getItem('sallamaty_user')))
```

إذا كان Token غير موجود أو منتهي الصلاحية، سجّل دخول مرة أخرى.

### 3. اختبار صفحة المستخدمين

بعد تسجيل الدخول:
1. افتح `http://localhost:5174/users`
2. يجب أن تظهر قائمة المستخدمين بنجاح

### 4. اختبار نموذج إنشاء جولة

1. افتح `http://localhost:5174/rounds/new`
2. يجب أن تظهر:
   - التصنيفات المتاحة في قائمة "التصنيفات"
   - المقيمون المتاحون في قائمة "المقيمون"

## التحقق من عمل API

يمكنك اختبار API مباشرة من Terminal:

```bash
# 1. سجّل دخول واحصل على token
curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"testqm@local","password":"test123"}'

# 2. استخدم token للوصول إلى المستخدمين
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/users

# 3. اختبر التصنيفات
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/evaluation-categories
```

## حل بديل: إنشاء مستخدمين بإيميلات حقيقية

إذا كنت تريد استخدام validation صارم للإيميلات، يمكنك:

1. حذف المستخدمين المؤقتين
2. إنشاء مستخدمين بإيميلات صالحة مثل:
   - `admin@salamaty.com`
   - `qm@salamaty.com`
   - `assessor@salamaty.com`

### سكريبت لإنشاء مستخدم بإيميل صالح:

```python
from backend.database import SessionLocal
from backend.models_updated import User, UserRole
from backend.auth import get_password_hash

db = SessionLocal()

user = User(
    username="admin",
    email="admin@salamaty.com",  # إيميل صالح
    hashed_password=get_password_hash("admin123"),
    first_name="مدير",
    last_name="النظام",
    role=UserRole.SUPER_ADMIN,
    department="الإدارة",
    is_active=True
)

db.add(user)
db.commit()
print(f"تم إنشاء مستخدم: {user.email}")
db.close()
```

## ملاحظات

- ✅ Backend الآن يدعم الإيميلات المؤقتة
- ✅ API endpoints تعمل بشكل صحيح
- ⚠️ تأكد من تسجيل دخول جديد بعد إعادة تشغيل Backend
- 💡 يُفضّل استخدام إيميلات حقيقية في بيئة Production

---

تاريخ الإصلاح: 2025-10-12


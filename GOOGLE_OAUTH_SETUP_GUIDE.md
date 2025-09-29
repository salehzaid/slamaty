# دليل إعداد Google OAuth

## المشكلة الحالية
```
Access blocked: Authorization Error
ginosa14@gmail.com
no registered origin
Error 401: invalid_client
```

## الحلول المطلوبة

### 1. إنشاء Google OAuth Client ID

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعل Google+ API أو Google Identity API
4. اذهب إلى "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. اختر "Web application"
6. أضف Authorized JavaScript origins:
   - `http://localhost:5174` (للاختبار المحلي)
   - `https://yourdomain.com` (للإنتاج)
7. احفظ Client ID

### 2. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في root المشروع:

```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here

# API Configuration
VITE_API_URL=http://localhost:8000
```

### 3. تحديث الكود

بعد الحصول على Client ID الصحيح، حدث الكود في `RegisterPage.tsx`:

```typescript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id'
```

## الحل المؤقت

حالياً تم تعطيل Google OAuth مؤقتاً. يمكنك:

1. **استخدام التسجيل العادي**: املأ النموذج واختر دور من القائمة
2. **اختبار النظام**: جرب إنشاء حساب جديد بالتسجيل العادي

## الأدوار المتاحة

- `assessor` - مقيم
- `department_head` - رئيس قسم
- `quality_manager` - مدير الجودة
- `super_admin` - مدير النظام
- `viewer` - مشاهد

## رابط التطبيق

التطبيق يعمل الآن على: http://localhost:5174/register

## ملاحظات مهمة

- تأكد من أن الـ backend يعمل على المنفذ 8000
- استخدم الأدوار الصحيحة المذكورة أعلاه
- Google OAuth سيعمل بعد إعداد Client ID الصحيح
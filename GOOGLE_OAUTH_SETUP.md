# إعداد Google OAuth للتسجيل

## الخطوات المطلوبة لإعداد Google OAuth

### 1. إنشاء مشروع في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل Google+ API

### 2. إنشاء OAuth 2.0 Client ID

1. في لوحة التحكم، اذهب إلى "APIs & Services" > "Credentials"
2. انقر على "Create Credentials" > "OAuth 2.0 Client ID"
3. اختر "Web application" كنوع التطبيق
4. أضف النطاقات التالية في "Authorized redirect URIs":
   - `http://localhost:3000` (للتطوير)
   - `https://yourdomain.com` (للإنتاج)

### 3. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في مجلد المشروع وأضف:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here
REACT_APP_API_URL=http://localhost:8000
```

### 4. تحديث صفحة التسجيل

تأكد من تحديث `GOOGLE_CLIENT_ID` في ملف `src/components/RegisterPage.tsx`:

```typescript
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id'
```

### 5. اختبار الميزة

1. شغّل الخادم الخلفي: `cd backend && python main.py`
2. شغّل الواجهة الأمامية: `npm run dev`
3. اذهب إلى `/register`
4. انقر على "التسجيل بحساب جوجل"
5. اختر حساب جوجل للمصادقة

## الميزات المضافة

- ✅ صفحة تسجيل جديدة مع Google OAuth
- ✅ API endpoint للتعامل مع Google OAuth
- ✅ ربط تلقائي بين صفحات تسجيل الدخول والتسجيل
- ✅ معالجة المستخدمين الجدد والموجودين
- ✅ واجهة مستخدم عربية متجاوبة

## ملاحظات مهمة

- تأكد من إعداد Google OAuth بشكل صحيح قبل الاستخدام
- في بيئة الإنتاج، استخدم HTTPS
- احتفظ بمفاتيح OAuth في مكان آمن
- راجع سياسات الخصوصية والأمان لـ Google

# دليل تفعيل إرسال الإيميلات عبر Gmail SMTP

## المشكلة الحالية

عند محاولة إرسال البريد الإلكتروني عبر Gmail SMTP، حصلنا على الخطأ التالي:
```
(535, b'5.7.8 Username and Password not accepted. For more information, go to
5.7.8  https://support.google.com/mail/?p=BadCredentials')
```

## السبب

Gmail لا يسمح بتسجيل الدخول المباشر عبر كلمة المرور العادية للتطبيقات الخارجية لأسباب أمنية.

## الحل: إنشاء App Password (كلمة مرور التطبيق)

### الخطوات المطلوبة:

#### 1. تفعيل التحقق بخطوتين (2-Step Verification)
- سجل الدخول إلى حساب Gmail: salamahrounds@gmail.com
- افتح إعدادات الأمان: https://myaccount.google.com/security
- ابحث عن "التحقق بخطوتين" (2-Step Verification)
- إذا لم يكن مفعّلاً، قم بتفعيله الآن

#### 2. إنشاء كلمة مرور للتطبيق (App Password)
- بعد تفعيل التحقق بخطوتين، افتح صفحة كلمات مرور التطبيقات:
  https://myaccount.google.com/apppasswords
- اختر "تطبيق آخر" (Other app) أو "بريد" (Mail)
- أدخل اسماً للتطبيق مثل: "Salamaty System"
- انقر "إنشاء" (Generate)
- سيظهر لك كلمة مرور مكونة من 16 حرفاً (مثل: `xxxx xxxx xxxx xxxx`)
- **احفظ هذه الكلمة في مكان آمن** - لن تظهر مرة أخرى!

#### 3. تحديث إعدادات SMTP في النظام

استخدم كلمة المرور الجديدة (App Password) بدلاً من كلمة المرور العادية:

**في بيئة الإنتاج (Production):**

أضف المتغيرات التالية في إعدادات Railway أو Docker:

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=salamahrounds@gmail.com
SENDER_PASSWORD=xxxx xxxx xxxx xxxx  # كلمة مرور التطبيق الجديدة (بدون مسافات)
SENDER_NAME=نظام سلامتي - Salamaty System
```

**في بيئة التطوير المحلية:**

قم بتصدير المتغيرات في Terminal قبل تشغيل Backend:

```bash
export SMTP_SERVER='smtp.gmail.com'
export SMTP_PORT='587'
export SENDER_EMAIL='salamahrounds@gmail.com'
export SENDER_PASSWORD='xxxxxxxxxxxxxxxx'  # كلمة مرور التطبيق (16 حرف بدون مسافات)
export SENDER_NAME='نظام سلامتي'
```

ثم شغّل Backend:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 4. اختبار الإرسال

بعد تحديث كلمة المرور، يمكنك اختبار إرسال البريد:

```python
from backend.email_service import EmailService
service = EmailService()
result = service.send_notification_email(
    to_email='salamahrounds@gmail.com',
    to_name='مدير النظام',
    title='اختبار إرسال البريد',
    message='رسالة تجريبية من نظام سلامتي',
    notification_type='system_update'
)
print('Email sent:', result)
```

## كيفية عمل النظام الآن

### إرسال الإيميلات تلقائياً

النظام الآن مُهيأ لإرسال إيميلات تلقائية في الحالات التالية:

#### 1. عند إنشاء CAPA جديدة
- يتم إرسال إشعار إلى **مديري القسم** المسؤول
- العنوان: "خطة تصحيحية جديدة"
- الرسالة تتضمن: اسم الخطة، القسم، واسم المُنشئ

#### 2. عند تحديث حالة CAPA إلى IMPLEMENTED أو VERIFIED
- يتم إرسال إشعار إلى **مديري القسم**
- العنوان: "خطة تصحيحية محدثة"
- الرسالة تتضمن: اسم الخطة، الحالة الجديدة، واسم المحدّث

#### 3. آلية الإرسال
1. عند إنشاء إشعار في قاعدة البيانات، يحاول النظام تلقائياً إرسال بريد إلكتروني
2. إذا فشل إرسال البريد (مثل: إعدادات SMTP غير صحيحة)، يبقى الإشعار في قاعدة البيانات
3. المستخدم يستلم الإشعار داخل التطبيق حتى لو فشل إرسال البريد

### إعدادات الإشعارات للمستخدمين

- بشكل افتراضي، جميع المستخدمين يستلمون إشعارات البريد الإلكتروني
- يمكن للمستخدم تعطيل إشعارات البريد عبر إعداداته الشخصية (قادم قريباً)

## ملاحظات أمنية

⚠️ **مهم جداً:**
1. **لا تشارك كلمة مرور التطبيق** مع أي شخص
2. **لا تضع كلمة المرور في الكود** - استخدم متغيرات البيئة فقط
3. **احذف كلمة المرور القديمة** من حساب Google بعد إنشاء App Password
4. يمكنك **إلغاء App Password** من إعدادات الأمان في أي وقت إذا تم اختراقها

## استكشاف الأخطاء

### خطأ: "Username and Password not accepted"
- تأكد أنك تستخدم **App Password** وليس كلمة المرور العادية
- تأكد أن التحقق بخطوتين **مفعّل**

### خطأ: "Name or service not known"
- تأكد من اتصال الخادم بالإنترنت
- تحقق من إعدادات الـ Firewall

### لا يتم إرسال الإيميلات
1. تحقق من متغيرات البيئة: `echo $SMTP_SERVER`
2. راجع سجلات Backend للبحث عن أخطاء SMTP
3. تأكد أن البريد الإلكتروني للمستلم صحيح

## الخطوات التالية

بعد تفعيل App Password:
1. قم بتحديث المتغيرات البيئية في Railway
2. أعد تشغيل الـ Backend
3. اختبر إرسال CAPA جديدة وتحقق من وصول البريد
4. راجع جدول `notifications` في قاعدة البيانات للتأكد من تحديث `is_email_sent = true`

---

تم إنشاء هذا الدليل: 2025-10-12

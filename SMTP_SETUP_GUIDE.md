# دليل إعداد البريد الإلكتروني (SMTP) - نظام سلامتي

## نظرة عامة
يدعم نظام سلامتي إرسال الإشعارات عبر البريد الإلكتروني باستخدام SMTP. هذا الدليل يوضح كيفية إعداد خدمات البريد الإلكتروني المختلفة.

---

## 1. إعدادات عامة (Generic SMTP)

### الخطوات الأساسية

1. **إضافة الإعدادات إلى `.env`**

```env
# SMTP Email Configuration
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SENDER_EMAIL=notifications@salamaty.com
SENDER_PASSWORD=your_secure_password
SENDER_NAME=نظام سلامتي
```

2. **الحقول المطلوبة**

| الحقل | الوصف | مثال |
|------|-------|------|
| `SMTP_SERVER` | عنوان خادم SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | منفذ SMTP (587 لـ TLS، 465 لـ SSL) | `587` |
| `SENDER_EMAIL` | البريد المُرسِل | `no-reply@salamaty.com` |
| `SENDER_PASSWORD` | كلمة المرور أو App Password | `abcd efgh ijkl mnop` |
| `SENDER_NAME` | اسم المُرسِل (يظهر للمستلم) | `نظام سلامتي` |

3. **إعادة تشغيل Backend**

```bash
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds
source backend/venv/bin/activate  # إذا كنت تستخدم venv
python3 backend/main.py
```

---

## 2. Gmail SMTP

### المتطلبات
- حساب Gmail نشط
- تفعيل "App Passwords" (كلمات مرور التطبيقات)

### الخطوات

#### 1. إنشاء App Password

1. اذهب إلى حساب Google: https://myaccount.google.com/
2. انتقل إلى **الأمان (Security)**
3. قم بتفعيل **التحقق بخطوتين (2-Step Verification)** إذا لم يكن مفعلاً
4. ابحث عن **App Passwords** (كلمات مرور التطبيقات)
5. اختر **Mail** ثم **Other (نظام سلامتي)**
6. انقر **Generate** لإنشاء كلمة مرور جديدة
7. انسخ كلمة المرور (16 رقماً بدون مسافات)

#### 2. إعدادات `.env`

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=abcd efgh ijkl mnop  # App Password من الخطوة السابقة
SENDER_NAME=نظام سلامتي
```

#### 3. اختبار الاتصال

```bash
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds
python3 << 'EOF'
import smtplib
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

try:
    server = smtplib.SMTP(os.getenv('SMTP_SERVER'), int(os.getenv('SMTP_PORT')))
    server.starttls()
    server.login(os.getenv('SENDER_EMAIL'), os.getenv('SENDER_PASSWORD'))
    print('✅ اتصال Gmail SMTP ناجح!')
    server.quit()
except Exception as e:
    print(f'❌ خطأ في الاتصال: {e}')
EOF
```

### حدود الإرسال (Gmail Limits)
- **100 رسالة/يوم** للحسابات المجانية
- **2000 رسالة/يوم** لحسابات Google Workspace

⚠️ **تحذير:** Gmail غير مناسب للإنتاج بأحجام كبيرة. استخدم خدمة احترافية لذلك.

---

## 3. Outlook / Office 365 SMTP

### الإعدادات

```env
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
SENDER_EMAIL=your-email@outlook.com  # أو your-email@yourdomain.com
SENDER_PASSWORD=your_password
SENDER_NAME=نظام سلامتي
```

### ملاحظات
- إذا كنت تستخدم حساباً تنظيمياً (Office 365 Business)، قد تحتاج لموافقة المسؤول
- يُفضل استخدام **App Password** بدلاً من كلمة المرور الأساسية
- اذهب إلى **Security → App passwords** في إعدادات حسابك

### حدود الإرسال
- **300 رسالة/يوم** للحسابات المجانية
- **10,000 رسالة/يوم** لـ Office 365 Business

---

## 4. SendGrid (موصى به للإنتاج)

### لماذا SendGrid؟
- ✅ موثوقية عالية (99.95% uptime)
- ✅ إرسال سريع (ثوانٍ)
- ✅ تحليلات مفصلة (open rate, click rate)
- ✅ إدارة قوالب احترافية
- ✅ دعم فني ممتاز

### التسجيل

1. اذهب إلى: https://signup.sendgrid.com/
2. أنشئ حساباً مجانياً (40,000 رسالة/شهر مجاناً لأول 30 يوم، ثم 100 رسالة/يوم)
3. أكمل التحقق من البريد الإلكتروني

### إعداد API Key

1. اذهب إلى **Settings → API Keys**
2. انقر **Create API Key**
3. اختر **Full Access** أو **Restricted Access** (Mail Send فقط)
4. انسخ المفتاح (يبدأ بـ `SG.`)

### إعدادات `.env` (SMTP)

```env
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SENDER_EMAIL=verified-sender@yourdomain.com  # يجب أن يكون موثّقاً
SENDER_PASSWORD=YOUR_SENDGRID_API_KEY  # استخدم API Key هنا
SENDER_NAME=نظام سلامتي
```

### التحقق من البريد المُرسِل (Sender Verification)

**مهم جداً:** SendGrid يتطلب التحقق من البريد المُرسِل

#### خيار 1: Single Sender Verification (سريع)
1. اذهب إلى **Settings → Sender Authentication → Single Sender Verification**
2. انقر **Create New Sender**
3. أدخل معلومات المُرسِل:
   ```
   From Name: نظام سلامتي
   From Email: no-reply@yourdomain.com
   Reply To: support@yourdomain.com
   Company: شركة سلامتي
   ```
4. تحقق من البريد الذي سيُرسل للتأكيد

#### خيار 2: Domain Authentication (احترافي)
1. اذهب إلى **Settings → Sender Authentication → Authenticate Your Domain**
2. أدخل نطاقك (yourdomain.com)
3. أضف سجلات DNS المطلوبة (CNAME records) في إعدادات النطاق
4. انتظر التحقق (عادةً 24-48 ساعة)

### الترقية إلى خطة مدفوعة

| الخطة | السعر/شهر | الإرسال/شهر |
|-------|----------|-------------|
| Free | $0 | 100/يوم (3,000/شهر) |
| Essentials | $19.95 | 50,000 |
| Pro | $89.95 | 1,500,000 |

### استخدام SendGrid API (بديل عن SMTP)

إذا أردت استخدام API بدلاً من SMTP:

1. **تثبيت مكتبة SendGrid**

```bash
pip install sendgrid
```

2. **تعديل `backend/email_service.py`**

```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os

def send_email_sendgrid(to_email: str, subject: str, html_content: str, plain_content: str):
    """
    إرسال بريد إلكتروني باستخدام SendGrid API
    """
    message = Mail(
        from_email=(os.getenv('SENDER_EMAIL'), os.getenv('SENDER_NAME')),
        to_emails=to_email,
        subject=subject,
        html_content=html_content,
        plain_text_content=plain_content
    )
    
    try:
        sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
        response = sg.send(message)
        print(f'✅ Email sent via SendGrid: {response.status_code}')
        return True
    except Exception as e:
        print(f'❌ SendGrid error: {e}')
        return False
```

3. **إضافة API Key إلى `.env`**

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 5. Amazon SES (AWS Simple Email Service)

### متى تستخدم SES؟
- ✅ لديك حساب AWS بالفعل
- ✅ تحتاج لتكامل مع خدمات AWS الأخرى
- ✅ إرسال كميات ضخمة (ملايين الرسائل)

### التكلفة
- **$0.10** لكل 1000 رسالة
- **مجاناً:** 62,000 رسالة/شهر إذا كان التطبيق يعمل على EC2

### الإعداد

#### 1. إنشاء Identity في SES

```bash
# AWS CLI
aws ses verify-email-identity --email-address no-reply@yourdomain.com --region us-east-1
```

أو عبر Console:
1. اذهب إلى AWS SES Console
2. انقر **Identities → Create Identity**
3. اختر **Email address** أو **Domain**
4. أكمل التحقق

#### 2. إنشاء SMTP Credentials

1. في SES Console، اذهب إلى **SMTP Settings**
2. انقر **Create SMTP Credentials**
3. أدخل اسماً للمستخدم (مثل: `salamaty-smtp-user`)
4. انسخ **Username** و **Password**

#### 3. إعدادات `.env`

```env
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com  # غيّر المنطقة حسب اختيارك
SMTP_PORT=587
SENDER_EMAIL=no-reply@yourdomain.com  # يجب أن يكون موثّقاً في SES
SENDER_PASSWORD=your_smtp_password
SENDER_NAME=نظام سلامتي
```

#### 4. الخروج من Sandbox Mode

افتراضياً، SES في وضع Sandbox (لا يمكن إرسال إلا لعناوين موثّقة).

**للخروج من Sandbox:**
1. اذهب إلى **Account Dashboard** في SES
2. انقر **Request production access**
3. املأ النموذج (سبب الاستخدام، حجم الإرسال المتوقع)
4. انتظر الموافقة (عادةً 24 ساعة)

---

## 6. اختبار البريد الإلكتروني

### نص اختبار شامل

```python
# backend/test_email.py
import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv('backend/.env')

def test_email():
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_PASSWORD')
    receiver_email = input('أدخل البريد المُستلم: ')
    
    message = MIMEMultipart('alternative')
    message['Subject'] = 'رسالة اختبار - نظام سلامتي'
    message['From'] = f"{os.getenv('SENDER_NAME')} <{sender_email}>"
    message['To'] = receiver_email
    
    text = """
    مرحباً،
    
    هذه رسالة اختبار من نظام سلامتي.
    إذا استلمت هذه الرسالة، فإن إعدادات SMTP تعمل بشكل صحيح.
    
    شكراً،
    نظام سلامتي
    """
    
    html = """
    <html>
      <body dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif;">
        <h2 style="color: #2563eb;">مرحباً،</h2>
        <p>هذه رسالة اختبار من <strong>نظام سلامتي</strong>.</p>
        <p>إذا استلمت هذه الرسالة، فإن إعدادات SMTP تعمل بشكل صحيح ✅</p>
        <hr>
        <p style="color: #666; font-size: 12px;">شكراً،<br>نظام سلامتي</p>
      </body>
    </html>
    """
    
    part1 = MIMEText(text, 'plain', 'utf-8')
    part2 = MIMEText(html, 'html', 'utf-8')
    message.attach(part1)
    message.attach(part2)
    
    try:
        context = ssl.create_default_context()
        server = smtplib.SMTP(os.getenv('SMTP_SERVER'), int(os.getenv('SMTP_PORT')))
        server.starttls(context=context)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, message.as_string())
        server.quit()
        
        print(f'✅ تم إرسال الرسالة بنجاح إلى {receiver_email}')
        print('✅ تحقق من صندوق الوارد (أو Spam إذا لم تجدها)')
    except Exception as e:
        print(f'❌ خطأ في الإرسال: {e}')

if __name__ == '__main__':
    test_email()
```

### تشغيل الاختبار

```bash
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds
python3 backend/test_email.py
```

---

## 7. استكشاف الأخطاء (Troubleshooting)

### الخطأ: `535 5.7.8 Username and Password not accepted`

**السبب:** بيانات اعتماد خاطئة

**الحلول:**
1. تحقق من `SENDER_EMAIL` و `SENDER_PASSWORD` في `.env`
2. لـ Gmail: تأكد من استخدام **App Password** وليس كلمة المرور العادية
3. تأكد من عدم وجود مسافات زائدة في `.env`
4. جرّب تسجيل الدخول اليدوي عبر المتصفح للتأكد من صحة الحساب

### الخطأ: `SMTPServerDisconnected: Connection unexpectedly closed`

**السبب:** منفذ SMTP خاطئ أو مشكلة في الشبكة

**الحلول:**
1. تحقق من `SMTP_PORT` (يجب أن يكون 587 أو 465)
2. تأكد من أن الشبكة/الجدار الناري لا يحجب المنفذ
3. جرّب المنفذ 465 مع SSL بدلاً من TLS

### الخطأ: `SMTPAuthenticationError: (534, b'5.7.9 Application-specific password required')`

**السبب:** محاولة استخدام كلمة مرور عادية بدلاً من App Password

**الحل:** أنشئ App Password من إعدادات Gmail Security

### الخطأ: الرسالة تذهب إلى Spam

**الأسباب:**
- البريد المُرسِل غير موثّق
- عدم وجود سجلات SPF/DKIM/DMARC
- محتوى مشبوه

**الحلول:**
1. استخدم خدمة احترافية (SendGrid/SES) مع Domain Authentication
2. أضف سجلات SPF و DKIM لنطاقك
3. تجنب الكلمات المشبوهة في الموضوع/المحتوى
4. أضف "Unsubscribe" link في التذييل

---

## 8. أفضل الممارسات

### الأمان

1. **لا تكشف بيانات الاعتماد:**
   ```bash
   # أضف .env إلى .gitignore
   echo "backend/.env" >> .gitignore
   ```

2. **استخدم متغيرات بيئة في Production:**
   ```bash
   # Railway/Heroku/AWS
   railway variables set SMTP_SERVER=smtp.sendgrid.net
   railway variables set SENDER_EMAIL=no-reply@salamaty.com
   ```

3. **قيّد الصلاحيات:**
   - استخدم API Keys مقيدة (Restricted)
   - فعّل IP whitelisting إذا كان متاحاً

### الأداء

1. **استخدم قوائم انتظار (Queues):**
   ```python
   # مثال باستخدام Celery
   from celery import Celery
   
   app = Celery('tasks', broker='redis://localhost:6379/0')
   
   @app.task
   def send_email_async(to_email, subject, body):
       send_email(to_email, subject, body)
   ```

2. **لا ترسل رسائل في الـ Request/Response cycle:**
   - استخدم مهام خلفية (background tasks)
   - استخدم webhooks للتحديثات الفورية

### المراقبة

1. **سجّل جميع الأخطاء:**
   ```python
   import logging
   
   logger = logging.getLogger(__name__)
   
   try:
       send_email(...)
   except Exception as e:
       logger.error(f'Email send failed: {e}', exc_info=True)
   ```

2. **راقب معدل الإرسال:**
   - احتفظ بإحصائيات يومية/شهرية
   - تنبّه عند اقتراب الحد الأقصى

---

## 9. الملخص والتوصيات

### للتطوير والاختبار
✅ **Gmail SMTP** (مجاني، سريع الإعداد)

### للإنتاج (صغير - متوسط)
✅ **SendGrid** (موثوق، سهل، تحليلات)

### للإنتاج (كبير)
✅ **Amazon SES** (اقتصادي، مع AWS)

### مقارنة سريعة

| الخدمة | التكلفة | سهولة الإعداد | الحد المجاني | التوصية |
|--------|---------|---------------|--------------|----------|
| Gmail | مجاني | ⭐⭐⭐ | 100/يوم | تطوير فقط |
| Outlook | مجاني | ⭐⭐ | 300/يوم | تطوير/صغير |
| SendGrid | $0-20/شهر | ⭐⭐⭐ | 100/يوم | إنتاج (موصى) |
| AWS SES | $0.10/1000 | ⭐⭐ | 62,000/شهر | إنتاج كبير |

---

**تاريخ التوثيق:** 2025-10-11  
**الإصدار:** 1.0  
**للدعم الفني:** support@salamaty.com


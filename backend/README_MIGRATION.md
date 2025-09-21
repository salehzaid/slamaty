# 🗄️ دليل نقل البيانات إلى قاعدة البيانات المحلية

## 📋 نظرة عامة

هذا الدليل يوضح كيفية نقل كافة البيانات الافتراضية من النظام إلى قاعدة البيانات المحلية PostgreSQL في pgAdmin4.

## 🎯 الهدف

- نقل جميع البيانات الافتراضية إلى قاعدة البيانات المحلية `salamaty_db`
- استخدام المستخدم `postgres` مع كلمة المرور `mass`
- الحفاظ على جميع العلاقات والبيانات

## 📊 البيانات المنقولة

### 👥 المستخدمون (5 مستخدمين)
- **admin** - admin@salamaty.com (مدير النظام)
- **quality_manager** - quality@salamaty.com (مديرة الجودة)
- **ed_head** - ed@salamaty.com (رئيس قسم الطوارئ)
- **assessor1** - assessor@salamaty.com (مقيم جودة)
- **viewer** - viewer@salamaty.com (مشاهد)

### 🏥 الأقسام (6 أقسام)
- قسم الطوارئ (ED)
- قسم العناية المركزة (ICU)
- قسم الجراحة (SURG)
- قسم الأطفال (PEDS)
- التمريض (NUR)
- النساء والولادة (OBS)

### 📋 تصنيفات التقييم (6 تصنيفات)
- مكافحة العدوى (أحمر)
- سلامة المرضى (أزرق)
- الجودة (أخضر)
- الأمن والسلامة (برتقالي)
- النظافة والتعقيم (بنفسجي)
- سلامة الأدوية (سماوي)

### 📝 عناصر التقييم (9 عناصر)
- IC001 - غسل اليدين
- IC002 - استخدام القفازات
- PS001 - تحديد هوية المريض
- PS002 - التحقق من الحساسية
- Q001 - توثيق العمليات
- Q002 - مراجعة السياسات
- SS001 - التحقق من الأجهزة
- HS001 - تنظيف الأسطح
- MS001 - تخزين الأدوية

### 🔄 الجولات (6 جولات)
- RND-2024-001 - جولة سلامة المرضى (مكتملة)
- RND-2024-002 - جولة مكافحة العدوى (قيد التنفيذ)
- RND-2024-003 - جولة النظافة (مجدولة)
- RND-2024-004 - جولة سلامة الأدوية (متأخرة)
- RND-2024-005 - جولة الجودة (مجدولة)
- RND-2024-006 - جولة الأمن والسلامة (مجدولة)

### 📋 الخطط التصحيحية (5 خطط)
- تحسين بروتوكول غسل اليدين (مطبقة)
- تدريب الطاقم على مكافحة العدوى (قيد التنفيذ)
- تحديث نظام تخزين الأدوية (معلقة)
- تحسين نظام التوثيق (مكلفة)
- تحديث سياسات الأمن والسلامة (معلقة)

### 📊 نتائج التقييم (7 نتائج)
- نتائج جولة سلامة المرضى
- نتائج جولة مكافحة العدوى

## 🚀 طرق التنفيذ

### الطريقة الأولى: السكريبت التلقائي (مستحسن)

```bash
# 1. انتقل إلى مجلد backend
cd backend

# 2. اجعل السكريبت قابل للتنفيذ
chmod +x setup_local_database.sh

# 3. تشغيل السكريبت
./setup_local_database.sh
```

### الطريقة الثانية: السكريبت Python

```bash
# 1. انتقل إلى مجلد backend
cd backend

# 2. تشغيل سكريبت Python
python3 migrate_to_local.py
```

### الطريقة الثالثة: تشغيل SQL مباشرة

```bash
# 1. انتقل إلى مجلد backend
cd backend

# 2. تشغيل ملف SQL مباشرة
PGPASSWORD=mass psql -U postgres -d salamaty_db -f migrate_to_local_db.sql
```

## 🔧 متطلبات النظام

### 1. PostgreSQL
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql postgresql-server
```

### 2. Python 3
```bash
# تأكد من تثبيت Python 3
python3 --version
```

### 3. pgAdmin4
- تحميل من: https://www.pgadmin.org/download/

## ⚙️ إعداد قاعدة البيانات

### 1. إنشاء قاعدة البيانات
```sql
-- في psql أو pgAdmin4
CREATE DATABASE salamaty_db;
```

### 2. إنشاء المستخدم (اختياري)
```sql
-- إذا كنت تريد مستخدم مخصص
CREATE USER salamaty_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE salamaty_db TO salamaty_user;
```

## 🔍 التحقق من النجاح

### 1. عبر pgAdmin4
1. افتح pgAdmin4
2. اتصل بالخادم المحلي
3. انتقل إلى `salamaty_db` → `Schemas` → `public` → `Tables`
4. تصفح الجداول والبيانات

### 2. عبر psql
```bash
# الاتصال بقاعدة البيانات
PGPASSWORD=mass psql -U postgres -d salamaty_db

# عرض الجداول
\dt

# عرض البيانات
SELECT * FROM users;
SELECT * FROM departments;
SELECT * FROM evaluation_categories;
```

### 3. عبر API
```bash
# اختبار API endpoints
curl -X GET "http://localhost:8000/users" -H "Authorization: Bearer YOUR_TOKEN"
curl -X GET "http://localhost:8000/departments" -H "Authorization: Bearer YOUR_TOKEN"
curl -X GET "http://localhost:8000/evaluation-categories" -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 تحديث إعدادات التطبيق

### 1. تحديث ملف .env
```bash
# انسخ الإعدادات المحلية
cp env.local .env
```

### 2. أو قم بتحديث DATABASE_URL يدوياً
```env
DATABASE_URL=postgresql://postgres:mass@localhost:5432/salamaty_db
```

### 3. إعادة تشغيل الخادم
```bash
# في مجلد backend
python main.py
```

## 🐛 حل المشاكل الشائعة

### 1. خطأ الاتصال بقاعدة البيانات
```
FATAL: password authentication failed for user "postgres"
```
**الحل:**
- تأكد من كلمة مرور المستخدم postgres
- جرب: `sudo -u postgres psql` ثم `ALTER USER postgres PASSWORD 'mass';`

### 2. قاعدة البيانات غير موجودة
```
FATAL: database "salamaty_db" does not exist
```
**الحل:**
```bash
createdb -U postgres salamaty_db
```

### 3. صلاحيات المستخدم
```
FATAL: permission denied for database "salamaty_db"
```
**الحل:**
```sql
GRANT ALL PRIVILEGES ON DATABASE salamaty_db TO postgres;
```

### 4. خادم PostgreSQL غير مشغل
```
FATAL: the database system is starting up
```
**الحل:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

## 📊 استعلامات مفيدة

### عرض إحصائيات البيانات
```sql
SELECT 
    'المستخدمون' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'الأقسام', COUNT(*) FROM departments
UNION ALL
SELECT 'الجولات', COUNT(*) FROM rounds
UNION ALL
SELECT 'الخطط التصحيحية', COUNT(*) FROM capas
UNION ALL
SELECT 'تصنيفات التقييم', COUNT(*) FROM evaluation_categories
UNION ALL
SELECT 'عناصر التقييم', COUNT(*) FROM evaluation_items
UNION ALL
SELECT 'نتائج التقييم', COUNT(*) FROM evaluation_results;
```

### عرض تفاصيل المستخدمين
```sql
SELECT 
    id,
    username,
    email,
    first_name || ' ' || last_name as full_name,
    role,
    department,
    position,
    is_active
FROM users
ORDER BY id;
```

### عرض حالة الجولات
```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(compliance_percentage), 2) as avg_compliance
FROM rounds
GROUP BY status
ORDER BY count DESC;
```

## 🔐 بيانات الدخول الافتراضية

| المستخدم | البريد الإلكتروني | كلمة المرور | الدور |
|----------|------------------|-------------|-------|
| admin | admin@salamaty.com | admin123 | مدير النظام |
| quality_manager | quality@salamaty.com | admin123 | مديرة الجودة |
| ed_head | ed@salamaty.com | admin123 | رئيس قسم الطوارئ |
| assessor1 | assessor@salamaty.com | admin123 | مقيم جودة |
| viewer | viewer@salamaty.com | admin123 | مشاهد |

## 📞 الدعم

إذا واجهت أي مشاكل، يرجى:
1. التحقق من سجلات الأخطاء
2. التأكد من إعدادات قاعدة البيانات
3. فحص صلاحيات المستخدم
4. مراجعة هذا الدليل

---

**تم إنشاء هذا الدليل بواسطة نظام سلامتي** 🏥

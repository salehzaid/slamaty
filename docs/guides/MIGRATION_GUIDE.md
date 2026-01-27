# دليل ترحيل assigned_to_ids إلى JSONB

## نظرة عامة
هذا الدليل يوضح كيفية ترحيل عمود `assigned_to_ids` من نوع `TEXT` إلى `JSONB` في قاعدة البيانات. هذا الترحيل سيحل مشكلة الخطأ `operator does not exist: text @> jsonb` ويحسن الأداء.

## المتطلبات
- الوصول إلى قاعدة البيانات (psql أو Railway Console)
- صلاحيات إدارة قاعدة البيانات (CREATE, ALTER, DROP)
- نسخة احتياطية من قاعدة البيانات (مُوصى به بشدة)

## الطرق المتاحة

### الطريقة الأولى: استخدام سكربت Python (مُوصى به)
```bash
# 1. تأكد من وجود متغيرات البيئة لقاعدة البيانات
export DB_HOST="your-db-host"
export DB_PORT="5432"
export DB_NAME="salamaty_db"
export DB_USER="your-username"
export DB_PASSWORD="your-password"

# 2. تشغيل السكربت
python3 run_migration.py
```

### الطريقة الثانية: تنفيذ SQL مباشرة
```bash
# تشغيل ملف SQL
psql -h your-host -U your-user -d salamaty_db -f migrate_assigned_to_ids_to_jsonb.sql
```

### الطريقة الثالثة: Railway Console
1. اذهب إلى Railway Dashboard
2. اختر مشروعك
3. اضغط على قاعدة البيانات
4. اضغط على "Console" أو "Query"
5. انسخ والصق محتوى `migrate_assigned_to_ids_to_jsonb.sql`

## خطوات ما قبل الترحيل

### 1. إنشاء نسخة احتياطية
```bash
# نسخة احتياطية كاملة
pg_dump -h your-host -U your-user salamaty_db > backup_$(date +%Y%m%d_%H%M%S).sql

# أو نسخة احتياطية للجدول فقط
pg_dump -h your-host -U your-user -t rounds salamaty_db > rounds_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. التحقق من البيانات الحالية
```sql
-- فحص نوع العمود الحالي
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rounds' AND column_name = 'assigned_to_ids';

-- فحص البيانات غير الصالحة
SELECT COUNT(*) 
FROM rounds 
WHERE assigned_to_ids IS NOT NULL 
  AND assigned_to_ids != ''
  AND NOT (assigned_to_ids ~ '^\s*\[.*\]\s*$');
```

## تنفيذ الترحيل

### باستخدام سكربت Python
```bash
# تشغيل السكربت مع مراقبة النتائج
python3 run_migration.py
```

السكربت سيقوم بـ:
1. ✅ فحص سلامة البيانات
2. 💾 إنشاء نسخة احتياطية
3. 🔧 إصلاح مشاكل البيانات
4. 🚀 تنفيذ الترحيل
5. 🔍 التحقق من النتائج

### تنفيذ يدوي خطوة بخطوة
```sql
-- 1. إنشاء نسخة احتياطية
CREATE TABLE rounds_backup_assigned_to_ids AS 
SELECT id, assigned_to_ids, created_at FROM rounds;

-- 2. إصلاح البيانات
UPDATE rounds SET assigned_to_ids = '[]' WHERE assigned_to_ids IS NULL;
UPDATE rounds SET assigned_to_ids = '[' || assigned_to_ids || ']' 
WHERE assigned_to_ids ~ '^\s*\d+\s*$';

-- 3. تنفيذ الترحيل
BEGIN;
ALTER TABLE rounds ADD COLUMN assigned_to_ids_new JSONB;
UPDATE rounds SET assigned_to_ids_new = assigned_to_ids::jsonb;
ALTER TABLE rounds DROP COLUMN assigned_to_ids;
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_new TO assigned_to_ids;
ALTER TABLE rounds ALTER COLUMN assigned_to_ids SET NOT NULL;
ALTER TABLE rounds ALTER COLUMN assigned_to_ids SET DEFAULT '[]'::jsonb;
CREATE INDEX idx_rounds_assigned_to_ids_gin ON rounds USING GIN (assigned_to_ids);
COMMIT;
```

## التحقق من نجاح الترحيل

### 1. فحص نوع العمود
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rounds' AND column_name = 'assigned_to_ids';
```
**النتيجة المتوقعة:** `data_type = 'jsonb'`

### 2. اختبار العمليات JSONB
```sql
-- اختبار المشغل @>
SELECT COUNT(*) FROM rounds WHERE assigned_to_ids @> '[1]'::jsonb;

-- اختبار دوال JSONB
SELECT jsonb_array_length(assigned_to_ids) FROM rounds LIMIT 5;
```

### 3. اختبار التطبيق
- افتح صفحة "My Rounds" في التطبيق
- تأكد من عدم وجود أخطاء 500
- تحقق من تحميل البيانات بشكل صحيح

## إرجاع التغييرات (Rollback)

في حالة حدوث مشاكل، يمكن إرجاع التغييرات:

```sql
BEGIN;
ALTER TABLE rounds ADD COLUMN assigned_to_ids_old TEXT;
UPDATE rounds SET assigned_to_ids_old = backup.assigned_to_ids
FROM rounds_backup_assigned_to_ids backup
WHERE rounds.id = backup.id;
ALTER TABLE rounds DROP COLUMN assigned_to_ids;
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_old TO assigned_to_ids;
COMMIT;
```

## تنظيف بعد الترحيل

بعد التأكد من نجاح الترحيل:

```sql
-- حذف النسخة الاحتياطية (اختياري)
DROP TABLE IF EXISTS rounds_backup_assigned_to_ids;
```

## المزايا بعد الترحيل

1. **حل مشكلة الخطأ:** لن تظهر رسالة `operator does not exist: text @> jsonb`
2. **تحسين الأداء:** JSONB أسرع في الاستعلامات
3. **دعم أفضل:** دوال JSONB متقدمة
4. **فهرسة محسنة:** GIN index للبحث السريع

## استكشاف الأخطاء

### خطأ: "permission denied"
```sql
-- تأكد من الصلاحيات
GRANT ALL PRIVILEGES ON TABLE rounds TO your_user;
```

### خطأ: "invalid input syntax for type jsonb"
```sql
-- فحص البيانات غير الصالحة
SELECT id, assigned_to_ids FROM rounds 
WHERE NOT (assigned_to_ids ~ '^\s*\[.*\]\s*$');
```

### خطأ: "column already exists"
```sql
-- حذف العمود المؤقت إذا كان موجود
ALTER TABLE rounds DROP COLUMN IF EXISTS assigned_to_ids_new;
```

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجلات قاعدة البيانات
2. راجع النسخة الاحتياطية
3. استخدم سكربت الإرجاع إذا لزم الأمر

---
**تاريخ الإنشاء:** $(date)  
**الإصدار:** 1.0  
**الحالة:** جاهز للاستخدام

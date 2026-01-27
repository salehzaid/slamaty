# 🚀 حل سريع لمشكلة assigned_to_ids

## المشكلة
```
operator does not exist: text @> jsonb
```

## الحل السريع (3 خطوات)

### 1️⃣ فحص الحالة الحالية
```bash
# تحقق من حالة قاعدة البيانات
python3 check_db_status.py
```

### 2️⃣ تنفيذ الترحيل
```bash
# تشغيل الترحيل التلقائي
python3 run_migration.py
```

### 3️⃣ التحقق من النتائج
- افتح صفحة: https://qpsrounds-production.up.railway.app/rounds/my-rounds
- تأكد من عدم وجود أخطاء 500
- تحقق من تحميل البيانات

## متغيرات البيئة المطلوبة
```bash
export DB_HOST="your-railway-db-host"
export DB_PORT="5432"
export DB_NAME="salamaty_db"
export DB_USER="your-username"
export DB_PASSWORD="your-password"
```

## بديل سريع (SQL مباشر)
إذا لم تكن تريد استخدام Python:

```sql
-- انسخ والصق في Railway Console
BEGIN;
ALTER TABLE rounds ADD COLUMN assigned_to_ids_new JSONB;
UPDATE rounds SET assigned_to_ids_new = assigned_to_ids::jsonb;
UPDATE rounds SET assigned_to_ids_new = '[]'::jsonb WHERE assigned_to_ids_new IS NULL;
ALTER TABLE rounds DROP COLUMN assigned_to_ids;
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_new TO assigned_to_ids;
ALTER TABLE rounds ALTER COLUMN assigned_to_ids SET NOT NULL;
ALTER TABLE rounds ALTER COLUMN assigned_to_ids SET DEFAULT '[]'::jsonb;
CREATE INDEX idx_rounds_assigned_to_ids_gin ON rounds USING GIN (assigned_to_ids);
COMMIT;
```

## في حالة المشاكل
```sql
-- إرجاع التغييرات
BEGIN;
ALTER TABLE rounds ADD COLUMN assigned_to_ids_old TEXT;
UPDATE rounds SET assigned_to_ids_old = backup.assigned_to_ids
FROM rounds_backup_assigned_to_ids backup
WHERE rounds.id = backup.id;
ALTER TABLE rounds DROP COLUMN assigned_to_ids;
ALTER TABLE rounds RENAME COLUMN assigned_to_ids_old TO assigned_to_ids;
COMMIT;
```

---
**⏱️ الوقت المتوقع:** 2-5 دقائق  
**🔒 الأمان:** آمن مع نسخة احتياطية تلقائية  
**📈 النتيجة:** حل نهائي للمشكلة + تحسين الأداء

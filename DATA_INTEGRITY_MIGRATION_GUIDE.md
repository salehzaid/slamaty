# دليل ترحيل سلامة البيانات - Data Integrity Migration Guide

## نظرة عامة / Overview

هذا الدليل يوضح خطوات ترحيل قاعدة البيانات من استخدام `TEXT` إلى `JSONB` للحقول التالية في جدول `rounds`:
- `selected_categories`
- `evaluation_items`
- `assigned_to_ids`

الهدف هو ضمان:
1. تخزين البيانات بشكل صحيح ودقيق
2. التحقق التلقائي من صحة البيانات
3. أداء أفضل للاستعلامات
4. دعم العمليات المتقدمة على JSON

---

## 📋 الخطوات المطلوبة / Required Steps

### الخطوة 1: النسخ الاحتياطي / Backup

**⚠️ مهم جداً: قم بإنشاء نسخة احتياطية قبل تنفيذ أي migration**

```bash
# إنشاء نسخة احتياطية من قاعدة البيانات
pg_dump -U postgres -d salamaty_db > salamaty_db_backup_$(date +%Y%m%d_%H%M%S).dump

# أو استخدام خيارات أكثر تفصيلاً
pg_dump -U postgres -d salamaty_db --format=custom --file=salamaty_db_backup_$(date +%Y%m%d_%H%M%S).backup

# التحقق من حجم النسخة الاحتياطية
ls -lh salamaty_db_backup_*.dump
```

### الخطوة 2: التحقق من البيانات الحالية / Verify Current Data

قبل التنفيذ، تحقق من البيانات الموجودة:

```sql
-- الاتصال بقاعدة البيانات
psql -U postgres -d salamaty_db

-- التحقق من عدد الجولات
SELECT COUNT(*) as total_rounds FROM rounds;

-- التحقق من الجولات التي تحتوي على بيانات
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE selected_categories IS NOT NULL AND selected_categories != '[]') as with_categories,
    COUNT(*) FILTER (WHERE evaluation_items IS NOT NULL AND evaluation_items != '[]') as with_items,
    COUNT(*) FILTER (WHERE assigned_to_ids IS NOT NULL AND assigned_to_ids != '[]') as with_assigned
FROM rounds;

-- عرض عينة من البيانات
SELECT id, round_code, selected_categories, evaluation_items, assigned_to_ids 
FROM rounds 
LIMIT 5;
```

### الخطوة 3: تنفيذ Migration / Execute Migration

```bash
# تنفيذ migration من ملف SQL
psql -U postgres -d salamaty_db -f backend/migrations/001_convert_to_jsonb.sql

# أو تنفيذ من داخل psql
psql -U postgres -d salamaty_db
\i backend/migrations/001_convert_to_jsonb.sql
```

**ملاحظات:**
- سيعرض السكريبت ملخص التنفيذ في النهاية
- سيتم إنشاء جدول مؤقت `migration_log` يحتوي على سجل التغييرات
- سيتم إضافة indexes للأداء الأفضل

### الخطوة 4: التحقق من نجاح Migration / Verify Migration Success

```sql
-- التحقق من نوع البيانات للحقول
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'rounds' 
AND column_name IN ('selected_categories', 'evaluation_items', 'assigned_to_ids');

-- يجب أن يكون data_type = 'jsonb'

-- التحقق من البيانات المهاجرة
SELECT 
    COUNT(*) as total_rounds,
    COUNT(*) FILTER (WHERE selected_categories != '[]'::jsonb) as with_categories,
    COUNT(*) FILTER (WHERE evaluation_items != '[]'::jsonb) as with_items,
    COUNT(*) FILTER (WHERE assigned_to_ids != '[]'::jsonb) as with_assigned
FROM rounds;

-- عرض عينة من البيانات
SELECT id, round_code, 
    jsonb_array_length(selected_categories) as cat_count,
    jsonb_array_length(evaluation_items) as item_count,
    selected_categories, 
    evaluation_items
FROM rounds 
WHERE selected_categories != '[]'::jsonb OR evaluation_items != '[]'::jsonb
LIMIT 5;

-- التحقق من وجود indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'rounds' 
AND indexname LIKE '%categories%' OR indexname LIKE '%items%' OR indexname LIKE '%assigned%';
```

### الخطوة 5: إعادة تشغيل Backend / Restart Backend

بعد تنفيذ migration بنجاح، أعد تشغيل backend:

```bash
# إيقاف backend الحالي
# ctrl+C أو
pkill -f "uvicorn backend.main"

# تشغيل backend مع التحديثات الجديدة
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds
python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### الخطوة 6: اختبار API / Test API

```bash
# الحصول على token للاختبار
TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salamaty.com","password":"123456"}' | jq -r '.access_token')

# اختبار إنشاء جولة جديدة مع البيانات
curl -X POST "http://localhost:8000/api/rounds" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "اختبار سلامة البيانات",
    "round_type": "patient_safety",
    "department": "الطوارئ",
    "scheduled_date": "2025-10-15T10:00:00Z",
    "selected_categories": [1, 2, 3],
    "evaluation_items": [1, 2, 3, 4],
    "assigned_to": [1]
  }' | jq .

# اختبار جلب الجولة والتحقق من البيانات
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/rounds" | jq '.[] | {id, title, selected_categories, evaluation_items}'

# اختبار تقارير الجولات حسب النوع
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/reports/rounds-by-type" | jq .
```

---

## 🔄 التراجع عن Migration / Rollback

إذا واجهت مشاكل، يمكنك التراجع عن التغييرات:

### الخيار 1: استخدام Rollback Script

```bash
psql -U postgres -d salamaty_db -f backend/migrations/001_rollback.sql
```

### الخيار 2: استعادة من النسخة الاحتياطية

```bash
# إيقاف جميع الاتصالات بقاعدة البيانات
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'salamaty_db' AND pid <> pg_backend_pid();"

# حذف قاعدة البيانات الحالية
dropdb -U postgres salamaty_db

# إنشاء قاعدة بيانات جديدة
createdb -U postgres salamaty_db

# استعادة من النسخة الاحتياطية
pg_restore -U postgres -d salamaty_db salamaty_db_backup_20251011_120000.backup
# أو
psql -U postgres -d salamaty_db < salamaty_db_backup_20251011_120000.dump

# إعادة تشغيل backend
```

---

## 🧪 اختبارات التحقق / Validation Tests

### اختبار 1: التحقق من حفظ البيانات

```python
# يمكن تشغيل هذا السكريبت للتحقق
import requests
import json

BASE_URL = "http://localhost:8000"

# تسجيل الدخول
login_response = requests.post(f"{BASE_URL}/api/auth/signin", json={
    "email": "admin@salamaty.com",
    "password": "123456"
})
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# إنشاء جولة اختبار
round_data = {
    "title": "اختبار البيانات",
    "round_type": "patient_safety",
    "department": "الطوارئ",
    "scheduled_date": "2025-10-15T10:00:00Z",
    "selected_categories": [1, 2],
    "evaluation_items": [1, 2, 3],
    "assigned_to": [1]
}

create_response = requests.post(f"{BASE_URL}/api/rounds", headers=headers, json=round_data)
print("Create Response:", json.dumps(create_response.json(), indent=2, ensure_ascii=False))

# جلب الجولة والتحقق
rounds_response = requests.get(f"{BASE_URL}/api/rounds", headers=headers)
rounds = rounds_response.json()
print(f"Total Rounds: {len(rounds)}")
for round in rounds[:3]:
    print(f"Round {round['id']}: categories={round.get('selected_categories')}, items={round.get('evaluation_items')}")
```

### اختبار 2: التحقق من تقارير الجولات

```sql
-- استعلام SQL للتحقق من دقة التقارير
SELECT 
    round_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE selected_categories != '[]'::jsonb) as with_categories,
    COUNT(*) FILTER (WHERE evaluation_items != '[]'::jsonb) as with_items
FROM rounds
GROUP BY round_type
ORDER BY count DESC;
```

---

## 📊 مراقبة الأداء / Performance Monitoring

بعد Migration، راقب:

1. **سرعة الاستعلامات:**
```sql
-- تفعيل تتبع الاستعلامات
\timing on

-- اختبار سرعة الاستعلامات
SELECT * FROM rounds WHERE selected_categories @> '[1]'::jsonb;
SELECT * FROM rounds WHERE evaluation_items @> '[2]'::jsonb;
```

2. **حجم قاعدة البيانات:**
```sql
SELECT 
    pg_size_pretty(pg_database_size('salamaty_db')) as db_size,
    pg_size_pretty(pg_total_relation_size('rounds')) as rounds_table_size;
```

3. **استخدام Indexes:**
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'rounds'
ORDER BY idx_scan DESC;
```

---

## ✅ قائمة التحقق النهائية / Final Checklist

قبل إطلاق النظام في البيئة الإنتاجية:

- [ ] تم إنشاء نسخة احتياطية من قاعدة البيانات
- [ ] تم تنفيذ migration بنجاح
- [ ] تم التحقق من نوع البيانات (JSONB)
- [ ] تم التحقق من البيانات المهاجرة (لا توجد بيانات مفقودة)
- [ ] تم التحقق من وجود Indexes
- [ ] تم إعادة تشغيل Backend
- [ ] تم اختبار إنشاء جولة جديدة عبر API
- [ ] تم اختبار تحديث جولة موجودة
- [ ] تم اختبار تقرير "توزيع الجولات حسب النوع"
- [ ] تم التحقق من عرض البيانات في الواجهة الأمامية
- [ ] تم التحقق من أداء الاستعلامات

---

## 🆘 الدعم / Support

في حالة مواجهة مشاكل:

1. **تحقق من logs:**
```bash
# Backend logs
tail -f backend/server.log

# PostgreSQL logs
sudo tail -f /usr/local/var/log/postgresql/*.log
```

2. **تحقق من اتصال قاعدة البيانات:**
```bash
psql -U postgres -d salamaty_db -c "SELECT version();"
```

3. **راجع migration log:**
```sql
-- عرض سجل التغييرات (إذا كان لا يزال موجوداً)
SELECT * FROM migration_log LIMIT 10;
```

---

## 📝 ملاحظات إضافية / Additional Notes

### الفوائد الرئيسية للـ JSONB:

1. **التحقق التلقائي:** PostgreSQL يتحقق من صحة JSON تلقائياً
2. **الأداء:** Indexes من نوع GIN تسرع الاستعلامات
3. **العمليات المتقدمة:** دعم operators مثل `@>`, `?`, `||`
4. **التخزين الفعال:** JSONB يخزن البيانات بشكل ثنائي (أصغر حجماً)

### أمثلة استعلامات JSONB مفيدة:

```sql
-- البحث عن جولات تحتوي على فئة معينة
SELECT * FROM rounds WHERE selected_categories @> '[1]'::jsonb;

-- البحث عن جولات تحتوي على أي من الفئات
SELECT * FROM rounds WHERE selected_categories ?| array['1', '2'];

-- عد عدد الفئات في كل جولة
SELECT id, round_code, jsonb_array_length(selected_categories) as category_count
FROM rounds
WHERE selected_categories != '[]'::jsonb;

-- استخراج عنصر معين من المصفوفة
SELECT id, selected_categories->0 as first_category
FROM rounds
WHERE jsonb_array_length(selected_categories) > 0;
```

---

**تاريخ إنشاء الوثيقة:** 2025-10-11  
**الإصدار:** 1.0  
**آخر تحديث:** 2025-10-11


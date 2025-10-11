# 🐛 تصحيح خطأ 500 عند إنشاء الجولة

## الحالة الحالية

### المشكلة
- خطأ 500 يحدث عند محاولة إنشاء جولة جديدة على الإنتاج
- `POST /api/rounds` يُرجع `Internal Server Error`
- الخطأ لا يحدث محلياً (tested successfully locally)

### ما تم تنفيذه حتى الآن

#### 1. إصلاحات سابقة (Commits: d3dab0c, 60f2dd2)
- ✅ إصلاح معالجة `assigned_to_ids` في `crud.py`
- ✅ إصلاح معالجة `selected_categories` في `crud.py`
- ✅ تحديث قاعدة البيانات (NULL → `[]` للحقول JSON)
- ✅ إضافة قيم افتراضية في النموذج والجدول

#### 2. إصلاح جديد (Commit: 3f49159)
- ✅ إضافة `try/except` حول `create_round()`  في `main.py`
- ✅ طباعة stack trace كامل في logs
- ✅ إرجاع رسالة خطأ مفصلة للـ client

---

## خطوات التشخيص التالية

### للمستخدم:

بعد إعادة نشر Railway (انتظر 2-3 دقائق):

#### الطريقة 1: من المتصفح
1. افتح https://qpsrounds-production.up.railway.app/rounds/new
2. املأ نموذج إنشاء جولة جديدة
3. اضغط "حفظ"
4. إذا ظهر خطأ 500:
   - افتح DevTools (F12) → Network
   - افتح طلب `POST /api/rounds`
   - اذهب إلى تبويب **Response**
   - **انسخ النص الكامل** وأرسله

#### الطريقة 2: من Railway Logs
1. افتح https://railway.app/
2. اذهب إلى مشروع `qpsrounds-production`
3. اضغط على Service → Backend
4. افتح تبويب **Logs**
5. ابحث عن:
   ```
   ❌ Error creating round:
   Stack trace:
   ```
6. **انسخ الستاك تراس الكامل** (10-20 سطر تحت هذا)

#### الطريقة 3: من Terminal (curl)
```bash
# 1. احصل على التوكن
TOKEN=$(curl -s -X POST "https://qpsrounds-production.up.railway.app/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@salamaty.com","password":"123456"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 2. جرب إنشاء جولة
curl -s -X POST "https://qpsrounds-production.up.railway.app/api/rounds" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title":"Test",
    "description":"test",
    "round_type":"general",
    "department":"IT",
    "assigned_to":[1],
    "selected_categories":[1],
    "scheduled_date":"2025-10-10T10:00:00Z",
    "priority":"medium",
    "evaluation_items":[1,2,3]
  }' | python3 -m json.tool

# انسخ المخرجات
```

---

## أسباب محتملة للخطأ

### 1. مشاكل serialization/deserialization
- `round_type` enum قد يكون بصيغة خاطئة
- `scheduled_date` قد لا يُحلَّل بشكل صحيح
- `assigned_to` قد يحتوي على قيم غير متوقعة

### 2. مشاكل قاعدة البيانات
- Connection timeout
- قيود (constraints) غير متوقعة
- Foreign key violations

### 3. مشاكل البيئة
- متغيرات بيئة مفقودة في Railway
- إصدار Python/dependencies مختلف
- النسخة القديمة من الكود لا تزال تعمل

### 4. مشاكل النموذج/Schema
- Pydantic validation تفشل
- حقول مطلوبة مفقودة
- نوع بيانات غير متوافق

---

## الاختبارات المحلية الناجحة

تم اختبار إنشاء جولة محلياً بنجاح:

```bash
# Test local
curl -X POST http://localhost:8000/api/rounds \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Round from CLI",
    "description":"Created by test",
    "round_type":"general",
    "department":"IT",
    "assigned_to":[1],
    "selected_categories":[1],
    "scheduled_date":"2025-10-09T10:00:00Z",
    "priority":"medium",
    "evaluation_items":[1,2,3]
  }'

# Response: 200 OK ✅
```

---

## Git Commits

```
3f49159 🐛 إضافة error handling مفصل لـ POST /api/rounds
60f2dd2 🐛 إصلاح خطأ 500 - حقول JSON الفارغة
d3dab0c 🐛 إصلاح خطأ 500 عند إنشاء الجولة
```

---

## الحالة

- ✅ الكود محدَّث ومرفوع إلى GitHub
- ⏳ في انتظار Railway redeploy (2-3 دقائق)
- ⏳ في انتظار رسالة الخطأ المفصلة من المستخدم
- 🎯 الهدف: الحصول على stack trace كامل لتحديد السبب الدقيق

---

**تاريخ التحديث**: 2025-10-09  
**الحالة**: في انتظار تشخيص إضافي


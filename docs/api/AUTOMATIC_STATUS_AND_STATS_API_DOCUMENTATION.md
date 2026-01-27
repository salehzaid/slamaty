# توثيق نظام الحالة التلقائي وواجهات API للإحصائيات

## نظرة عامة
تم تطوير نظام تلقائي لإدارة حالات الجولات وحساب إحصائيات دقيقة للمستخدمين. يعمل النظام على تحديث حالة كل جولة تلقائياً بناءً على التواريخ ونسبة الإنجاز، مما يضمن انعكاس البيانات الحقيقية في لوحة التحكم.

---

## 1. قواعد حساب حالة الجولة التلقائي

### الوظيفة الأساسية
**الموقع:** `backend/utils/status_calculator.py`  
**الوظيفة:** `calculate_round_status()`

### القواعد بالترتيب (من الأعلى للأسفل أولوية)

#### القاعدة 1: مكتملة (COMPLETED)
```python
if completion_percentage >= 100:
    return RoundStatus.COMPLETED.value
```
- **الشرط:** نسبة الإنجاز = 100%
- **النتيجة:** `completed`
- **ملاحظات:** هذه الحالة لها الأولوية القصوى ولا تتأثر بالتواريخ

#### القاعدة 2: مجدولة - لم تبدأ (SCHEDULED)
```python
if scheduled_date > now:
    return RoundStatus.SCHEDULED.value
```
- **الشرط:** تاريخ البدء المجدول في المستقبل
- **النتيجة:** `scheduled`
- **ملاحظات:** الجولة لم تبدأ بعد

#### القاعدة 3: متأخرة (OVERDUE)
```python
effective_deadline = deadline or end_date
if effective_deadline and effective_deadline < now:
    return RoundStatus.OVERDUE.value
```
- **الشرط:** تجاوز الموعد النهائي (deadline) أو تاريخ الانتهاء (end_date)
- **النتيجة:** `overdue`
- **ملاحظات:** 
  - يُفضَّل `deadline` على `end_date` إذا كانا موجودين معاً
  - يتم التحقق من التأخر فقط إذا كانت نسبة الإنجاز < 100%

#### القاعدة 4: قيد التنفيذ (IN_PROGRESS)
```python
if scheduled_date <= now:
    if current_status == RoundStatus.IN_PROGRESS.value or completion_percentage > 0:
        return RoundStatus.IN_PROGRESS.value
```
- **الشرط:** 
  - الجولة بدأت (`scheduled_date <= now`)
  - و (الحالة الحالية = `in_progress` **أو** نسبة الإنجاز > 0%)
- **النتيجة:** `in_progress`
- **ملاحظات:** يتم الاحتفاظ بالحالة `in_progress` حتى لو لم يكن هناك تقدم بعد

#### القاعدة الافتراضية
```python
return RoundStatus.SCHEDULED.value
```
- إذا لم تنطبق أي من القواعد السابقة، يتم إرجاع `scheduled`

---

## 2. التكامل مع قاعدة البيانات

### تحديث تلقائي عند الاستعلام
**الموقع:** `backend/crud.py` - دالة `get_rounds_by_user()`

```python
from utils.status_calculator import calculate_round_status

for round in user_rounds:
    calculated_status = calculate_round_status(
        round.scheduled_date, 
        round.deadline, 
        round.end_date,
        round.completion_percentage or 0, 
        round.status
    )
    if round.status != calculated_status:
        old_status = round.status
        round.status = calculated_status
        updated_count += 1

if updated_count > 0:
    db.commit()
```

**الآلية:**
1. عند استدعاء `get_rounds_by_user()` لعرض جولات المستخدم
2. يتم حساب الحالة التلقائية لكل جولة
3. إذا تغيرت الحالة، يتم تحديثها في قاعدة البيانات
4. يتم حفظ التغييرات تلقائياً (`commit`)

**الفوائد:**
- ✅ لا حاجة لجدولة مهام (cron jobs)
- ✅ البيانات دائماً محدثة عند عرضها
- ✅ أداء عالي (التحديث يتم فقط للجولات المعروضة)

---

## 3. واجهة API للإحصائيات الشاملة

### نقطة النهاية (Endpoint)
```
GET /api/rounds/my/stats
```

### المصادقة
- **مطلوب:** Bearer Token
- **الصلاحيات:** أي مستخدم مسجل دخوله

### الاستجابة (Response)
```json
{
  "total": 15,
  "completed": 3,
  "in_progress": 8,
  "overdue": 2,
  "scheduled": 2,
  "avg_completion": 65,
  "avg_compliance": 87,
  "high_priority": 5
}
```

### الحقول

| الحقل | النوع | الوصف |
|------|------|-------|
| `total` | `int` | إجمالي عدد الجولات المكلف بها المستخدم |
| `completed` | `int` | عدد الجولات المكتملة (`status = 'completed'`) |
| `in_progress` | `int` | عدد الجولات قيد التنفيذ (`status = 'in_progress'`) |
| `overdue` | `int` | عدد الجولات المتأخرة (`status = 'overdue'`) |
| `scheduled` | `int` | عدد الجولات المجدولة (`status = 'scheduled'`) |
| `avg_completion` | `int` | متوسط نسبة الإنجاز لكل الجولات (0-100) |
| `avg_compliance` | `int` | متوسط نسبة الامتثال للجولات المكتملة فقط (0-100) |
| `high_priority` | `int` | عدد الجولات ذات الأولوية العالية/العاجلة |

### منطق الحساب

#### إجمالي الجولات
```python
total = len(rounds)
```

#### الحالات
```python
completed = [r for r in rounds if r.status == 'completed']
in_progress = [r for r in rounds if r.status == 'in_progress']
overdue = [r for r in rounds if r.status == 'overdue']
scheduled = [r for r in rounds if r.status == 'scheduled']
```

#### متوسط الإنجاز
```python
avg_completion = round(sum(r.completion_percentage or 0 for r in rounds) / len(rounds)) if rounds else 0
```
- يتم حساب المتوسط لجميع الجولات (مكتملة + جارية + متأخرة)
- القيم الفارغة (`None`) تُعامل كـ `0`

#### متوسط الامتثال
```python
completed_with_compliance = [r for r in completed if r.compliance_percentage is not None]
avg_compliance = round(sum(r.compliance_percentage for r in completed_with_compliance) / len(completed_with_compliance)) if completed_with_compliance else 0
```
- يتم حساب المتوسط **فقط للجولات المكتملة** التي لديها قيمة امتثال
- إذا لم توجد جولات مكتملة بامتثال، يُرجع `0`

#### الأولوية العالية
```python
high_priority = [r for r in rounds if r.priority in ['urgent', 'high']]
```

---

## 4. واجهة API للجولات المكلف بها المستخدم

### نقطة النهاية
```
GET /api/rounds/my?skip=0&limit=100
```

### المصادقة
- **مطلوب:** Bearer Token

### المعاملات (Query Parameters)

| المعامل | النوع | افتراضي | الوصف |
|---------|------|---------|-------|
| `skip` | `int` | `0` | عدد السجلات المراد تخطيها (للترقيم) |
| `limit` | `int` | `100` | الحد الأقصى لعدد السجلات المُرجعة |

### الاستجابة
```json
[
  {
    "id": 1,
    "round_code": "RND-2025-001",
    "title": "جولة فحص السلامة الصحية",
    "status": "in_progress",
    "completion_percentage": 65,
    "compliance_percentage": null,
    "priority": "high",
    "scheduled_date": "2025-10-01T08:00:00Z",
    "deadline": "2025-10-15T17:00:00Z",
    "end_date": null,
    "department": "الجودة الصحية",
    "assigned_to_ids": [1, 5, 12],
    "selected_categories": [1, 3, 5],
    "evaluation_items": [10, 11, 12, 13]
  }
]
```

### ملاحظات مهمة
- يتم تحديث `status` تلقائياً عند الاستعلام (كما شُرح في القسم 2)
- يتم الفلترة بناءً على `assigned_to_ids` باستخدام PostgreSQL JSONB operator:
  ```python
  text(f"assigned_to_ids @> '[{user_id}]'::jsonb")
  ```

---

## 5. عرض البيانات في الواجهة الأمامية

### صفحة "جولاتي" (My Rounds)
**الموقع:** `src/components/pages/MyRoundsPage.tsx`

### البطاقات الإحصائية

تعرض 8 بطاقات إحصائية ملونة:

#### 1. إجمالي الجولات (Total)
- **اللون:** بنفسجي (`purple-500` إلى `purple-600`)
- **الأيقونة:** `ListTodo`
- **البيانات:** `stats.total`

#### 2. مكتملة (Completed)
- **اللون:** أخضر (`green-500` إلى `green-600`)
- **الأيقونة:** `CheckCircle`
- **البيانات:** `stats.completed`

#### 3. قيد التنفيذ (In Progress)
- **اللون:** أزرق (`blue-500` إلى `blue-600`)
- **الأيقونة:** `Clock`
- **البيانات:** `stats.in_progress`

#### 4. متأخرة (Overdue)
- **اللون:** أحمر (`red-500` إلى `red-600`)
- **الأيقونة:** `AlertCircle`
- **البيانات:** `stats.overdue`

#### 5. مجدولة (Scheduled)
- **اللون:** نيلي (`indigo-500` إلى `indigo-600`)
- **الأيقونة:** `Calendar`
- **البيانات:** `stats.scheduled`

#### 6. متوسط الإنجاز (Average Completion)
- **اللون:** سماوي (`cyan-500` إلى `cyan-600`)
- **الأيقونة:** `TrendingUp`
- **البيانات:** `stats.avg_completion%`
- **عرض إضافي:** شريط تقدم (`Progress`)

#### 7. أولوية عالية (High Priority)
- **اللون:** برتقالي (`orange-500` إلى `orange-600`)
- **الأيقونة:** `AlertTriangle`
- **البيانات:** `stats.high_priority`

#### 8. متوسط الامتثال (Average Compliance)
- **اللون:** تركوازي (`teal-500` إلى `teal-600`)
- **الأيقونة:** `Target`
- **البيانات:** `stats.avg_compliance%`
- **عرض إضافي:** شريط تقدم (`Progress`)

### مؤشرات الوقت (Time Badges)

تُعرض على كل بطاقة جولة:

#### الوقت المتبقي (Days Remaining)
```tsx
{status === 'in_progress' && daysRemaining !== null && daysRemaining > 0 && (
  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
    <Clock className="w-3 h-3 ml-1" />
    متبقي {daysRemaining} {daysRemaining === 1 ? 'يوم' : 'أيام'}
  </Badge>
)}
```
- **اللون:** أزرق (`blue-50/700/200`)
- **الشرط:** الحالة = `in_progress` والأيام المتبقية > 0

#### متأخر (Days Overdue)
```tsx
{status === 'overdue' && daysOverdue !== null && daysOverdue > 0 && (
  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
    <AlertCircle className="w-3 h-3 ml-1" />
    متأخر {daysOverdue} {daysOverdue === 1 ? 'يوم' : 'أيام'}
  </Badge>
)}
```
- **اللون:** أحمر (`red-50/700/200`)
- **الشرط:** الحالة = `overdue` والأيام المتأخرة > 0

### دوال الحساب

```typescript
const getDaysRemaining = (deadline: string | null, endDate: string | null): number | null => {
  const targetDate = deadline || endDate;
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const getDaysOverdue = (deadline: string | null, endDate: string | null): number | null => {
  const targetDate = deadline || endDate;
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = now.getTime() - target.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
```

---

## 6. الاختبارات (Tests)

### اختبارات الوحدة (Unit Tests)
**الموقع:** `backend/tests/test_status_calculator.py`

تغطي 10 سيناريوهات:
1. ✅ جولة مكتملة بنسبة 100%
2. ✅ جولة مجدولة في المستقبل
3. ✅ جولة متأخرة بسبب `deadline`
4. ✅ جولة متأخرة بسبب `end_date`
5. ✅ جولة قيد التنفيذ مع تقدم
6. ✅ جولة قيد التنفيذ بدون تقدم (حالة سابقة)
7. ✅ جولة بدأت بدون تقدم (ليست `in_progress` بعد)
8. ✅ جولة مكتملة تتجاوز حالة المتأخر
9. ✅ `deadline` له أولوية على `end_date`
10. ✅ جولة بدون مواعيد نهائية لا تكون متأخرة

### اختبارات التكامل (Integration Tests)
**الموقع:** 
- `backend/tests/test_capa_unit.py`
- `backend/tests/test_capa_integration.py`

**الأوامر:**
```bash
# تشغيل جميع الاختبارات
PYTHONPATH=$(pwd)/backend pytest backend/tests/ -v

# تشغيل اختبارات الحالة فقط
PYTHONPATH=$(pwd)/backend pytest backend/tests/test_status_calculator.py -v

# تشغيل اختبارات CAPA
PYTHONPATH=$(pwd)/backend pytest backend/tests/test_capa_unit.py backend/tests/test_capa_integration.py -v
```

---

## 7. أفضل الممارسات والتوصيات

### للمطورين

1. **عدم التعديل اليدوي للحالات:**
   - لا تقم بتعديل `status` يدوياً في الكود
   - دع `calculate_round_status()` تقوم بالعمل تلقائياً

2. **استخدام التواريخ بشكل صحيح:**
   - استخدم `timezone.utc` دائماً للمقارنات
   - احفظ التواريخ بصيغة ISO 8601

3. **الاختبار:**
   - أضف اختبارات جديدة عند تغيير المنطق
   - تأكد من تشغيل جميع الاختبارات قبل الدمج

### للمستخدمين

1. **تحديث نسبة الإنجاز:**
   - تأكد من تحديث نسبة الإنجاز عند إكمال عناصر التقييم
   - يتم حساب الحالة تلقائياً بناءً على النسبة

2. **تحديد المواعيد النهائية:**
   - استخدم `deadline` للمهام الصارمة
   - استخدم `end_date` للتواريخ المرنة

3. **متابعة الإحصائيات:**
   - راجع صفحة "جولاتي" بانتظام لمتابعة التقدم
   - انتبه لمؤشرات الأيام المتبقية والمتأخرة

---

## 8. استكشاف الأخطاء (Troubleshooting)

### المشكلة: الحالة لا تتحدث تلقائياً

**الأسباب المحتملة:**
1. لم يتم استدعاء `get_rounds_by_user()` مؤخراً
2. خطأ في التواريخ (مثل تواريخ بدون timezone)
3. قيمة `completion_percentage` غير صحيحة

**الحل:**
```python
# تحقق من التواريخ
print(round.scheduled_date, round.deadline, round.end_date)

# تحقق من نسبة الإنجاز
print(round.completion_percentage)

# تحقق من الحالة المحسوبة
from utils.status_calculator import calculate_round_status
calculated = calculate_round_status(
    round.scheduled_date, round.deadline, round.end_date, 
    round.completion_percentage or 0, round.status
)
print(f"Current: {round.status}, Calculated: {calculated}")
```

### المشكلة: الإحصائيات غير دقيقة

**الأسباب المحتملة:**
1. بيانات JSONB في `assigned_to_ids` غير صحيحة
2. الحالات لم تُحدَّث بعد

**الحل:**
```sql
-- تحقق من assigned_to_ids
SELECT id, title, assigned_to_ids FROM rounds WHERE assigned_to_ids @> '[1]'::jsonb;

-- تحقق من الحالات
SELECT status, COUNT(*) FROM rounds GROUP BY status;
```

### المشكلة: اختبارات فاشلة

**الحل:**
```bash
# تأكد من تثبيت جميع المكتبات
pip install pytest sqlalchemy psycopg2-binary python-dotenv pydantic email-validator

# تشغيل مع PYTHONPATH صحيح
PYTHONPATH=$(pwd)/backend pytest backend/tests/ -v --tb=short
```

---

## 9. التحديثات المستقبلية المقترحة

### المرحلة القادمة
- [ ] إضافة إشعارات عند تغيير الحالة
- [ ] لوحة تحكم تفاعلية للإحصائيات (charts)
- [ ] تصدير تقرير PDF بالإحصائيات
- [ ] إضافة حالة `paused` (متوقفة مؤقتاً)

### التحسينات
- [ ] ذاكرة تخزين مؤقت (cache) للإحصائيات
- [ ] WebSocket لتحديثات فورية
- [ ] تقارير مجدولة يومية/أسبوعية

---

## 10. الملخص

✅ **تم التنفيذ:**
- نظام حساب حالة تلقائي كامل
- 10 قواعد مختبرة لحساب الحالة
- واجهة API شاملة للإحصائيات
- 8 بطاقات إحصائية ملونة في الواجهة
- مؤشرات وقت ديناميكية
- 12 اختبار شامل (10 وحدة + 2 تكامل)

✅ **الفوائد:**
- بيانات دقيقة ومحدثة دائماً
- لا حاجة لمهام مجدولة
- أداء عالي
- سهولة الصيانة
- توثيق كامل

---

**تاريخ التوثيق:** 2025-10-11  
**الإصدار:** 1.0  
**المطور:** نظام سلامتي - Salamaty Quality Management System


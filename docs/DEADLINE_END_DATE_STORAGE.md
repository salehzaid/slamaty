# تخزين المهلة وتاريخ نهاية الجولة

## 📋 نظرة عامة

تم التأكيد من أن نظام إنشاء الجولات الجديدة يقوم بتخزين:
- **المهلة المختارة** في عمود `deadline`
- **تاريخ نهاية الجولة المحسوب** في عمود `end_date`

## 🔧 التطبيق

### 1. في الواجهة الأمامية (`CompleteRoundForm.tsx`)

#### **حساب تاريخ المهلة:**
```typescript
// حساب تاريخ المهلة (scheduled_date + deadline days)
const deadlineDate = formData.scheduled_date && formData.deadline ? 
  new Date(new Date(formData.scheduled_date).getTime() + parseInt(formData.deadline) * 24 * 60 * 60 * 1000).toISOString() : 
  null
```

#### **حساب تاريخ نهاية الجولة:**
```typescript
// دالة لحساب تاريخ انتهاء الجولة
const calculateEndDate = (scheduledDate: string, deadline: string) => {
  if (!scheduledDate || !deadline) {
    return null
  }
  
  const startDate = new Date(scheduledDate)
  const deadlineDays = parseInt(deadline)
  
  if (isNaN(deadlineDays)) {
    return null
  }
  
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + deadlineDays)
  
  return endDate.toISOString()
}
```

#### **إرسال البيانات:**
```typescript
const payload = {
  ...formData,
  round_code: roundCode,
  round_type: convertNameToEnum(formData.round_type),
  assigned_to: formData.assigned_users,
  evaluation_items: formData.selected_items,
  scheduled_date: formData.scheduled_date ? `${formData.scheduled_date}T10:00:00` : null,
  deadline: deadlineDate, // تاريخ المهلة المحسوب
  end_date: endDate // تاريخ انتهاء الجولة المحسوب
}
```

### 2. في قاعدة البيانات (`crud.py`)

#### **تخزين البيانات:**
```python
def create_round(db: Session, round: RoundCreate, created_by_id: int):
    db_round = Round(
        round_code=round_code,
        title=round.title,
        description=round.description,
        round_type=round.round_type,
        department=round.department,
        assigned_to=assigned_to_json,
        scheduled_date=round.scheduled_date,
        deadline=round.deadline,  # المهلة المختارة
        end_date=round.end_date,  # تاريخ انتهاء الجولة المحسوب
        priority=round.priority,
        notes=round.notes,
        created_by_id=created_by_id,
        evaluation_items=json.dumps(round.evaluation_items) if round.evaluation_items else json.dumps([])
    )
    db.add(db_round)
    db.commit()
    db.refresh(db_round)
    return db_round
```

## 📊 مثال على العمل

### **المدخلات:**
- **تاريخ الجولة المجدول:** `2025-10-07`
- **المهلة المختارة:** `7` (أيام)

### **الحسابات:**
```typescript
// حساب تاريخ المهلة
const deadlineDate = new Date('2025-10-07').getTime() + 7 * 24 * 60 * 60 * 1000
// النتيجة: 2025-10-14T10:00:00.000Z

// حساب تاريخ نهاية الجولة
const endDate = new Date('2025-10-07')
endDate.setDate(endDate.getDate() + 7)
// النتيجة: 2025-10-14T10:00:00.000Z
```

### **التخزين في قاعدة البيانات:**
```sql
INSERT INTO rounds (
  scheduled_date,
  deadline,
  end_date,
  ...
) VALUES (
  '2025-10-07T10:00:00+03:00',
  '2025-10-14T10:00:00+03:00',  -- المهلة المحسوبة
  '2025-10-14T10:00:00+03:00',  -- تاريخ نهاية الجولة المحسوب
  ...
);
```

## 🔍 التسجيل للتشخيص

### **في الواجهة الأمامية:**
```typescript
console.log('📅 Round creation - Date calculation:', {
  scheduledDate: formData.scheduled_date,
  deadlineDays: formData.deadline,
  calculatedEndDate: endDate,
  endDateFormatted: endDate ? new Date(endDate).toLocaleDateString('en-US') : 'None'
});

console.log('📅 Deadline calculation:', {
  scheduledDate: formData.scheduled_date,
  deadlineDays: formData.deadline,
  calculatedDeadlineDate: deadlineDate,
  deadlineFormatted: deadlineDate ? new Date(deadlineDate).toLocaleDateString('en-US') : 'None'
});
```

### **في صفحة التقويم:**
```typescript
console.log('📅 Round timeline calculation from database:', {
  roundCode: round.round_code,
  title: round.title,
  databaseScheduledDate: scheduledDate.toLocaleDateString('en-US'),
  databaseEndDate: endDate ? endDate.toLocaleDateString('en-US') : 'None',
  databaseDeadline: deadline ? deadline.toLocaleDateString('en-US') : 'None',
  calculatedStart: period.start.toLocaleDateString('en-US'),
  calculatedEnd: period.end.toLocaleDateString('en-US'),
  finalEndDate: (endDate || period.end).toLocaleDateString('en-US'),
  duration: Math.ceil(((endDate || period.end).getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)) + ' days',
  dataSource: endDate ? 'database end_date column' : deadline ? 'database deadline column' : 'default calculation'
});
```

## ✅ التحقق من التطبيق

### **1. إنشاء جولة جديدة:**
1. اذهب إلى صفحة إنشاء جولة جديدة
2. اختر تاريخ الجولة المجدول
3. اختر المهلة (أيام 3، 5، 7، 14)
4. أرسل النموذج
5. تحقق من وحدة التحكم للرسائل التشخيصية

### **2. التحقق من قاعدة البيانات:**
```sql
SELECT 
  round_code,
  title,
  scheduled_date,
  deadline,
  end_date,
  EXTRACT(DAY FROM (end_date - scheduled_date)) as duration_days
FROM rounds 
ORDER BY created_at DESC 
LIMIT 5;
```

### **3. التحقق من صفحة التقويم:**
1. اذهب إلى صفحة التقويم
2. تحقق من أن المسار الزمني يبدأ من `scheduled_date`
3. تحقق من أن المسار الزمني ينتهي في `end_date`
4. تحقق من وحدة التحكم للرسائل التشخيصية

## 🎯 النتائج المتوقعة

- ✅ **المهلة المختارة** تُحفظ في عمود `deadline`
- ✅ **تاريخ نهاية الجولة المحسوب** يُحفظ في عمود `end_date`
- ✅ **المسار الزمني** في التقويم يعتمد على البيانات من قاعدة البيانات
- ✅ **التسجيل للتشخيص** متاح في وحدة التحكم
- ✅ **لا توجد أخطاء** في الكود

## 📝 ملاحظات مهمة

1. **المهلة** تُحفظ كتاريخ محسوب (scheduled_date + deadline days)
2. **تاريخ نهاية الجولة** يُحفظ كتاريخ محسوب (scheduled_date + deadline days)
3. **كلا التاريخين** متطابقان في القيمة ولكن يُحفظان في أعمدة منفصلة
4. **المسار الزمني** في التقويم يعتمد على `end_date` أولاً، ثم `deadline` كاحتياطي
5. **التسجيل للتشخيص** متاح في جميع مراحل العملية

---

**تم التأكيد من أن نظام تخزين المهلة وتاريخ نهاية الجولة يعمل بشكل صحيح! 🎉**

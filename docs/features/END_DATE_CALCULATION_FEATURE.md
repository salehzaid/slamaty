# 📅 ميزة حساب تاريخ انتهاء الجولة
## End Date Calculation Feature

> 📅 التاريخ: 7 أكتوبر 2025  
> 🎯 المطلوب: حساب تاريخ انتهاء الجولة بناءً على التاريخ المجدول + المهلة  
> ✅ الحل: إضافة عمود `end_date` وحساب تلقائي للتاريخ

---

## 🔄 التحديثات المطبقة

### 1. قاعدة البيانات ✅

#### `backend/create_database.sql`:
```sql
CREATE TABLE IF NOT EXISTS rounds (
    -- ... existing columns ...
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE, -- Deadline for round completion
    end_date TIMESTAMP WITH TIME ZONE, -- Calculated end date (scheduled_date + deadline days)
    -- ... rest of columns ...
);
```

#### `backend/migrate_to_local_db.sql`:
```sql
-- نفس التحديث
end_date TIMESTAMP WITH TIME ZONE, -- Calculated end date (scheduled_date + deadline days)
```

### 2. نماذج Backend ✅

#### `backend/models_updated.py`:
```python
class Round(Base):
    # ... existing fields ...
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)  # تاريخ انتهاء الجولة المحسوب
    # ... rest of fields ...
```

#### `backend/schemas.py`:
```python
class RoundBase(BaseModel):
    # ... existing fields ...
    scheduled_date: datetime
    deadline: Optional[datetime] = None
    end_date: Optional[datetime] = None  # تاريخ انتهاء الجولة المحسوب
    # ... rest of fields ...
```

### 3. Backend CRUD ✅

#### `backend/crud.py`:
```python
def create_round(db: Session, round: RoundCreate, created_by_id: int):
    # ... existing logic ...
    db_round = Round(
        # ... existing fields ...
        scheduled_date=round.scheduled_date,
        deadline=round.deadline,
        end_date=round.end_date,  # تاريخ انتهاء الجولة المحسوب
        # ... rest of fields ...
    )
```

### 4. Frontend ✅

#### `src/components/forms/CompleteRoundForm.tsx`:

##### دالة حساب تاريخ الانتهاء:
```typescript
const calculateEndDate = (scheduledDate: string, deadline: string) => {
  if (!scheduledDate || !deadline) return null
  
  const startDate = new Date(scheduledDate)
  const deadlineDays = parseInt(deadline)
  
  if (isNaN(deadlineDays)) return null
  
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + deadlineDays)
  
  return endDate.toISOString()
}
```

##### تحديث handleSubmit:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  // ... validation ...
  
  // حساب تاريخ انتهاء الجولة
  const endDate = calculateEndDate(formData.scheduled_date, formData.deadline)
  
  const payload = {
    // ... existing fields ...
    scheduled_date: formData.scheduled_date ? `${formData.scheduled_date}T10:00:00` : null,
    end_date: endDate // تاريخ انتهاء الجولة المحسوب
  }
}
```

##### عرض تاريخ الانتهاء في النموذج:
```tsx
{/* عرض تاريخ الانتهاء المحسوب */}
{formData.scheduled_date && formData.deadline && (
  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
    <p className="text-xs text-blue-700">
      <span className="font-medium">تاريخ انتهاء الجولة:</span>{' '}
      {new Date(calculateEndDate(formData.scheduled_date, formData.deadline) || '').toLocaleDateString('ar-SA')}
    </p>
  </div>
)}
```

---

## 📊 أمثلة على الحساب

### مثال 1: جولة لمدة 3 أيام
- **التاريخ المجدول:** 2025-10-07
- **المهلة:** 3 أيام
- **تاريخ الانتهاء:** 2025-10-10

### مثال 2: جولة لمدة أسبوع
- **التاريخ المجدول:** 2025-10-07
- **المهلة:** 7 أيام
- **تاريخ الانتهاء:** 2025-10-14

### مثال 3: جولة لمدة أسبوعين
- **التاريخ المجدول:** 2025-10-07
- **المهلة:** 14 يوم
- **تاريخ الانتهاء:** 2025-10-21

---

## 🎯 الفوائد

### 1. **تتبع زمني دقيق:**
- حساب تلقائي لتاريخ انتهاء الجولة
- لا حاجة لحساب يدوي
- دقة في التوقيت

### 2. **عرض فوري:**
- يظهر تاريخ الانتهاء فور اختيار التاريخ والمهلة
- يساعد في التخطيط
- واجهة مستخدم محسنة

### 3. **دعم التقويم:**
- يمكن استخدام `end_date` في صفحة تقويم الجولات
- عكس المسار الزمني
- تتبع أفضل للجداول الزمنية

### 4. **مرونة في المهلة:**
- دعم خيارات متعددة (3 أيام، 5 أيام، أسبوع، أسبوعين)
- سهولة إضافة خيارات جديدة
- واجهة بديهية

---

## 🔧 التفاصيل التقنية

### 1. **حساب التاريخ:**
```javascript
const endDate = new Date(startDate)
endDate.setDate(startDate.getDate() + deadlineDays)
```

### 2. **تنسيق التاريخ:**
```javascript
return endDate.toISOString() // للـ API
// و
endDate.toLocaleDateString('ar-SA') // للعرض
```

### 3. **التحقق من صحة البيانات:**
```javascript
if (!scheduledDate || !deadline) return null
if (isNaN(deadlineDays)) return null
```

---

## 🎉 الخلاصة

تم تطبيق ميزة حساب تاريخ انتهاء الجولة بنجاح:

✅ **قاعدة البيانات:** إضافة عمود `end_date`  
✅ **Backend:** تحديث النماذج والـ CRUD  
✅ **Frontend:** حساب تلقائي وعرض فوري  
✅ **UX:** واجهة مستخدم محسنة مع عرض التاريخ  

**الآن يمكن تتبع الجداول الزمنية بدقة واستخدامها في التقويم! 🚀**

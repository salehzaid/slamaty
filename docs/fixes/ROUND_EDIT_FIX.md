# إصلاح مشكلة تعديل الجولات - نموذج التعديل فارغ

## المشكلة
عند الضغط على "تعديل" على أي جولة، كان النموذج يفتح فارغاً من:
- التصنيفات المختارة
- العناصر المختارة  
- المقيمين المحددين

على الرغم من أنها كانت محددة عند إنشاء الجولة.

## السبب
كانت المشكلة في `src/hooks/useRounds.ts` - عند تحميل بيانات الجولات من الـ API، لم يتم تضمين حقول:
- `evaluation_items` (عناصر التقييم)
- `selected_categories` (التصنيفات المختارة)

في البيانات المُحوّلة المُعادة إلى الواجهة.

## الحل المُطبّق

### 1. تعديل `src/hooks/useRounds.ts`
تم إضافة معالجة آمنة لحقلي `evaluation_items` و `selected_categories` في كل من:
- دالة `useRounds()` (للجولات العامة)
- دالة `useMyRounds()` (لجولات المستخدم)

#### التغييرات المضافة:
```typescript
// Safely parse evaluation_items
let evaluationItems = []
try {
  if (round.evaluation_items) {
    if (typeof round.evaluation_items === 'string') {
      evaluationItems = JSON.parse(round.evaluation_items)
    } else if (Array.isArray(round.evaluation_items)) {
      evaluationItems = round.evaluation_items
    }
  } else if (round.evaluationItems) {
    evaluationItems = Array.isArray(round.evaluationItems) ? round.evaluationItems : []
  }
} catch (e) {
  console.warn('Failed to parse evaluation_items for round:', round.id, round.evaluation_items)
}

// Safely parse selected_categories
let selectedCategories = []
try {
  if (round.selected_categories) {
    if (typeof round.selected_categories === 'string') {
      selectedCategories = JSON.parse(round.selected_categories)
    } else if (Array.isArray(round.selected_categories)) {
      selectedCategories = round.selected_categories
    }
  } else if (round.selectedCategories) {
    selectedCategories = Array.isArray(round.selectedCategories) ? round.selectedCategories : []
  }
} catch (e) {
  console.warn('Failed to parse selected_categories for round:', round.id, round.selected_categories)
}

// إضافة الحقول إلى الكائن المُعاد
return {
  // ... باقي الحقول
  evaluation_items: evaluationItems,
  selected_categories: selectedCategories,
  // ...
}
```

### 2. تحديث `src/types/index.ts`
تم إضافة الحقول المفقودة إلى واجهة `Round`:
```typescript
export interface Round {
  // ... باقي الحقول
  endDate?: string; // Calculated end date
  evaluation_items?: number[]; // IDs of selected evaluation items
  selected_categories?: number[]; // IDs of selected categories
  // ...
}
```

## النتيجة
الآن عند الضغط على "تعديل" على أي جولة:
- ✅ تظهر التصنيفات المختارة بشكل صحيح
- ✅ تظهر عناصر التقييم المختارة بشكل صحيح
- ✅ يظهر المقيمون المحددون بشكل صحيح
- ✅ تظهر جميع البيانات الأخرى (العنوان، الوصف، التاريخ، الأولوية، إلخ)

## الملفات المُعدّلة
1. `src/hooks/useRounds.ts` - إضافة معالجة آمنة للحقول الجديدة
2. `src/types/index.ts` - تحديث واجهة Round

## ملاحظات
- النماذج `CompleteRoundForm.tsx` و `RoundForm.tsx` كانت جاهزة بالفعل لقراءة هذه الحقول من `initialData`
- تم التعامل مع احتمالات متعددة لتنسيق البيانات (JSON string أو array)
- تم إضافة معالجة آمنة للأخطاء مع رسائل تحذير في console

## التاريخ
تم الإصلاح: 9 أكتوبر 2025


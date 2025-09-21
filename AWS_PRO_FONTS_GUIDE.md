# دليل خطوط AWS Pro في نظام سلامتي

## نظرة عامة
تم تطبيق خطوط AWS Pro على نظام سلامتي لتحسين تجربة المستخدم والوضوح البصري. يستخدم النظام خط Inter للعربية والإنجليزية وخط JetBrains Mono للنصوص البرمجية.

## الخطوط المستخدمة

### 1. خط Inter (AWS Pro Sans)
- **الاستخدام**: النصوص الرئيسية، العناوين، الأزرار، النماذج
- **الأوزان المتاحة**: 100, 200, 300, 400, 500, 600, 700, 800, 900
- **الاستخدام الأمثل**: جميع النصوص العربية والإنجليزية

### 2. خط JetBrains Mono (AWS Pro Mono)
- **الاستخدام**: الأكواد، النصوص البرمجية، المعرفات
- **الأوزان المتاحة**: 100, 200, 300, 400, 500, 600, 700, 800
- **الاستخدام الأمثل**: أكواد JavaScript، معرفات قاعدة البيانات

## الفئات المتاحة

### فئات الخطوط الأساسية
```css
.font-aws-pro          /* خط Inter */
.font-aws-pro-mono     /* خط JetBrains Mono */
.font-arabic           /* خط Noto Kufi Arabic (للنصوص العربية) */
```

### فئات التنسيق
```css
.text-display          /* 3.5rem, وزن 700 */
.text-heading-1        /* 2.5rem, وزن 600 */
.text-heading-2        /* 2rem, وزن 600 */
.text-heading-3        /* 1.5rem, وزن 600 */
.text-body-large       /* 1.125rem, وزن 400 */
.text-body             /* 1rem, وزن 400 */
.text-body-small       /* 0.875rem, وزن 400 */
.text-caption          /* 0.75rem, وزن 400 */
.text-code             /* 0.875rem, وزن 400 (JetBrains Mono) */
```

### فئات المكونات
```css
.aws-card              /* بطاقة بتنسيق AWS Pro */
.aws-button            /* زر بتنسيق AWS Pro */
.aws-input             /* حقل إدخال بتنسيق AWS Pro */
.aws-heading           /* عنوان بتنسيق AWS Pro */
.aws-subheading        /* عنوان فرعي بتنسيق AWS Pro */
.aws-body              /* نص أساسي بتنسيق AWS Pro */
.aws-caption           /* نص توضيحي بتنسيق AWS Pro */
```

## أمثلة الاستخدام

### في مكونات React
```tsx
// عنوان رئيسي
<h1 className="text-display font-aws-pro">عنوان رئيسي</h1>

// عنوان فرعي
<h2 className="text-heading-2 font-aws-pro">عنوان فرعي</h2>

// نص أساسي
<p className="text-body font-aws-pro">نص أساسي</p>

// كود
<code className="text-code font-aws-pro-mono">const example = "Hello World";</code>

// بطاقة
<div className="aws-card">
  <h3 className="aws-heading">عنوان البطاقة</h3>
  <p className="aws-body">محتوى البطاقة</p>
</div>
```

### في Tailwind CSS
```tsx
// استخدام فئات Tailwind
<div className="font-aws-pro text-xl font-semibold">
  نص بتنسيق AWS Pro
</div>

// مزيج من الفئات
<h1 className="font-aws-pro text-4xl font-bold text-gray-900">
  عنوان كبير
</h1>
```

## دعم RTL (من اليمين إلى اليسار)

النظام يدعم تلقائياً النصوص العربية مع الحفاظ على خط Noto Kufi Arabic للنصوص العربية:

```css
/* للنصوص العربية */
[dir="rtl"] .font-aws-pro {
  font-family: 'Noto Kufi Arabic', 'Inter', ...;
}
```

## أفضل الممارسات

### 1. اختيار الخط المناسب
- استخدم `font-aws-pro` للنصوص العادية
- استخدم `font-aws-pro-mono` للأكواد والمعرفات
- استخدم `font-arabic` للنصوص العربية فقط

### 2. التدرج الهرمي
- استخدم `text-display` للعناوين الرئيسية
- استخدم `text-heading-1` للعناوين الفرعية الكبيرة
- استخدم `text-body` للنصوص العادية
- استخدم `text-caption` للنصوص التوضيحية

### 3. التنسيق المتسق
- استخدم فئات المكونات الجاهزة (aws-*)
- حافظ على التدرج الهرمي للعناوين
- استخدم الأوزان المناسبة لكل مستوى

## التحديثات المستقبلية

- إضافة المزيد من أوزان الخطوط حسب الحاجة
- تحسين دعم الخطوط العربية
- إضافة فئات تنسيق إضافية للمكونات المتخصصة

---

**ملاحظة**: تم تطبيق هذه الخطوط مع الحفاظ على التوافق مع النظام الحالي ودعم RTL الكامل.

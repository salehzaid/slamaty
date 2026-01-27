# 🚀 تشغيل Backend يدوياً - الحل النهائي

## ⚠️ هام جداً: 
تم إصلاح خطأ `'Session' object has no attribute 'case'` في الكود.
الآن تحتاج فقط لإعادة تشغيل Backend ليتم تحميل التعديلات.

---

## 📋 الخطوات (3 دقائق)

### 1️⃣ افتح Terminal جديد

اضغط `Command + Space` واكتب `Terminal`

---

### 2️⃣ نفذ هذه الأوامر بالترتيب:

```bash
# 1. اذهب لمجلد المشروع
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds

# 2. أوقف أي Backend قديم
lsof -ti:8000 | xargs kill -9 2>/dev/null

# 3. اذهب لمجلد backend
cd backend

# 4. شغل Backend
./venv/bin/python main.py
```

---

### ✅ يجب أن ترى هذه الرسائل:

```
WARNING:  You must pass the application as an import string to enable 'reload' or 'workers'.
[DB] Using database: salamaty_db
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

### 🎯 إذا نجح التشغيل:

**اترك هذا Terminal مفتوحاً** ✋  
(لا تغلقه وإلا سيتوقف Backend)

---

### 3️⃣ افتح المتصفح واذهب إلى:

```
http://localhost:5174/reports
```

**الآن يجب أن تعمل الصفحة بدون خطأ!** ✨

---

## 🔍 التحقق من نجاح الإصلاح

### ✅ يجب أن لا ترى في Console:
- ❌ `'Session' object has no attribute 'case'`  ✅ تم الإصلاح!
- ❌ `500 Internal Server Error`  ✅ يجب أن يختفي!

### ✅ يجب أن ترى:
- ✅ جميع البطاقات الملونة تظهر
- ✅ الرسوم البيانية تظهر (أو "لا توجد بيانات" إذا كانت DB فارغة)
- ✅ لا أخطاء في Console

---

## 🐛 إذا ظهر خطأ عند التشغيل

### خطأ: `command not found: ./venv/bin/python`
**الحل:**
```bash
# جرب python3 مباشرة
python3 main.py
```

### خطأ: `ModuleNotFoundError: No module named 'fastapi'`
**الحل:**
```bash
# ثبت المكتبات
./venv/bin/pip install -r requirements.txt

# أو
pip3 install -r requirements.txt
```

### خطأ: `Address already in use`
**الحل:**
```bash
# أوقف العملية القديمة
lsof -ti:8000 | xargs kill -9

# ثم شغل Backend مرة أخرى
./venv/bin/python main.py
```

---

## 🎉 النتيجة المتوقعة

عند فتح `/reports`:

### 📊 البطاقات الملونة:
- 🟢 معدل الامتثال
- 🔵 إجمالي الجولات  
- 🟠 الخطط التصحيحية
- 🟣 الأقسام النشطة

### 📈 الرسوم البيانية:
1. اتجاهات الامتثال (Area Chart)
2. توزيع الجولات (Pie Chart)
3. أداء الأقسام (Bar Chart)
4. الجولات الشهرية (Stacked Bar)
5. توزيع CAPA (Pie Chart)

---

## 📝 ملاحظات

- **Backend يجب أن يبقى يعمل** طوال فترة الاستخدام
- إذا أغلقت Terminal، سيتوقف Backend
- يمكنك فتح Terminal جديد للعمل على أشياء أخرى

---

## ✅ ما تم إصلاحه:

```python
# قبل (خطأ):
func.count(db.case([(Round.status == "completed", 1)]))  ❌

# بعد (صحيح):
from sqlalchemy import extract, case  ✅
func.sum(case((Round.status == "completed", 1), else_=0))  ✅
```

---

**جاهز؟ شغل Backend الآن!** 🚀


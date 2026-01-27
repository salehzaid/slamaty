# 🚀 دليل تشغيل النظام
## Quick Start Guide

> **ملاحظة مهمة:** يجب تشغيل Backend أولاً ثم Frontend

---

## ⚡ التشغيل السريع (دقيقة واحدة)

### الخطوة 1️⃣: شغّل Backend

افتح Terminal واكتب:

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**انتظر حتى ترى:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### الخطوة 2️⃣: شغّل Frontend

افتح Terminal **جديد** (اترك الأول يعمل) واكتب:

```bash
npm run dev
```

**انتظر حتى ترى:**
```
Local:   http://localhost:5174/
```

### الخطوة 3️⃣: افتح المتصفح

اذهب إلى:
```
http://localhost:5174
```

**تم! 🎉**

---

## 📋 التحقق من التشغيل

### تحقق من Backend:
افتح في المتصفح:
```
http://localhost:8000/api/health
```

**يجب أن ترى:**
```json
{"status":"healthy"}
```

### تحقق من Frontend:
افتح في المتصفح:
```
http://localhost:5174
```

يجب أن ترى **صفحة تسجيل الدخول**

---

## 🔑 بيانات تسجيل الدخول

```
البريد الإلكتروني: testadmin@salamaty.com
كلمة المرور: test123
```

---

## ⚠️ مشاكل شائعة وحلولها

### المشكلة 1: Backend لا يعمل

**الأعراض:**
```
Failed to fetch
CORS error
Connection refused
```

**الحل:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

---

### المشكلة 2: Port مستخدم

**الخطأ:**
```
Address already in use: 8000
```

**الحل:**
```bash
# أوقف العملية القديمة
pkill -f uvicorn

# أو
lsof -ti:8000 | xargs kill -9

# ثم شغّل من جديد
python -m uvicorn main:app --reload --port 8000
```

---

### المشكلة 3: قاعدة البيانات لا تعمل

**الخطأ:**
```
could not connect to server: Connection refused
```

**الحل:**
```bash
# تحقق من PostgreSQL
brew services start postgresql@14

# أو
sudo service postgresql start
```

---

### المشكلة 4: 403 Forbidden

**السبب:** انتهت صلاحية الجلسة

**الحل:**
```javascript
// في Console (F12)
localStorage.clear()
location.reload()
```

ثم سجل دخولك مرة أخرى

---

## 🛑 إيقاف النظام

### إيقاف Backend:
في terminal Backend، اضغط:
```
Ctrl + C
```

### إيقاف Frontend:
في terminal Frontend، اضغط:
```
Ctrl + C
```

---

## 🔄 إعادة التشغيل

إذا واجهت مشاكل:

```bash
# 1. أوقف كل شيء
pkill -f uvicorn
pkill -f vite

# 2. امسح cache
rm -rf node_modules/.vite

# 3. شغّل Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# 4. في terminal جديد، شغّل Frontend
npm run dev
```

---

## 📂 هيكل المشروع

```
salamah_rounds/
├── backend/           # Backend (FastAPI + Python)
│   ├── main.py       # نقطة البداية
│   ├── models.py     # نماذج قاعدة البيانات
│   └── ...
├── src/              # Frontend (React + TypeScript)
│   ├── main.tsx      # نقطة البداية
│   ├── components/   # المكونات
│   └── ...
└── package.json      # إعدادات Frontend
```

---

## 🌐 Ports المستخدمة

| الخدمة | Port | URL |
|--------|------|-----|
| Backend API | 8000 | http://localhost:8000 |
| Frontend Dev | 5174 | http://localhost:5174 |
| PostgreSQL | 5432 | localhost:5432 |

---

## 📝 أوامر مفيدة

### Backend:
```bash
# تشغيل عادي
python -m uvicorn main:app --reload --port 8000

# تشغيل مع logs
python -m uvicorn main:app --reload --port 8000 --log-level debug

# تشغيل في الخلفية
python -m uvicorn main:app --reload --port 8000 &
```

### Frontend:
```bash
# تشغيل development
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

### قاعدة البيانات:
```bash
# الاتصال بقاعدة البيانات
psql -d salamaty_db

# استيراد البيانات
psql -d salamaty_db -f backend/init_database.sql

# عرض الجداول
psql -d salamaty_db -c "\dt"
```

---

## 🔧 نصائح للتطوير

### 1. استخدم Terminal منفصل لكل خدمة:
- **Terminal 1:** Backend
- **Terminal 2:** Frontend
- **Terminal 3:** أوامر إضافية

### 2. اترك Backend يعمل:
Backend يجب أن يبقى يعمل طوال فترة التطوير

### 3. Hot Reload:
كلا الخادمين يدعمان hot reload:
- **Backend:** تغييرات تلقائية عند تعديل ملفات Python
- **Frontend:** تغييرات تلقائية عند تعديل ملفات React

### 4. Console مفتوح:
اترك Developer Console (F12) مفتوحاً لمراقبة الأخطاء

---

## 🎯 Checklist قبل البدء

- [ ] PostgreSQL يعمل
- [ ] Backend يعمل على port 8000
- [ ] Frontend يعمل على port 5174
- [ ] يمكنك فتح http://localhost:8000/api/health
- [ ] يمكنك فتح http://localhost:5174
- [ ] لديك بيانات تسجيل الدخول

---

## 📞 المساعدة

### إذا واجهت مشاكل:

1. **تحقق من logs:**
   - Backend logs في Terminal
   - Frontend logs في Console (F12)

2. **راجع الأدلة:**
   - `QUICK_FIX_AR.md` - حلول سريعة
   - `DEBUG_UPDATE_ERROR.md` - تشخيص الأخطاء
   - `FIX_BACKEND_NOT_RUNNING.md` - مشاكل Backend

3. **أعد التشغيل:**
   - أوقف كل شيء
   - شغّل Backend أولاً
   - ثم Frontend

---

## 🎉 جاهز!

الآن يمكنك:
- ✅ إنشاء جولات تقييم
- ✅ إدارة عناصر التقييم
- ✅ إنشاء خطط تصحيحية (CAPA)
- ✅ إصدار التقارير

**استمتع بالنظام! 🚀**


#!/bin/bash

echo "🚀 بدء تشغيل نظام سلامتي..."
echo "=================================="

# الانتقال لمجلد المشروع
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds

# تحقق من PostgreSQL
echo "📊 فحص قاعدة البيانات..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL غير مثبت. يرجى تثبيته أولاً:"
    echo "brew install postgresql"
    exit 1
fi

# تشغيل PostgreSQL
brew services start postgresql 2>/dev/null || true

# إنشاء قاعدة البيانات إن لم تكن موجودة
echo "🗄️ إنشاء قاعدة البيانات..."
createdb salamaty_db 2>/dev/null || echo "قاعدة البيانات موجودة بالفعل"

# إعداد Backend
echo "⚙️ إعداد Backend..."
cd backend

# إنشاء البيئة الافتراضية
if [ ! -d "venv" ]; then
    echo "📦 إنشاء البيئة الافتراضية..."
    python -m venv venv
fi

# تفعيل البيئة
source venv/bin/activate

# تثبيت المتطلبات
echo "📚 تثبيت مكتبات Python..."
pip install -r requirements.txt -q

# نسخ ملف الإعدادات
cp env.local .env 2>/dev/null || true

# إنشاء الجداول والمستخدمين
echo "🗃️ إنشاء الجداول..."
python create_tables.py

echo "👥 إنشاء المستخدمين الافتراضيين..."
python recreate_users.py

echo ""
echo "✅ تم إعداد Backend بنجاح!"
echo ""
echo "🔑 بيانات تسجيل الدخول:"
echo "  اسم المستخدم: admin"
echo "  كلمة المرور: admin123"
echo ""
echo "📍 الآن شغّل الأوامر التالية في ترمينال منفصل:"
echo ""
echo "1️⃣ تشغيل Backend:"
echo "cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend"
echo "source venv/bin/activate"
echo "python main.py"
echo ""
echo "2️⃣ تشغيل Frontend (ترمينال جديد):"
echo "cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds"
echo "npm install"
echo "npm run dev"
echo ""
echo "3️⃣ مشاركة عبر Ngrok (ترمينال ثالث):"
echo "ngrok http 5174"
echo ""
echo "🌐 ستفتح الواجهة على: http://localhost:5174"
echo "🔗 API متاح على: http://localhost:8000"

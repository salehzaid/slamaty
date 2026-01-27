#!/bin/bash

echo "🔄 إعادة تشغيل Backend Server..."

# إيقاف أي عمليات Python تعمل على المنفذ 8000
echo "🛑 إيقاف العمليات السابقة..."
pkill -f "python.*main.py" || true
pkill -f "uvicorn.*main:app" || true

# انتظار قليل
sleep 2

# الانتقال إلى مجلد backend
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend

# تفعيل البيئة الافتراضية
echo "🔧 تفعيل البيئة الافتراضية..."
source venv/bin/activate

# نسخ ملف الإعدادات
echo "📋 نسخ ملف الإعدادات..."
cp env.local .env

# تشغيل الخادم
echo "🚀 تشغيل الخادم..."
python main.py &

echo "✅ تم تشغيل الخادم على http://localhost:8000"
echo "🔑 بيانات تسجيل الدخول:"
echo "   البريد الإلكتروني: test@example.com"
echo "   كلمة المرور: admin123"

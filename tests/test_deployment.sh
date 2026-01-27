#!/bin/bash
# 🧪 اختبار النشر السريع - Quick Deployment Test

echo "🚀 اختبار نشر مشروع سلامتي..."
echo "================================"
echo ""

# تعريف الرابط
URL="https://qpsrounds-production.up.railway.app"

# اختبار 1: Health Check
echo "📊 اختبار 1: Health Check API"
echo "--------------------------------"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health Check: نجح!"
    curl -s "$URL/health" | python3 -m json.tool
else
    echo "❌ Health Check: فشل! (Status Code: $HEALTH_RESPONSE)"
    echo "⏳ ربما Railway لا يزال يبني المشروع... انتظر 2-3 دقائق."
fi

echo ""
echo ""

# اختبار 2: الصفحة الرئيسية
echo "🏠 اختبار 2: الصفحة الرئيسية"
echo "--------------------------------"
HOME_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/")

if [ "$HOME_RESPONSE" = "200" ]; then
    echo "✅ الصفحة الرئيسية: تعمل!"
else
    echo "❌ الصفحة الرئيسية: خطأ! (Status Code: $HOME_RESPONSE)"
fi

echo ""
echo ""

# اختبار 3: Swagger Docs
echo "📚 اختبار 3: API Documentation"
echo "--------------------------------"
DOCS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/docs")

if [ "$DOCS_RESPONSE" = "200" ]; then
    echo "✅ Swagger Docs: متاحة!"
    echo "🔗 افتح: $URL/docs"
else
    echo "❌ Swagger Docs: غير متاحة! (Status Code: $DOCS_RESPONSE)"
fi

echo ""
echo ""

# ملخص نهائي
echo "================================"
echo "📊 ملخص الاختبار:"
echo "================================"
echo ""

if [ "$HEALTH_RESPONSE" = "200" ] && [ "$HOME_RESPONSE" = "200" ]; then
    echo "🎉 المشروع يعمل بنجاح!"
    echo ""
    echo "🔗 افتح في المتصفح:"
    echo "   $URL"
    echo ""
    echo "📚 التوثيق (Swagger):"
    echo "   $URL/docs"
    echo ""
    echo "🔑 بيانات الدخول:"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo "⏳ المشروع لا يزال قيد البناء..."
    echo ""
    echo "🔍 تحقق من حالة البناء على:"
    echo "   https://railway.app/dashboard"
    echo ""
    echo "⏱️ انتظر 2-3 دقائق ثم جرب مرة أخرى:"
    echo "   bash test_deployment.sh"
fi

echo ""
echo "================================"


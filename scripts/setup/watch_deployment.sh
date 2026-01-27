#!/bin/bash
# 👀 مراقبة النشر التلقائية - Auto Deployment Watcher

URL="https://qpsrounds-production.up.railway.app"
MAX_ATTEMPTS=15
ATTEMPT=1

echo "👀 بدء مراقبة النشر على Railway..."
echo "🔗 الرابط: $URL"
echo "⏱️  سأتحقق كل 30 ثانية حتى 15 محاولة (~7.5 دقيقة)"
echo "================================"
echo ""

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "🔍 المحاولة #$ATTEMPT من $MAX_ATTEMPTS ($(date '+%H:%M:%S'))"
    echo "--------------------------------"
    
    # اختبار Health Check
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/health" 2>/dev/null)
    
    if [ "$HEALTH_CODE" = "200" ]; then
        echo "✅ Health Check: نجح! (200 OK)"
        
        # اختبار الصفحة الرئيسية
        HOME_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/" 2>/dev/null)
        
        if [ "$HOME_CODE" = "200" ]; then
            echo "✅ الصفحة الرئيسية: تعمل!"
            echo ""
            echo "🎉🎉🎉 نجح النشر! 🎉🎉🎉"
            echo "================================"
            echo ""
            echo "🔗 المشروع جاهز على:"
            echo "   $URL"
            echo ""
            echo "📚 التوثيق (Swagger):"
            echo "   $URL/docs"
            echo ""
            echo "🔑 بيانات الدخول:"
            echo "   Username: admin"
            echo "   Password: admin123"
            echo ""
            echo "✨ افتح المتصفح وجرب المشروع!"
            echo ""
            
            # إشعار صوتي على macOS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                osascript -e 'display notification "المشروع يعمل الآن!" with title "Railway Deployment Success" sound name "Glass"' 2>/dev/null
                say "تم نشر المشروع بنجاح" 2>/dev/null
            fi
            
            exit 0
        else
            echo "⚠️  الصفحة الرئيسية: $HOME_CODE"
        fi
    elif [ "$HEALTH_CODE" = "503" ]; then
        echo "🔄 Health Check: 503 (الخدمة قيد البناء...)"
    elif [ "$HEALTH_CODE" = "000" ]; then
        echo "⏳ Health Check: لا يمكن الوصول (Railway لا يزال يبني...)"
    else
        echo "❌ Health Check: $HEALTH_CODE"
    fi
    
    # حساب الوقت المتبقي
    REMAINING=$((MAX_ATTEMPTS - ATTEMPT))
    TIME_LEFT=$((REMAINING * 30))
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "⏳ انتظار 30 ثانية... (باقي $REMAINING محاولة، ~${TIME_LEFT}s)"
        echo ""
        sleep 30
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "================================"
echo "⏱️  انتهت المحاولات ($MAX_ATTEMPTS محاولة)"
echo ""
echo "الخدمة لا تزال غير متاحة بعد ~7.5 دقيقة."
echo ""
echo "🔍 الخطوات التالية:"
echo ""
echo "1. تحقق من حالة البناء على Railway:"
echo "   https://railway.app/dashboard"
echo ""
echo "2. افحص Logs في Railway:"
echo "   Dashboard → quality_rounds → Deployments"
echo ""
echo "3. ابحث عن أخطاء في Build Logs أو Deploy Logs"
echo ""
echo "4. جرب الاختبار يدوياً:"
echo "   bash test_deployment.sh"
echo ""
echo "5. إذا استمرت المشكلة، أخبرني بالأخطاء من Logs"
echo ""

exit 1


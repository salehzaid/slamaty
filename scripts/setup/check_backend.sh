#!/bin/bash

# Script للتحقق من أن الباك اند شغال

echo "🔍 جاري التحقق من حالة الباك اند..."
echo ""

# تحقق من المنفذ 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ الباك اند شغال على المنفذ 8000"
    
    # جرب الاتصال بـ health endpoint
    echo ""
    echo "🔗 جاري الاتصال بـ API..."
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/rounds)
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
        echo "✅ الباك اند يستجيب (Status: $RESPONSE)"
        if [ "$RESPONSE" = "401" ]; then
            echo "⚠️  الباك اند يحتاج توكن للمصادقة (هذا طبيعي)"
        fi
    else
        echo "⚠️  الباك اند يستجيب لكن بحالة غير متوقعة: $RESPONSE"
    fi
    
    echo ""
    echo "📍 يمكنك الوصول إلى واجهة API على:"
    echo "   http://localhost:8000/docs"
    
else
    echo "❌ الباك اند غير شغال على المنفذ 8000"
    echo ""
    echo "لتشغيل الباك اند، استخدم أحد الأوامر التالية:"
    echo "   ./start_backend_macos.sh"
    echo "أو"
    echo "   cd backend && python3 main.py"
fi

echo ""
echo "=" 
echo ""


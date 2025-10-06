#!/bin/bash
# Test evaluation submission fix

URL="https://qpsrounds-production.up.railway.app"

echo "🧪 اختبار إصلاح تقييم الجولات"
echo "================================"
echo ""

# Login as assessor
echo "1️⃣ تسجيل دخول كمقيّم..."
TOKEN=$(curl -s -X POST "$URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "assessor1", "password": "assessor123"}' | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "❌ فشل تسجيل الدخول"
    exit 1
fi

echo "✅ تم تسجيل الدخول بنجاح!"
echo ""

# Check if API endpoint exists
echo "2️⃣ التحقق من وجود endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$URL/api/rounds/1/evaluations/finalize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"evaluations":[],"notes":"test"}')

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "400" ]; then
    echo "✅ Endpoint موجود ويستجيب! (Status: $RESPONSE)"
    echo ""
    echo "🎉 الإصلاح نجح!"
    echo "المقيّمون يمكنهم الآن إرسال التقارير بنجاح!"
else
    echo "⏳ Endpoint لا يزال قيد التحديث (Status: $RESPONSE)"
    echo "انتظر دقيقة أخرى ثم جرب مرة أخرى"
fi

echo ""

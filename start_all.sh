#!/bin/bash

echo "🚀 تشغيل نظام سلامتي - صفحة التقارير"
echo "=========================================="
echo ""

# ألوان للطباعة
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# تنظيف المنافذ
echo -e "${YELLOW}📌 الخطوة 1: تنظيف المنافذ...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
echo -e "${GREEN}✅ تم تنظيف المنافذ${NC}"
echo ""

# تشغيل Backend
echo -e "${BLUE}🔧 الخطوة 2: تشغيل Backend...${NC}"
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds/backend
python3 main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend يعمل (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}📝 اللوج في: backend.log${NC}"
echo ""

# انتظار Backend يبدأ
echo -e "${YELLOW}⏳ انتظار Backend...${NC}"
sleep 5

# التحقق من Backend
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend جاهز على http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Backend لم يبدأ بشكل صحيح${NC}"
    echo -e "${YELLOW}📝 تحقق من backend.log للتفاصيل${NC}"
fi
echo ""

# تشغيل Frontend
echo -e "${BLUE}🎨 الخطوة 3: تشغيل Frontend...${NC}"
cd /Users/salehalzaid/Documents/massdeigners/salamah_rounds
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend يعمل (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}📝 اللوج في: frontend.log${NC}"
echo ""

# انتظار Frontend يبدأ
echo -e "${YELLOW}⏳ انتظار Frontend...${NC}"
sleep 5
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 كل شيء جاهز!${NC}"
echo ""
echo -e "${BLUE}📊 افتح المتصفح على:${NC}"
echo -e "   ${GREEN}http://localhost:5174/reports${NC}"
echo ""
echo -e "${YELLOW}📝 تسجيل الدخول:${NC}"
echo -e "   البريد: ${GREEN}admin@salamaty.com${NC}"
echo -e "   كلمة المرور: ${GREEN}admin123${NC}"
echo ""
echo -e "${RED}⚠️  لإيقاف الخوادم:${NC}"
echo -e "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${YELLOW}📋 أو شاهد الملف: START_REPORTS_TESTING.md${NC}"
echo "=========================================="


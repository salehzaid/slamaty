#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 تشغيل نظام سلامتي (النسخة 2)"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Cleanup ports
echo -e "${YELLOW}📌 الخطوة 1: تنظيف المنافذ...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
echo -e "${GREEN}✅ تم تنظيف المنافذ${NC}"
echo ""

# Start Backend
echo -e "${BLUE}🔧 الخطوة 2: تشغيل Backend...${NC}"
cd backend
# Check if venv exists and activate it
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo -e "${YELLOW}⚠️ لم يتم العثور على venv، محاولة التشغيل بدونه...${NC}"
fi

# Run in background and disown to prevent killing when script exits
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID
echo -e "${GREEN}✅ Backend يعمل (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}📝 اللوج في: backend.log${NC}"
echo ""

# Wait for Backend
echo -e "${YELLOW}⏳ انتظار Backend...${NC}"
sleep 5

# Check Backend Health
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend جاهز على http://localhost:8000${NC}"
else
    echo -e "${RED}❌ Backend لم يبدأ بشكل صحيح${NC}"
    echo -e "${YELLOW}📝 تحقق من backend.log للتفاصيل${NC}"
fi
echo ""

# Start Frontend
echo -e "${BLUE}🎨 الخطوة 3: تشغيل Frontend...${NC}"
cd "$SCRIPT_DIR"
# Run in background and disown
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
disown $FRONTEND_PID
echo -e "${GREEN}✅ Frontend يعمل (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}📝 اللوج في: frontend.log${NC}"
echo ""

# Wait for Frontend
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

#!/bin/bash

# =====================================================
# سكريبت إعداد قاعدة البيانات المحلية
# قاعدة البيانات: salamaty_db
# المستخدم: postgres
# كلمة المرور: mass
# =====================================================

echo "🚀 بدء إعداد قاعدة البيانات المحلية..."

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# فحص تثبيت PostgreSQL
echo -e "\n${BLUE}1️⃣ فحص تثبيت PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL غير مثبت${NC}"
    echo "يرجى تثبيت PostgreSQL أولاً:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "  CentOS: sudo yum install postgresql postgresql-server"
    exit 1
else
    echo -e "${GREEN}✅ PostgreSQL مثبت${NC}"
    psql --version
fi

# فحص تشغيل خادم PostgreSQL
echo -e "\n${BLUE}2️⃣ فحص تشغيل خادم PostgreSQL...${NC}"
if ! pg_isready -q; then
    echo -e "${YELLOW}⚠️ خادم PostgreSQL غير مشغل${NC}"
    echo "محاولة تشغيل الخادم..."
    
    # تشغيل PostgreSQL حسب النظام
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start postgresql
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start postgresql
    fi
    
    sleep 3
    
    if pg_isready -q; then
        echo -e "${GREEN}✅ تم تشغيل خادم PostgreSQL${NC}"
    else
        echo -e "${RED}❌ فشل في تشغيل خادم PostgreSQL${NC}"
        echo "يرجى تشغيل PostgreSQL يدوياً"
        exit 1
    fi
else
    echo -e "${GREEN}✅ خادم PostgreSQL يعمل${NC}"
fi

# إنشاء قاعدة البيانات إذا لم تكن موجودة
echo -e "\n${BLUE}3️⃣ إنشاء قاعدة البيانات salamaty_db...${NC}"
createdb -U postgres salamaty_db 2>/dev/null || echo -e "${YELLOW}⚠️ قاعدة البيانات موجودة بالفعل${NC}"

# فحص الاتصال بقاعدة البيانات
echo -e "\n${BLUE}4️⃣ فحص الاتصال بقاعدة البيانات...${NC}"
if PGPASSWORD=mass psql -U postgres -d salamaty_db -c "SELECT version();" &>/dev/null; then
    echo -e "${GREEN}✅ الاتصال بقاعدة البيانات ناجح${NC}"
else
    echo -e "${RED}❌ فشل الاتصال بقاعدة البيانات${NC}"
    echo "يرجى التأكد من:"
    echo "- كلمة مرور المستخدم postgres هي 'mass'"
    echo "- صلاحيات المستخدم postgres"
    exit 1
fi

# تشغيل سكريبت Python
echo -e "\n${BLUE}5️⃣ تشغيل سكريبت نقل البيانات...${NC}"
if python3 migrate_to_local.py; then
    echo -e "${GREEN}✅ تم نقل البيانات بنجاح${NC}"
else
    echo -e "${RED}❌ فشل في نقل البيانات${NC}"
    exit 1
fi

# عرض إحصائيات البيانات
echo -e "\n${BLUE}6️⃣ إحصائيات البيانات المنقولة:${NC}"
PGPASSWORD=mass psql -U postgres -d salamaty_db -c "
SELECT 'المستخدمون' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'الأقسام', COUNT(*) FROM departments
UNION ALL
SELECT 'الجولات', COUNT(*) FROM rounds
UNION ALL
SELECT 'الخطط التصحيحية', COUNT(*) FROM capas
UNION ALL
SELECT 'تصنيفات التقييم', COUNT(*) FROM evaluation_categories
UNION ALL
SELECT 'عناصر التقييم', COUNT(*) FROM evaluation_items
UNION ALL
SELECT 'نتائج التقييم', COUNT(*) FROM evaluation_results;
"

echo -e "\n${GREEN}🎉 تم إعداد قاعدة البيانات المحلية بنجاح!${NC}"
echo -e "\n${BLUE}📋 الخطوات التالية:${NC}"
echo "1. افتح pgAdmin4"
echo "2. اتصل بالخادم المحلي (localhost:5432)"
echo "3. استخدم بيانات الدخول: postgres / mass"
echo "4. انتقل إلى قاعدة البيانات salamaty_db"
echo "5. تصفح الجداول والبيانات المنقولة"

echo -e "\n${BLUE}🔧 لتحديث إعدادات التطبيق:${NC}"
echo "1. انسخ ملف env.local إلى .env"
echo "2. أو قم بتحديث DATABASE_URL في ملف .env الحالي"
echo "3. أعد تشغيل خادم التطبيق"

echo -e "\n${YELLOW}💡 ملاحظة:${NC}"
echo "كلمة مرور جميع المستخدمين الافتراضيين هي: admin123"

#!/bin/bash

# سكريبت إعداد قاعدة البيانات لـ نظام سلامتي
echo "🚀 بدء إعداد قاعدة البيانات..."

# إعدادات قاعدة البيانات
DB_NAME="salamaty_system"
DB_USER="postgres"
DB_PASSWORD="mass"
DB_HOST="localhost"
DB_PORT="5432"

# اختبار الاتصال
echo "🔗 اختبار الاتصال بقاعدة البيانات..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ تم الاتصال بقاعدة البيانات بنجاح"
else
    echo "❌ فشل الاتصال بقاعدة البيانات"
    echo "تأكد من:"
    echo "  1. تشغيل PostgreSQL"
    echo "  2. وجود قاعدة البيانات salamaty_system"
    echo "  3. صحة بيانات الاتصال"
    exit 1
fi

# تنفيذ سكريبت SQL
echo "📋 جاري إنشاء الجداول..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f create_database.sql

if [ $? -eq 0 ]; then
    echo "🎉 تم إنشاء قاعدة البيانات بنجاح!"
    
    # عرض ملخص الجداول
    echo "📊 الجداول المنشأة:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
    "
    
    # عرض عدد السجلات
    echo "📈 عدد السجلات في كل جدول:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as row_count
    FROM pg_stat_user_tables 
    ORDER BY tablename;
    "
    
else
    echo "❌ فشل في إنشاء قاعدة البيانات"
    exit 1
fi

echo "✅ تم إعداد قاعدة البيانات بنجاح!"
echo "يمكنك الآن تشغيل التطبيق باستخدام: python main.py"

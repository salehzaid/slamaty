-- إنشاء مستخدم تجريبي للاختبار
-- Create test user for testing

-- حذف المستخدم إذا كان موجوداً
DELETE FROM users WHERE email = 'admin@test.com';

-- إنشاء مستخدم جديد
INSERT INTO users (
    username, 
    email, 
    hashed_password, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'admin',
    'admin@test.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.8.8', -- admin123
    'مدير',
    'النظام',
    'super_admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- التحقق من إنشاء المستخدم
SELECT id, username, email, role, is_active FROM users WHERE email = 'admin@test.com';

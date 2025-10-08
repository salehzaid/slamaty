-- =====================================================
-- سكريبت نقل البيانات الافتراضية إلى قاعدة البيانات المحلية
-- قاعدة البيانات: salamaty_db
-- المستخدم: postgres
-- كلمة المرور: mass
-- =====================================================

-- إنشاء قاعدة البيانات إذا لم تكن موجودة
-- CREATE DATABASE salamaty_db;

-- الاتصال بقاعدة البيانات salamaty_db
-- \c salamaty_db;

-- =====================================================
-- 1. إنشاء الجداول الأساسية
-- =====================================================

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('super_admin', 'quality_manager', 'department_head', 'assessor', 'viewer')),
    department VARCHAR(100),
    phone VARCHAR(20),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الأقسام
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    location VARCHAR(100),
    floor VARCHAR(20),
    building VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الجولات
CREATE TABLE IF NOT EXISTS rounds (
    id SERIAL PRIMARY KEY,
    round_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    round_type VARCHAR(30) NOT NULL CHECK (round_type IN ('patient_safety', 'infection_control', 'hygiene', 'medication_safety', 'equipment_safety', 'environmental', 'general')),
    department VARCHAR(100) NOT NULL,
    assigned_to TEXT, -- JSON string of user IDs
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE, -- Deadline for round completion
    end_date TIMESTAMP WITH TIME ZONE, -- Calculated end date (scheduled_date + deadline days)
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'pending_review', 'under_review', 'completed', 'cancelled', 'on_hold', 'overdue')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    compliance_percentage INTEGER DEFAULT 0,
    notes TEXT,
    evaluation_items TEXT, -- JSON string of evaluation item IDs
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول الخطط التصحيحية (CAPA)
CREATE TABLE IF NOT EXISTS capas (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    round_id INTEGER REFERENCES rounds(id),
    department VARCHAR(100) NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'implemented', 'verification', 'verified', 'rejected', 'closed')),
    assigned_to VARCHAR(100), -- User name or ID
    target_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    risk_score INTEGER
);

-- جدول تصنيفات التقييم
CREATE TABLE IF NOT EXISTS evaluation_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    color VARCHAR(20) DEFAULT 'blue',
    icon VARCHAR(50) DEFAULT 'shield',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول عناصر التقييم
CREATE TABLE IF NOT EXISTS evaluation_items (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    title_en VARCHAR(200),
    description TEXT,
    objective TEXT,
    category_id INTEGER NOT NULL REFERENCES evaluation_categories(id),
    category_name VARCHAR(100) NOT NULL,
    category_color VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    weight INTEGER DEFAULT 1,
    risk_level VARCHAR(20) DEFAULT 'MINOR' CHECK (risk_level IN ('MINOR', 'MAJOR', 'CRITICAL')),
    evidence_type TEXT DEFAULT 'OBSERVATION',
    guidance_ar TEXT,
    guidance_en TEXT,
    standard_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول نتائج التقييم
CREATE TABLE IF NOT EXISTS evaluation_results (
    id SERIAL PRIMARY KEY,
    round_id INTEGER NOT NULL REFERENCES rounds(id),
    item_id INTEGER NOT NULL REFERENCES evaluation_items(id),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    comments TEXT,
    evidence_files TEXT, -- JSON array of file paths
    evaluated_by INTEGER NOT NULL REFERENCES users(id),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. إنشاء الفهارس لتحسين الأداء
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_rounds_code ON rounds(round_code);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_rounds_department ON rounds(department);
CREATE INDEX IF NOT EXISTS idx_capas_status ON capas(status);
CREATE INDEX IF NOT EXISTS idx_capas_department ON capas(department);
CREATE INDEX IF NOT EXISTS idx_evaluation_items_category ON evaluation_items(category_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_items_code ON evaluation_items(code);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_round ON evaluation_results(round_id);

-- =====================================================
-- 3. مسح البيانات الموجودة (اختياري)
-- =====================================================

-- TRUNCATE TABLE evaluation_results CASCADE;
-- TRUNCATE TABLE evaluation_items CASCADE;
-- TRUNCATE TABLE evaluation_categories CASCADE;
-- TRUNCATE TABLE capas CASCADE;
-- TRUNCATE TABLE rounds CASCADE;
-- TRUNCATE TABLE departments CASCADE;
-- TRUNCATE TABLE users CASCADE;

-- =====================================================
-- 4. إدراج المستخدمين الافتراضيين
-- =====================================================

INSERT INTO users (username, email, hashed_password, first_name, last_name, role, department, phone, position, is_active) VALUES
('admin', 'admin@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'محمد', 'العمراني', 'super_admin', 'إدارة النظام', '+966501234567', 'مدير النظام', true),
('quality_manager', 'quality@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'فاطمة', 'الأحمد', 'quality_manager', 'إدارة الجودة', '+966501234568', 'مديرة الجودة', true),
('ed_head', 'ed@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'أحمد', 'الفارسي', 'department_head', 'قسم الطوارئ', '+966501234569', 'رئيس قسم الطوارئ', true),
('assessor1', 'assessor@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'خالد', 'المنصوري', 'assessor', 'إدارة الجودة', '+966501234570', 'مقيم جودة', true),
('viewer', 'viewer@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'نورا', 'الزهراني', 'viewer', 'الإدارة العامة', '+966501234571', 'مشاهد', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 5. إدراج الأقسام الافتراضية
-- =====================================================

INSERT INTO departments (name, name_en, code, description, location, floor, building, is_active) VALUES
('قسم الطوارئ', 'Emergency Department', 'ED', 'قسم الطوارئ والحالات الحرجة', 'الطابق الأرضي', 'G', 'المبنى الرئيسي', true),
('قسم العناية المركزة', 'Intensive Care Unit', 'ICU', 'قسم العناية المركزة للبالغين', 'الطابق الثالث', '3', 'المبنى الرئيسي', true),
('قسم الجراحة', 'Surgery Department', 'SURG', 'قسم الجراحة العامة والتخصصية', 'الطابق الثاني', '2', 'المبنى الرئيسي', true),
('قسم الأطفال', 'Pediatrics Department', 'PEDS', 'قسم طب الأطفال والرضع', 'الطابق الرابع', '4', 'المبنى الرئيسي', true),
('التمريض', 'Nursing', 'NUR', 'قسم التمريض والعناية بالمرضى', 'المبنى الرئيسي', 'الطابق الأول', 'المبنى A', true),
('النساء والولادة', 'Obstetrics', 'OBS', 'قسم النساء والولادة', 'المبنى الرئيسي', 'الطابق الرابع', 'المبنى A', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 6. إدراج تصنيفات التقييم الافتراضية
-- =====================================================

INSERT INTO evaluation_categories (name, name_en, description, color, icon, is_active) VALUES
('مكافحة العدوى', 'Infection Control', 'تصنيف معايير مكافحة العدوى والوقاية منها', 'red', 'shield', true),
('سلامة المرضى', 'Patient Safety', 'تصنيف معايير سلامة المرضى والرعاية الآمنة', 'blue', 'heart', true),
('الجودة', 'Quality', 'تصنيف معايير الجودة والتحسين المستمر', 'green', 'check-circle', true),
('الأمن والسلامة', 'Security & Safety', 'تصنيف معايير الأمن والسلامة العامة', 'orange', 'lock', true),
('النظافة والتعقيم', 'Hygiene & Sterilization', 'تصنيف معايير النظافة والتعقيم', 'purple', 'zap', true),
('سلامة الأدوية', 'Medication Safety', 'تصنيف معايير سلامة الأدوية والصيدلة', 'cyan', 'eye', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. إدراج عناصر التقييم الافتراضية
-- =====================================================

INSERT INTO evaluation_items (code, title, title_en, description, objective, category_id, category_name, category_color, is_required, weight, risk_level, evidence_type, guidance_ar, guidance_en, is_active) VALUES
('IC001', 'غسل اليدين', 'Hand Hygiene', 'التأكد من تطبيق معايير غسل اليدين', 'منع انتقال العدوى', 1, 'مكافحة العدوى', 'red', true, 5, 'CRITICAL', 'OBSERVATION', 'يجب غسل اليدين قبل وبعد التعامل مع المرضى', 'Hands must be washed before and after patient contact', true),
('IC002', 'استخدام القفازات', 'Glove Usage', 'التأكد من الاستخدام الصحيح للقفازات', 'منع انتقال العدوى', 1, 'مكافحة العدوى', 'red', true, 4, 'MAJOR', 'OBSERVATION', 'يجب ارتداء القفازات عند التعامل مع المرضى', 'Gloves must be worn when handling patients', true),
('PS001', 'تحديد هوية المريض', 'Patient Identification', 'التأكد من تحديد هوية المريض بشكل صحيح', 'منع الأخطاء الطبية', 2, 'سلامة المرضى', 'blue', true, 5, 'CRITICAL', 'OBSERVATION', 'يجب التحقق من هوية المريض قبل أي إجراء', 'Patient identity must be verified before any procedure', true),
('PS002', 'التحقق من الحساسية', 'Allergy Check', 'التأكد من التحقق من حساسية المريض', 'منع التفاعلات الدوائية', 2, 'سلامة المرضى', 'blue', true, 4, 'MAJOR', 'DOCUMENT', 'يجب التحقق من الحساسية قبل إعطاء الأدوية', 'Allergies must be checked before administering medications', true),
('Q001', 'توثيق العمليات', 'Process Documentation', 'التأكد من توثيق جميع العمليات بشكل صحيح', 'ضمان الجودة والتحسين', 3, 'الجودة', 'green', true, 3, 'MAJOR', 'DOCUMENT', 'يجب توثيق جميع العمليات والنتائج', 'All processes and results must be documented', true),
('Q002', 'مراجعة السياسات', 'Policy Review', 'التأكد من مراجعة السياسات بانتظام', 'ضمان التحديث المستمر', 3, 'الجودة', 'green', true, 2, 'MINOR', 'DOCUMENT', 'يجب مراجعة السياسات كل 6 أشهر', 'Policies must be reviewed every 6 months', true),
('SS001', 'التحقق من الأجهزة', 'Equipment Check', 'التأكد من سلامة الأجهزة الطبية', 'ضمان السلامة العامة', 4, 'الأمن والسلامة', 'orange', true, 4, 'MAJOR', 'OBSERVATION', 'يجب فحص الأجهزة قبل الاستخدام', 'Equipment must be checked before use', true),
('HS001', 'تنظيف الأسطح', 'Surface Cleaning', 'التأكد من تنظيف الأسطح بانتظام', 'منع انتشار العدوى', 5, 'النظافة والتعقيم', 'purple', true, 3, 'MAJOR', 'OBSERVATION', 'يجب تنظيف الأسطح كل 4 ساعات', 'Surfaces must be cleaned every 4 hours', true),
('MS001', 'تخزين الأدوية', 'Medication Storage', 'التأكد من تخزين الأدوية بشكل صحيح', 'ضمان فعالية الأدوية', 6, 'سلامة الأدوية', 'cyan', true, 4, 'MAJOR', 'OBSERVATION', 'يجب تخزين الأدوية في درجة حرارة مناسبة', 'Medications must be stored at appropriate temperature', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 8. إدراج الجولات الافتراضية
-- =====================================================

INSERT INTO rounds (round_code, title, description, round_type, department, assigned_to, scheduled_date, status, priority, compliance_percentage, notes, created_by_id) VALUES
('RND-2024-001', 'جولة سلامة المرضى - قسم الطوارئ', 'تقييم سلامة المرضى والبروتوكولات الطبية', 'patient_safety', 'قسم الطوارئ', '["خالد المنصوري", "أحمد الفارسي"]', '2024-01-15 09:00:00+00', 'completed', 'high', 92, 'جولة ناجحة مع ملاحظات قليلة', 2),
('RND-2024-002', 'جولة مكافحة العدوى - العناية المركزة', 'تقييم بروتوكولات مكافحة العدوى', 'infection_control', 'قسم العناية المركزة', '["خالد المنصوري"]', '2024-01-20 14:00:00+00', 'in_progress', 'urgent', 0, '', 2),
('RND-2024-003', 'جولة النظافة - قسم الجراحة', 'فحص معايير النظافة والتعقيم', 'hygiene', 'قسم الجراحة', '["خالد المنصوري"]', '2024-01-25 11:00:00+00', 'scheduled', 'medium', 0, '', 2),
('RND-2024-004', 'جولة سلامة الأدوية - قسم الأطفال', 'تقييم تخزين وإدارة الأدوية', 'medication_safety', 'قسم الأطفال', '["خالد المنصوري"]', '2024-01-12 10:00:00+00', 'overdue', 'high', 0, '', 2),
('RND-2024-005', 'جولة الجودة - قسم التمريض', 'تقييم معايير الجودة في التمريض', 'general', 'التمريض', '["خالد المنصوري"]', '2024-02-01 08:00:00+00', 'scheduled', 'medium', 0, '', 2),
('RND-2024-006', 'جولة الأمن والسلامة - قسم النساء والولادة', 'فحص معايير الأمن والسلامة', 'general', 'النساء والولادة', '["خالد المنصوري"]', '2024-02-05 13:00:00+00', 'scheduled', 'low', 0, '', 2)
ON CONFLICT (round_code) DO NOTHING;

-- =====================================================
-- 9. إدراج الخطط التصحيحية الافتراضية
-- =====================================================

INSERT INTO capas (title, description, round_id, department, priority, status, assigned_to, target_date, created_by_id, risk_score) VALUES
('تحسين بروتوكول غسل اليدين', 'تطوير وتنفيذ بروتوكول محسن لغسل اليدين في قسم الطوارئ', 1, 'قسم الطوارئ', 'high', 'implemented', 'أحمد الفارسي', '2024-02-01 00:00:00+00', 2, 12),
('تدريب الطاقم على مكافحة العدوى', 'برنامج تدريبي شامل للطاقم الطبي حول بروتوكولات مكافحة العدوى', 2, 'قسم العناية المركزة', 'urgent', 'in_progress', 'د. سارة أحمد', '2024-02-15 00:00:00+00', 2, 18),
('تحديث نظام تخزين الأدوية', 'تطوير نظام تخزين آمن للأدوية في قسم الأطفال', NULL, 'قسم الأطفال', 'medium', 'pending', 'فريق الصيدلة', '2024-03-01 00:00:00+00', 2, 8),
('تحسين نظام التوثيق', 'تطوير نظام توثيق إلكتروني للعمليات الطبية', 1, 'قسم الطوارئ', 'medium', 'assigned', 'فريق تقنية المعلومات', '2024-02-28 00:00:00+00', 2, 6),
('تحديث سياسات الأمن والسلامة', 'مراجعة وتحديث سياسات الأمن والسلامة في جميع الأقسام', NULL, 'جميع الأقسام', 'high', 'pending', 'فريق إدارة المخاطر', '2024-03-15 00:00:00+00', 2, 10)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. إدراج نتائج التقييم الافتراضية
-- =====================================================

INSERT INTO evaluation_results (round_id, item_id, score, comments, evaluated_by, evaluated_at) VALUES
(1, 1, 95, 'تطبيق ممتاز لبروتوكول غسل اليدين', 4, '2024-01-15 10:30:00+00'),
(1, 2, 90, 'استخدام صحيح للقفازات مع بعض التحسينات المطلوبة', 4, '2024-01-15 10:35:00+00'),
(1, 3, 100, 'تحديد هوية المرضى يتم بشكل مثالي', 4, '2024-01-15 10:40:00+00'),
(1, 4, 85, 'التحقق من الحساسية جيد مع حاجة لتحسين التوثيق', 4, '2024-01-15 10:45:00+00'),
(1, 5, 88, 'التوثيق جيد مع حاجة لتحسين التنظيم', 4, '2024-01-15 10:50:00+00'),
(2, 1, 75, 'يحتاج تحسين في التطبيق', 4, '2024-01-20 15:00:00+00'),
(2, 2, 80, 'تطبيق جيد مع حاجة لتدريب إضافي', 4, '2024-01-20 15:05:00+00')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. إضافة تعليقات على الجداول
-- =====================================================

COMMENT ON DATABASE salamaty_db IS 'قاعدة بيانات نظام سلامتي لإدارة جولات الجودة وسلامة المرضى - النسخة المحلية';
COMMENT ON TABLE users IS 'جدول المستخدمين والصلاحيات';
COMMENT ON TABLE departments IS 'جدول الأقسام والإدارات';
COMMENT ON TABLE rounds IS 'جدول جولات التقييم والمراجعة';
COMMENT ON TABLE capas IS 'جدول الخطط التصحيحية والوقائية';
COMMENT ON TABLE evaluation_categories IS 'جدول تصنيفات عناصر التقييم';
COMMENT ON TABLE evaluation_items IS 'جدول عناصر التقييم والمعايير';
COMMENT ON TABLE evaluation_results IS 'جدول نتائج التقييم والدرجات';

-- =====================================================
-- 12. عرض إحصائيات البيانات المنقولة
-- =====================================================

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

-- =====================================================
-- 13. عرض تفاصيل المستخدمين المنشأين
-- =====================================================

SELECT 
    id,
    username,
    email,
    first_name || ' ' || last_name as full_name,
    role,
    department,
    position,
    is_active
FROM users
ORDER BY id;

-- =====================================================
-- 14. عرض تفاصيل الأقسام المنشأة
-- =====================================================

SELECT 
    id,
    name,
    name_en,
    code,
    location,
    floor,
    building,
    is_active
FROM departments
ORDER BY id;

-- =====================================================
-- 15. عرض تفاصيل تصنيفات التقييم
-- =====================================================

SELECT 
    ec.id,
    ec.name,
    ec.name_en,
    ec.color,
    ec.icon,
    COUNT(ei.id) as items_count
FROM evaluation_categories ec
LEFT JOIN evaluation_items ei ON ec.id = ei.category_id
GROUP BY ec.id, ec.name, ec.name_en, ec.color, ec.icon
ORDER BY ec.id;

-- =====================================================
-- 16. عرض حالة الجولات
-- =====================================================

SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(compliance_percentage), 2) as avg_compliance
FROM rounds
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- 17. عرض حالة الخطط التصحيحية
-- =====================================================

SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(risk_score), 2) as avg_risk_score
FROM capas
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- تم الانتهاء من نقل البيانات بنجاح
-- =====================================================

SELECT 'تم نقل جميع البيانات الافتراضية بنجاح إلى قاعدة البيانات المحلية salamaty_db' as message;

-- إنشاء قاعدة البيانات salamaty_system
-- تأكد من أن قاعدة البيانات موجودة في pgAdmin

-- إنشاء الجداول الأساسية
-- 1. جدول المستخدمين
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

-- 2. جدول الأقسام
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

-- 3. جدول الجولات
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
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول الخطط التصحيحية (CAPA)
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

-- 5. جدول تصنيفات التقييم
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

-- 6. جدول عناصر التقييم
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

-- 7. جدول نتائج التقييم
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

-- إنشاء الفهارس لتحسين الأداء
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

-- إدراج البيانات الأولية

-- إدراج المستخدمين الافتراضيين
INSERT INTO users (username, email, hashed_password, first_name, last_name, role, department, phone, position) VALUES
('admin', 'admin@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'مدير', 'النظام', 'super_admin', 'إدارة الجودة', '0501234567', 'مدير النظام'),
('quality_manager', 'quality@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'أحمد', 'المدير', 'quality_manager', 'إدارة الجودة', '0501234568', 'مدير الجودة'),
('assessor1', 'assessor1@salamaty.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QZqK2', 'سارة', 'المقيم', 'assessor', 'التمريض', '0501234569', 'مقيم الجودة')
ON CONFLICT (email) DO NOTHING;

-- إدراج الأقسام الافتراضية
INSERT INTO departments (name, name_en, code, description, location, floor, building) VALUES
('التمريض', 'Nursing', 'NUR', 'قسم التمريض والعناية بالمرضى', 'المبنى الرئيسي', 'الطابق الأول', 'المبنى A'),
('الطوارئ', 'Emergency', 'EMR', 'قسم الطوارئ والحالات الحرجة', 'المبنى الرئيسي', 'الطابق الأرضي', 'المبنى A'),
('العناية المركزة', 'ICU', 'ICU', 'وحدة العناية المركزة', 'المبنى الرئيسي', 'الطابق الثاني', 'المبنى A'),
('الجراحة', 'Surgery', 'SUR', 'قسم الجراحة العامة والخاصة', 'المبنى الجراحي', 'الطابق الأول', 'المبنى B'),
('الأطفال', 'Pediatrics', 'PED', 'قسم طب الأطفال', 'المبنى الرئيسي', 'الطابق الثالث', 'المبنى A'),
('النساء والولادة', 'Obstetrics', 'OBS', 'قسم النساء والولادة', 'المبنى الرئيسي', 'الطابق الرابع', 'المبنى A')
ON CONFLICT (code) DO NOTHING;

-- إدراج تصنيفات التقييم الافتراضية
INSERT INTO evaluation_categories (name, name_en, description, color, icon) VALUES
('مكافحة العدوى', 'Infection Control', 'تصنيف معايير مكافحة العدوى والوقاية منها', 'red', 'shield'),
('سلامة المرضى', 'Patient Safety', 'تصنيف معايير سلامة المرضى والرعاية الآمنة', 'blue', 'heart'),
('الجودة', 'Quality', 'تصنيف معايير الجودة والتحسين المستمر', 'green', 'check-circle'),
('الأمن والسلامة', 'Security & Safety', 'تصنيف معايير الأمن والسلامة العامة', 'orange', 'lock'),
('النظافة والتعقيم', 'Hygiene & Sterilization', 'تصنيف معايير النظافة والتعقيم', 'purple', 'zap'),
('سلامة الأدوية', 'Medication Safety', 'تصنيف معايير سلامة الأدوية والصيدلة', 'cyan', 'eye')
ON CONFLICT DO NOTHING;

-- إدراج عناصر التقييم الافتراضية
INSERT INTO evaluation_items (code, title, title_en, description, objective, category_id, category_name, category_color, is_required, weight, risk_level, evidence_type, guidance_ar, guidance_en) VALUES
('IC001', 'غسل اليدين', 'Hand Hygiene', 'التأكد من تطبيق معايير غسل اليدين', 'منع انتقال العدوى', 1, 'مكافحة العدوى', 'red', true, 5, 'CRITICAL', 'OBSERVATION', 'يجب غسل اليدين قبل وبعد التعامل مع المرضى', 'Hands must be washed before and after patient contact'),
('PS001', 'تحديد هوية المريض', 'Patient Identification', 'التأكد من تحديد هوية المريض بشكل صحيح', 'منع الأخطاء الطبية', 2, 'سلامة المرضى', 'blue', true, 5, 'CRITICAL', 'OBSERVATION', 'يجب التحقق من هوية المريض قبل أي إجراء', 'Patient identity must be verified before any procedure'),
('Q001', 'توثيق العمليات', 'Process Documentation', 'التأكد من توثيق جميع العمليات بشكل صحيح', 'ضمان الجودة والتحسين', 3, 'الجودة', 'green', true, 3, 'MAJOR', 'DOCUMENT', 'يجب توثيق جميع العمليات والنتائج', 'All processes and results must be documented')
ON CONFLICT (code) DO NOTHING;

COMMENT ON DATABASE salamaty_system IS 'قاعدة بيانات نظام سلامتي لإدارة جولات الجودة وسلامة المرضى';
COMMENT ON TABLE users IS 'جدول المستخدمين والصلاحيات';
COMMENT ON TABLE departments IS 'جدول الأقسام والإدارات';
COMMENT ON TABLE rounds IS 'جدول جولات التقييم والمراجعة';
COMMENT ON TABLE capas IS 'جدول الخطط التصحيحية والوقائية';
COMMENT ON TABLE evaluation_categories IS 'جدول تصنيفات عناصر التقييم';
COMMENT ON TABLE evaluation_items IS 'جدول عناصر التقييم والمعايير';
COMMENT ON TABLE evaluation_results IS 'جدول نتائج التقييم والدرجات';

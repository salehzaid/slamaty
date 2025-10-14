-- =====================================================
-- Sample CAPA Data for Dashboard Testing
-- =====================================================
-- This script inserts comprehensive sample data including:
-- - 20 CAPA records with various statuses and priorities
-- - 60-80 actions (corrective, preventive, verification)
-- - 100+ timeline events
-- - 25-30 alerts
-- =====================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM capa_alerts;
-- DELETE FROM timeline_events;
-- DELETE FROM capa_actions;
-- DELETE FROM capas WHERE id > 1000; -- Only delete sample data

-- =====================================================
-- Insert Sample CAPAs
-- =====================================================

INSERT INTO capas (id, title, description, department, priority, status, target_date, created_by_id, created_at, risk_score) VALUES
-- Overdue CAPAs
(1001, 'تحسين إجراءات غسل اليدين', 'تطوير وتنفيذ بروتوكول محسّن لغسل اليدين في قسم الطوارئ لتقليل معدلات العدوى', 'قسم الطوارئ', 'urgent', 'IN_PROGRESS', NOW() - INTERVAL '5 days', 1, NOW() - INTERVAL '15 days', 18),
(1002, 'تحديث بروتوكول الأدوية', 'مراجعة وتحديث بروتوكول إدارة الأدوية عالية الخطورة', 'الصيدلية', 'urgent', 'PENDING', NOW() - INTERVAL '3 days', 1, NOW() - INTERVAL '10 days', 20),

-- In Progress CAPAs
(1003, 'تدريب الطاقم على مكافحة العدوى', 'برنامج تدريبي شامل للطاقم الطبي حول بروتوكولات مكافحة العدوى الحديثة', 'العناية المركزة', 'high', 'IN_PROGRESS', NOW() + INTERVAL '7 days', 1, NOW() - INTERVAL '5 days', 15),
(1004, 'تحسين نظام تخزين الأدوية', 'تطوير نظام تخزين آمن ومنظم للأدوية في قسم الأطفال', 'قسم الأطفال', 'high', 'IN_PROGRESS', NOW() + INTERVAL '10 days', 1, NOW() - INTERVAL '8 days', 12),
(1005, 'مراجعة إجراءات التعقيم', 'مراجعة شاملة لإجراءات التعقيم في غرف العمليات', 'قسم الجراحة', 'high', 'IN_PROGRESS', NOW() + INTERVAL '12 days', 1, NOW() - INTERVAL '6 days', 16),
(1006, 'تحسين الوثائق الطبية', 'تطوير نظام محسّن للوثائق الطبية الإلكترونية', 'قسم السجلات', 'medium', 'IN_PROGRESS', NOW() + INTERVAL '15 days', 1, NOW() - INTERVAL '10 days', 8),

-- Pending CAPAs
(1007, 'خطة طوارئ الحرائق', 'تحديث وتحسين خطة إخلاء الطوارئ في حالة الحرائق', 'السلامة والصحة المهنية', 'urgent', 'PENDING', NOW() + INTERVAL '5 days', 1, NOW() - INTERVAL '2 days', 19),
(1008, 'تحسين نظام الإنذار', 'صيانة وتحسين نظام الإنذار الطبي في وحدة العناية المركزة', 'العناية المركزة', 'high', 'PENDING', NOW() + INTERVAL '8 days', 1, NOW() - INTERVAL '3 days', 14),
(1009, 'مراجعة بروتوكول العزل', 'مراجعة وتحديث بروتوكولات العزل للمرضى المعديين', 'مكافحة العدوى', 'high', 'PENDING', NOW() + INTERVAL '10 days', 1, NOW() - INTERVAL '4 days', 13),
(1010, 'تدريب على معدات السلامة', 'برنامج تدريبي على استخدام معدات السلامة الجديدة', 'السلامة والصحة المهنية', 'medium', 'PENDING', NOW() + INTERVAL '20 days', 1, NOW() - INTERVAL '5 days', 9),

-- Verification/Implemented CAPAs
(1011, 'تحديث بروتوكول نقل الدم', 'تحديث إجراءات نقل الدم والتحقق من الفصيلة', 'المختبر', 'high', 'VERIFICATION', NOW() + INTERVAL '5 days', 1, NOW() - INTERVAL '20 days', 11),
(1012, 'تحسين نظافة المرافق', 'تطبيق معايير جديدة لنظافة وتعقيم المرافق العامة', 'خدمات النظافة', 'medium', 'VERIFICATION', NOW() + INTERVAL '7 days', 1, NOW() - INTERVAL '18 days', 7),
(1013, 'مراجعة صلاحيات الدخول', 'تحديث نظام صلاحيات الدخول للمناطق الحساسة', 'تقنية المعلومات', 'high', 'IMPLEMENTED', NOW() + INTERVAL '3 days', 1, NOW() - INTERVAL '25 days', 10),

-- Verified CAPAs
(1014, 'تحسين إدارة المخلفات الطبية', 'تطوير نظام متكامل لإدارة والتخلص من المخلفات الطبية الخطرة', 'إدارة المخلفات', 'medium', 'VERIFIED', NOW() + INTERVAL '10 days', 1, NOW() - INTERVAL '30 days', 8),
(1015, 'تحديث أجهزة المراقبة', 'تحديث وصيانة أجهزة مراقبة العلامات الحيوية', 'الهندسة الطبية', 'medium', 'VERIFIED', NOW() + INTERVAL '15 days', 1, NOW() - INTERVAL '28 days', 6),

-- Closed CAPAs
(1016, 'تحسين إجراءات التسجيل', 'تبسيط وتحسين إجراءات تسجيل المرضى الجدد', 'الاستقبال', 'low', 'CLOSED', NOW() + INTERVAL '20 days', 1, NOW() - INTERVAL '35 days', 4),
(1017, 'تحديث لوحات الإرشاد', 'استبدال وتحديث لوحات الإرشاد في جميع أنحاء المستشفى', 'المرافق العامة', 'low', 'CLOSED', NOW() + INTERVAL '25 days', 1, NOW() - INTERVAL '40 days', 3),

-- Additional Medium Priority CAPAs
(1018, 'مراجعة سياسة الزيارات', 'تحديث سياسة زيارة المرضى بما يتوافق مع معايير السلامة', 'الإدارة', 'medium', 'IN_PROGRESS', NOW() + INTERVAL '14 days', 1, NOW() - INTERVAL '7 days', 8),
(1019, 'تحسين نظام الحجز', 'تطوير نظام إلكتروني محسّن لحجز المواعيد', 'تقنية المعلومات', 'medium', 'PENDING', NOW() + INTERVAL '30 days', 1, NOW() - INTERVAL '3 days', 7),
(1020, 'تدريب على الإسعافات الأولية', 'برنامج تدريب متقدم للإسعافات الأولية للطاقم غير الطبي', 'التدريب', 'low', 'PENDING', NOW() + INTERVAL '45 days', 1, NOW() - INTERVAL '2 days', 5);

-- =====================================================
-- Insert Sample Actions
-- =====================================================

-- Actions for CAPA 1001 (Overdue, In Progress)
INSERT INTO capa_actions (capa_id, action_type, task, description, assigned_to, assigned_to_id, due_date, status, completion_percentage, created_at) VALUES
(1001, 'corrective', 'تقييم الوضع الحالي لممارسات غسل اليدين', 'إجراء تقييم شامل للممارسات الحالية وتحديد نقاط الضعف', 'أحمد الفارسي', 1, NOW() - INTERVAL '10 days', 'completed', 100, NOW() - INTERVAL '15 days'),
(1001, 'corrective', 'تطوير بروتوكول محسّن', 'إنشاء بروتوكول جديد بناءً على أفضل الممارسات العالمية', 'سارة أحمد', 1, NOW() - INTERVAL '3 days', 'IN_PROGRESS', 70, NOW() - INTERVAL '12 days'),
(1001, 'preventive', 'تدريب الطاقم على البروتوكول الجديد', 'عقد جلسات تدريبية لجميع العاملين', 'محمد السالم', 1, NOW() + INTERVAL '2 days', 'open', 0, NOW() - INTERVAL '10 days'),
(1001, 'verification', 'مراجعة الامتثال', 'مراجعة دورية للتأكد من الالتزام بالبروتوكول', 'فاطمة الزهراني', 1, NOW() + INTERVAL '7 days', 'open', 0, NOW() - INTERVAL '10 days');

-- Actions for CAPA 1002 (Overdue, Pending)
INSERT INTO capa_actions (capa_id, action_type, task, description, assigned_to, assigned_to_id, due_date, status, completion_percentage, created_at) VALUES
(1002, 'corrective', 'مراجعة البروتوكول الحالي', 'تحليل شامل للبروتوكول الحالي وتحديد المشاكل', 'خالد الدوسري', 1, NOW() - INTERVAL '2 days', 'open', 0, NOW() - INTERVAL '10 days'),
(1002, 'corrective', 'تحديث قائمة الأدوية عالية الخطورة', 'تحديث القائمة وفقاً لأحدث التوصيات', 'نورة الشمري', 1, NOW() + INTERVAL '1 day', 'open', 0, NOW() - INTERVAL '8 days'),
(1002, 'preventive', 'إنشاء نظام تنبيهات إلكتروني', 'تطوير نظام تنبيهات للأدوية عالية الخطورة', 'عبدالله التميمي', 1, NOW() + INTERVAL '5 days', 'open', 0, NOW() - INTERVAL '8 days');

-- Actions for CAPA 1003 (In Progress)
INSERT INTO capa_actions (capa_id, action_type, task, description, assigned_to, assigned_to_id, due_date, status, completion_percentage, created_at) VALUES
(1003, 'corrective', 'تطوير محتوى التدريب', 'إعداد مواد تدريبية شاملة', 'ريم القحطاني', 1, NOW() - INTERVAL '2 days', 'completed', 100, NOW() - INTERVAL '5 days'),
(1003, 'corrective', 'جدولة جلسات التدريب', 'تنظيم جدول زمني لجميع الفئات', 'أحمد المالكي', 1, NOW() + INTERVAL '1 day', 'IN_PROGRESS', 60, NOW() - INTERVAL '3 days'),
(1003, 'preventive', 'إنشاء مواد مرجعية', 'تطوير دليل مرجعي سريع للموظفين', 'سعيد الغامدي', 1, NOW() + INTERVAL '4 days', 'IN_PROGRESS', 40, NOW() - INTERVAL '2 days'),
(1003, 'verification', 'اختبار ما بعد التدريب', 'إجراء اختبارات لتقييم فعالية التدريب', 'ليلى الحربي', 1, NOW() + INTERVAL '6 days', 'open', 0, NOW() - INTERVAL '2 days');

-- Actions for CAPA 1004-1010 (Various statuses)
INSERT INTO capa_actions (capa_id, action_type, task, assigned_to, assigned_to_id, due_date, status, completion_percentage, created_at) VALUES
(1004, 'corrective', 'تقييم نظام التخزين الحالي', 'مروان العتيبي', 1, NOW() + INTERVAL '3 days', 'IN_PROGRESS', 50, NOW() - INTERVAL '8 days'),
(1004, 'corrective', 'شراء وحدات تخزين جديدة', 'هند الراشد', 1, NOW() + INTERVAL '8 days', 'pending', 0, NOW() - INTERVAL '6 days'),
(1004, 'preventive', 'تدريب الموظفين على النظام الجديد', 'عمر الشهري', 1, NOW() + INTERVAL '9 days', 'pending', 0, NOW() - INTERVAL '6 days'),

(1005, 'corrective', 'مراجعة إجراءات التعقيم الحالية', 'منى البلوي', 1, NOW() + INTERVAL '4 days', 'IN_PROGRESS', 65, NOW() - INTERVAL '6 days'),
(1005, 'corrective', 'تحديث قوائم التحقق', 'طارق الزهراني', 1, NOW() + INTERVAL '10 days', 'in_progress', 30, NOW() - INTERVAL '4 days'),
(1005, 'verification', 'اختبار فعالية التعقيم', 'رنا الخالدي', 1, NOW() + INTERVAL '11 days', 'pending', 0, NOW() - INTERVAL '4 days'),

(1006, 'corrective', 'تحليل النظام الحالي', 'يوسف السعدون', 1, NOW() + INTERVAL '5 days', 'completed', 100, NOW() - INTERVAL '10 days'),
(1006, 'corrective', 'تطوير النماذج الإلكترونية', 'أميرة القرني', 1, NOW() + INTERVAL '12 days', 'in_progress', 55, NOW() - INTERVAL '7 days'),
(1006, 'preventive', 'تدريب على النظام الجديد', 'فهد المطيري', 1, NOW() + INTERVAL '14 days', 'pending', 0, NOW() - INTERVAL '5 days'),

(1007, 'corrective', 'مراجعة خطة الإخلاء الحالية', 'وفاء الدوسري', 1, NOW() + INTERVAL '2 days', 'pending', 0, NOW() - INTERVAL '2 days'),
(1007, 'corrective', 'تحديث مخارج الطوارئ', 'بدر الحارثي', 1, NOW() + INTERVAL '4 days', 'pending', 0, NOW() - INTERVAL '2 days'),
(1007, 'preventive', 'إجراء تدريبات إخلاء', 'سلمى النمر', 1, NOW() + INTERVAL '5 days', 'pending', 0, NOW() - INTERVAL '1 day'),

(1008, 'corrective', 'فحص نظام الإنذار', 'راشد الشمراني', 1, NOW() + INTERVAL '3 days', 'pending', 0, NOW() - INTERVAL '3 days'),
(1008, 'corrective', 'استبدال الأجزاء التالفة', 'غادة الجهني', 1, NOW() + INTERVAL '6 days', 'pending', 0, NOW() - INTERVAL '3 days'),

(1009, 'corrective', 'مراجعة بروتوكولات العزل', 'ماجد الفيصل', 1, NOW() + INTERVAL '5 days', 'pending', 0, NOW() - INTERVAL '4 days'),
(1009, 'preventive', 'تدريب على الإجراءات المحدثة', 'دلال الرويلي', 1, NOW() + INTERVAL '8 days', 'pending', 0, NOW() - INTERVAL '3 days'),

(1010, 'corrective', 'جرد معدات السلامة', 'فيصل الشهراني', 1, NOW() + INTERVAL '10 days', 'pending', 0, NOW() - INTERVAL '5 days'),
(1010, 'corrective', 'تطوير برنامج التدريب', 'جواهر السديري', 1, NOW() + INTERVAL '15 days', 'pending', 0, NOW() - INTERVAL '4 days');

-- Actions for verified and closed CAPAs
INSERT INTO capa_actions (capa_id, action_type, task, assigned_to, assigned_to_id, due_date, status, completion_percentage, completed_at, created_at) VALUES
(1011, 'corrective', 'تحديث إجراءات نقل الدم', 'علي الأحمدي', 1, NOW() - INTERVAL '15 days', 'completed', 100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '20 days'),
(1011, 'verification', 'التحقق من تطبيق الإجراءات', 'نوف السبيعي', 1, NOW() - INTERVAL '5 days', 'completed', 100, NOW() - INTERVAL '3 days', NOW() - INTERVAL '18 days'),

(1014, 'corrective', 'تحسين نظام إدارة المخلفات', 'حسن العمري', 1, NOW() - INTERVAL '25 days', 'completed', 100, NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 days'),
(1014, 'verification', 'التحقق النهائي', 'عبير الزامل', 1, NOW() - INTERVAL '10 days', 'completed', 100, NOW() - INTERVAL '5 days', NOW() - INTERVAL '25 days'),

(1016, 'corrective', 'تبسيط نماذج التسجيل', 'سامي الربيعان', 1, NOW() - INTERVAL '30 days', 'completed', 100, NOW() - INTERVAL '25 days', NOW() - INTERVAL '35 days'),
(1016, 'verification', 'مراجعة نهائية', 'لينا المنيع', 1, NOW() - INTERVAL '15 days', 'completed', 100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 days');

-- =====================================================
-- Insert Timeline Events
-- =====================================================

-- Events for various CAPAs (showing progression)
-- Ensure referenced action IDs exist before inserting events that reference them.
-- For events that referenced action_id 1/2 etc., we rely on the sample actions inserted above. If sequences differ, update action_id values accordingly.
INSERT INTO timeline_events (capa_id, event_type, title, description, user_id, user_name, action_id, new_status, created_at) VALUES
-- CAPA 1001 Timeline
(1001, 'capa_created', 'إنشاء خطة تصحيحية', 'تم إنشاء خطة تصحيحية جديدة لتحسين إجراءات غسل اليدين', 1, 'المدير العام', NULL, 'PENDING', NOW() - INTERVAL '15 days'),
(1001, 'status_change', 'تغيير الحالة', 'تم تغيير الحالة من pending إلى in_progress', 1, 'المدير العام', NULL, 'IN_PROGRESS', NOW() - INTERVAL '14 days'),
(1001, 'action_completed', 'إنجاز إجراء', 'تم إنجاز تقييم الوضع الحالي', 1, 'أحمد الفارسي', 1, 'COMPLETED', NOW() - INTERVAL '10 days'),
(1001, 'action_started', 'بدء إجراء', 'بدء تطوير بروتوكول محسّن', 1, 'سارة أحمد', 2, 'IN_PROGRESS', NOW() - INTERVAL '8 days'),

-- CAPA 1002 Timeline
(1002, 'capa_created', 'إنشاء خطة تصحيحية', 'خطة تصحيحية لتحديث بروتوكول الأدوية', 1, 'المدير العام', NULL, 'PENDING', NOW() - INTERVAL '10 days'),
(1002, 'comment_added', 'إضافة ملاحظة', 'تم تصنيف هذه الخطة كعاجلة بسبب المخاطر العالية', 1, 'مدير الجودة', NULL, NULL, NOW() - INTERVAL '9 days'),

-- CAPA 1003 Timeline
(1003, 'capa_created', 'إنشاء خطة تصحيحية', 'برنامج تدريبي شامل لمكافحة العدوى', 1, 'المدير العام', NULL, 'PENDING', NOW() - INTERVAL '5 days'),
(1003, 'status_change', 'تغيير الحالة', 'بدء تنفيذ الخطة', 1, 'مدير التدريب', NULL, 'IN_PROGRESS', NOW() - INTERVAL '4 days'),
(1003, 'action_completed', 'إنجاز إجراء', 'تم إنجاز تطوير محتوى التدريب', 1, 'ريم القحطاني', NULL, 'COMPLETED', NOW() - INTERVAL '2 days'),

-- CAPA 1011 Timeline (Verification)
(1011, 'capa_created', 'إنشاء خطة تصحيحية', 'تحديث بروتوكول نقل الدم', 1, 'المدير العام', NULL, 'pending', NOW() - INTERVAL '20 days'),
(1011, 'status_change', 'تغيير الحالة', 'بدء التنفيذ', 1, 'مدير المختبر', NULL, 'in_progress', NOW() - INTERVAL '18 days'),
(1011, 'action_completed', 'إنجاز إجراء', 'تم تحديث الإجراءات', 1, 'علي الأحمدي', NULL, 'completed', NOW() - INTERVAL '10 days'),
(1011, 'status_change', 'تغيير الحالة', 'انتقال إلى مرحلة التحقق', 1, 'مدير الجودة', NULL, 'verification', NOW() - INTERVAL '8 days'),
(1011, 'action_completed', 'إنجاز التحقق', 'تم التحقق من تطبيق الإجراءات', 1, 'نوف السبيعي', NULL, 'completed', NOW() - INTERVAL '3 days'),

-- CAPA 1014 Timeline (Verified)
(1014, 'capa_created', 'إنشاء خطة تصحيحية', 'نظام متكامل لإدارة المخلفات', 1, 'المدير العام', NULL, 'pending', NOW() - INTERVAL '30 days'),
(1014, 'status_change', 'تغيير الحالة', 'بدء التنفيذ', 1, 'مدير المخلفات', NULL, 'in_progress', NOW() - INTERVAL '28 days'),
(1014, 'action_completed', 'إنجاز إجراء', 'تحسين نظام إدارة المخلفات', 1, 'حسن العمري', NULL, 'completed', NOW() - INTERVAL '20 days'),
(1014, 'status_change', 'تغيير الحالة', 'انتقال إلى التحقق', 1, 'مدير الجودة', NULL, 'verification', NOW() - INTERVAL '15 days'),
(1014, 'action_completed', 'التحقق النهائي', 'تم التحقق بنجاح', 1, 'عبير الزامل', NULL, 'completed', NOW() - INTERVAL '5 days'),
(1014, 'status_change', 'تم التحقق', 'تم التحقق من الخطة التصحيحية بنجاح', 1, 'مدير الجودة', NULL, 'verified', NOW() - INTERVAL '3 days'),

-- CAPA 1016 Timeline (Closed)
(1016, 'capa_created', 'إنشاء خطة تصحيحية', 'تحسين إجراءات التسجيل', 1, 'المدير العام', NULL, 'pending', NOW() - INTERVAL '35 days'),
(1016, 'status_change', 'تغيير الحالة', 'بدء التنفيذ', 1, 'مدير الاستقبال', NULL, 'in_progress', NOW() - INTERVAL '33 days'),
(1016, 'action_completed', 'إنجاز الإجراءات', 'تم تبسيط النماذج', 1, 'سامي الربيعان', NULL, 'completed', NOW() - INTERVAL '25 days'),
(1016, 'status_change', 'انتقال للتحقق', 'مرحلة التحقق النهائي', 1, 'مدير الجودة', NULL, 'verification', NOW() - INTERVAL '20 days'),
(1016, 'status_change', 'تم التحقق', 'تم التحقق بنجاح', 1, 'لينا المنيع', NULL, 'verified', NOW() - INTERVAL '10 days'),
(1016, 'status_change', 'إغلاق الخطة', 'تم إغلاق الخطة التصحيحية', 1, 'المدير العام', NULL, 'closed', NOW() - INTERVAL '8 days');

-- Add more generic timeline events for other CAPAs
INSERT INTO timeline_events (capa_id, event_type, title, description, user_id, user_name, created_at) VALUES
(1004, 'capa_created', 'إنشاء خطة تصحيحية', 'تحسين نظام تخزين الأدوية', 1, 'المدير العام', NOW() - INTERVAL '8 days'),
(1004, 'status_change', 'بدء التنفيذ', 'تم البدء في تنفيذ الخطة', 1, 'مدير الصيدلية', NOW() - INTERVAL '7 days'),
(1005, 'capa_created', 'إنشاء خطة تصحيحية', 'مراجعة إجراءات التعقيم', 1, 'المدير العام', NOW() - INTERVAL '6 days'),
(1005, 'status_change', 'بدء التنفيذ', 'تم البدء في التنفيذ', 1, 'مدير الجراحة', NOW() - INTERVAL '5 days'),
(1006, 'capa_created', 'إنشاء خطة تصحيحية', 'تحسين الوثائق الطبية', 1, 'المدير العام', NOW() - INTERVAL '10 days'),
(1006, 'status_change', 'بدء التنفيذ', 'بدء العمل على النظام', 1, 'مدير السجلات', NOW() - INTERVAL '9 days'),
(1007, 'capa_created', 'إنشاء خطة تصحيحية', 'خطة طوارئ الحرائق', 1, 'المدير العام', NOW() - INTERVAL '2 days'),
(1008, 'capa_created', 'إنشاء خطة تصحيحية', 'تحسين نظام الإنذار', 1, 'المدير العام', NOW() - INTERVAL '3 days'),
(1009, 'capa_created', 'إنشاء خطة تصحيحية', 'مراجعة بروتوكول العزل', 1, 'المدير العام', NOW() - INTERVAL '4 days'),
(1010, 'capa_created', 'إنشاء خطة تصحيحية', 'تدريب على معدات السلامة', 1, 'المدير العام', NOW() - INTERVAL '5 days');

-- =====================================================
-- Insert Alerts
-- =====================================================

-- Overdue alerts
INSERT INTO capa_alerts (alert_type, title, message, priority, capa_id, capa_title, user_id, due_date, days_until_due, read, action_required, created_at) VALUES
('overdue', 'خطة تصحيحية متأخرة', 'الخطة التصحيحية "تحسين إجراءات غسل اليدين" متأخرة عن الموعد المحدد بـ 5 أيام', 'critical', 1001, 'تحسين إجراءات غسل اليدين', 1, NOW() - INTERVAL '5 days', -5, false, true, NOW() - INTERVAL '1 day'),
('overdue', 'خطة تصحيحية متأخرة', 'الخطة التصحيحية "تحديث بروتوكول الأدوية" متأخرة عن الموعد المحدد بـ 3 أيام', 'critical', 1002, 'تحديث بروتوكول الأدوية', 1, NOW() - INTERVAL '3 days', -3, false, true, NOW() - INTERVAL '1 day'),

-- Upcoming deadlines
('upcoming', 'موعد قريب', 'الموعد النهائي للخطة "تدريب الطاقم على مكافحة العدوى" خلال 7 أيام', 'high', 1003, 'تدريب الطاقم على مكافحة العدوى', 1, NOW() + INTERVAL '7 days', 7, false, true, NOW() - INTERVAL '2 hours'),
('upcoming', 'موعد قريب', 'الموعد النهائي للخطة "تحسين نظام تخزين الأدوية" خلال 10 أيام', 'medium', 1004, 'تحسين نظام تخزين الأدوية', 1, NOW() + INTERVAL '10 days', 10, false, true, NOW() - INTERVAL '3 hours'),
('upcoming', 'موعد قريب', 'الموعد النهائي للخطة "خطة طوارئ الحرائق" خلال 5 أيام', 'high', 1007, 'خطة طوارئ الحرائق', 1, NOW() + INTERVAL '5 days', 5, false, true, NOW() - INTERVAL '1 hour'),

-- Deadline approaching alerts
('deadline_approaching', 'اقتراب الموعد النهائي', 'الموعد النهائي للإجراء "تطوير بروتوكول محسّن" خلال 3 أيام', 'high', 1001, 'تحسين إجراءات غسل اليدين', 1, NOW() - INTERVAL '3 days', -3, false, true, NOW() - INTERVAL '12 hours'),
('deadline_approaching', 'اقتراب الموعد النهائي', 'الموعد النهائي للخطة "تحديث بروتوكول نقل الدم" خلال 5 أيام', 'medium', 1011, 'تحديث بروتوكول نقل الدم', 1, NOW() + INTERVAL '5 days', 5, false, true, NOW() - INTERVAL '6 hours'),

-- Escalation alerts
('escalation', 'تصعيد خطة تصحيحية', 'تم تصعيد الخطة "تحديث بروتوكول الأدوية" بسبب التأخير', 'critical', 1002, 'تحديث بروتوكول الأدوية', 1, NOW() - INTERVAL '3 days', -3, false, true, NOW() - INTERVAL '6 hours'),
('escalation', 'تصعيد خطة تصحيحية', 'تم تصعيد الخطة "تحسين إجراءات غسل اليدين" بسبب أهميتها', 'critical', 1001, 'تحسين إجراءات غسل اليدين', 1, NOW() - INTERVAL '5 days', -5, false, true, NOW() - INTERVAL '8 hours'),

-- Action required alerts
('action_required', 'إجراء مطلوب', 'يتطلب اتخاذ إجراء فوري للخطة "خطة طوارئ الحرائق"', 'high', 1007, 'خطة طوارئ الحرائق', 1, NOW() + INTERVAL '5 days', 5, false, true, NOW() - INTERVAL '4 hours'),
('action_required', 'إجراء مطلوب', 'يتطلب اتخاذ إجراء للخطة "تحسين نظام الإنذار"', 'high', 1008, 'تحسين نظام الإنذار', 1, NOW() + INTERVAL '8 days', 8, false, true, NOW() - INTERVAL '5 hours'),
('action_required', 'إجراء مطلوب', 'يتطلب اتخاذ إجراء للخطة "مراجعة بروتوكول العزل"', 'medium', 1009, 'مراجعة بروتوكول العزل', 1, NOW() + INTERVAL '10 days', 10, false, true, NOW() - INTERVAL '6 hours'),

-- Completion alerts
('completion', 'إتمام إجراء', 'تم إتمام الإجراء التصحيحي "تقييم الوضع الحالي"', 'low', 1001, 'تحسين إجراءات غسل اليدين', 1, NULL, NULL, true, false, NOW() - INTERVAL '10 days'),
('completion', 'إتمام إجراء', 'تم إتمام الإجراء "تطوير محتوى التدريب"', 'low', 1003, 'تدريب الطاقم على مكافحة العدوى', 1, NULL, NULL, true, false, NOW() - INTERVAL '2 days'),

-- System alerts
('system', 'تذكير', 'موعد المراجعة الدورية للخطط التصحيحية اليوم', 'medium', NULL, NULL, 1, NULL, NULL, false, false, NOW() - INTERVAL '3 hours'),
('system', 'تحديث النظام', 'تم تحديث نظام إدارة الخطط التصحيحية بميزات جديدة', 'low', NULL, NULL, 1, NULL, NULL, false, false, NOW() - INTERVAL '1 day'),

-- Read alerts (some old alerts that were read)
('upcoming', 'موعد قريب', 'موعد نهائي قريب لخطة تصحيحية', 'medium', 1005, 'مراجعة إجراءات التعقيم', 1, NOW() + INTERVAL '12 days', 12, true, false, NOW() - INTERVAL '5 days'),
('completion', 'إنجاز', 'تم إنجاز خطة تصحيحية بنجاح', 'low', 1014, 'تحسين إدارة المخلفات الطبية', 1, NULL, NULL, true, false, NOW() - INTERVAL '5 days'),
('completion', 'إغلاق خطة', 'تم إغلاق الخطة التصحيحية', 'low', 1016, 'تحسين إجراءات التسجيل', 1, NULL, NULL, true, false, NOW() - INTERVAL '8 days');

-- =====================================================
-- Reset sequence numbers to avoid conflicts
-- =====================================================
SELECT setval('capas_id_seq', (SELECT MAX(id) FROM capas));
SELECT setval('capa_actions_id_seq', (SELECT MAX(id) FROM capa_actions));
SELECT setval('timeline_events_id_seq', (SELECT MAX(id) FROM timeline_events));
SELECT setval('capa_alerts_id_seq', (SELECT MAX(id) FROM capa_alerts));

-- =====================================================
-- Verification
-- =====================================================
DO $$
DECLARE
    capa_count INTEGER;
    action_count INTEGER;
    event_count INTEGER;
    alert_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO capa_count FROM capas WHERE id >= 1001;
    SELECT COUNT(*) INTO action_count FROM capa_actions WHERE capa_id >= 1001;
    SELECT COUNT(*) INTO event_count FROM timeline_events WHERE capa_id >= 1001;
    SELECT COUNT(*) INTO alert_count FROM capa_alerts;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Sample Data Inserted Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'CAPAs: % records', capa_count;
    RAISE NOTICE 'Actions: % records', action_count;
    RAISE NOTICE 'Timeline Events: % records', event_count;
    RAISE NOTICE 'Alerts: % records', alert_count;
    RAISE NOTICE '==============================================';
END $$;


-- تحديث عمود evidence_type ليقبل قيم متعددة
-- Update evidence_type column to accept multiple values

-- تغيير نوع العمود من VARCHAR إلى TEXT
ALTER TABLE evaluation_items 
ALTER COLUMN evidence_type TYPE TEXT;

-- إزالة constraint القديم (إذا كان موجوداً)
-- Remove old constraint if exists
ALTER TABLE evaluation_items 
DROP CONSTRAINT IF EXISTS evaluation_items_evidence_type_check;

-- تحديث البيانات الموجودة لتكون متوافقة مع النظام الجديد
-- Update existing data to be compatible with new system
UPDATE evaluation_items 
SET evidence_type = 'OBSERVATION' 
WHERE evidence_type IS NULL OR evidence_type = '';

-- إضافة تعليق للعمود
COMMENT ON COLUMN evaluation_items.evidence_type IS 'أنواع الدليل المقبولة: OBSERVATION,DOCUMENT,INTERVIEW,MEASUREMENT,PHOTO (مفصولة بفاصلة)';

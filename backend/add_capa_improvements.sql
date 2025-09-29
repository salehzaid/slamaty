-- Migration: Add CAPA improvements fields
-- Description: Add new fields to capas table for enhanced CAPA lifecycle management
-- Date: 2025-01-27

-- Add new columns to capas table
ALTER TABLE capas
  ADD COLUMN root_cause TEXT,
  ADD COLUMN corrective_actions JSONB DEFAULT '[]',
  ADD COLUMN preventive_actions JSONB DEFAULT '[]',
  ADD COLUMN verification_steps JSONB DEFAULT '[]',
  ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN severity SMALLINT DEFAULT 3,
  ADD COLUMN estimated_cost NUMERIC,
  ADD COLUMN status_history JSONB DEFAULT '[]',
  ADD COLUMN sla_days INT DEFAULT 14,
  ADD COLUMN escalation_level INT DEFAULT 0,
  ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE NULL;

-- Add check constraint for verification_status
ALTER TABLE capas
  ADD CONSTRAINT capas_verification_status_check 
  CHECK (verification_status IN ('pending', 'in_review', 'verified', 'rejected'));

-- Add check constraint for severity (1-5 scale)
ALTER TABLE capas
  ADD CONSTRAINT capas_severity_check 
  CHECK (severity >= 1 AND severity <= 5);

-- Add check constraint for escalation_level (non-negative)
ALTER TABLE capas
  ADD CONSTRAINT capas_escalation_level_check 
  CHECK (escalation_level >= 0);

-- Add check constraint for sla_days (positive)
ALTER TABLE capas
  ADD CONSTRAINT capas_sla_days_check 
  CHECK (sla_days > 0);

-- Create indexes for better performance
CREATE INDEX ix_capa_department_status_severity ON capas(department, verification_status, severity);
CREATE INDEX ix_capa_corrective_actions_gin ON capas USING gin(corrective_actions);
CREATE INDEX ix_capa_preventive_actions_gin ON capas USING gin(preventive_actions);
CREATE INDEX ix_capa_verification_steps_gin ON capas USING gin(verification_steps);
CREATE INDEX ix_capa_status_history_gin ON capas USING gin(status_history);
CREATE INDEX ix_capa_escalation_level ON capas(escalation_level);
CREATE INDEX ix_capa_closed_at ON capas(closed_at);
CREATE INDEX ix_capa_verified_at ON capas(verified_at);

-- Add comments for documentation
COMMENT ON COLUMN capas.root_cause IS 'Root cause analysis of the issue';
COMMENT ON COLUMN capas.corrective_actions IS 'JSON array of corrective actions with due dates and assignees';
COMMENT ON COLUMN capas.preventive_actions IS 'JSON array of preventive actions to prevent recurrence';
COMMENT ON COLUMN capas.verification_steps IS 'JSON array of verification steps required for closure';
COMMENT ON COLUMN capas.verification_status IS 'Current verification status: pending, in_review, verified, rejected';
COMMENT ON COLUMN capas.severity IS 'Severity level from 1 (low) to 5 (critical)';
COMMENT ON COLUMN capas.estimated_cost IS 'Estimated cost of implementing the CAPA';
COMMENT ON COLUMN capas.status_history IS 'JSON array tracking all status changes with timestamps and users';
COMMENT ON COLUMN capas.sla_days IS 'Service Level Agreement days for resolution';
COMMENT ON COLUMN capas.escalation_level IS 'Number of escalation levels applied';
COMMENT ON COLUMN capas.closed_at IS 'Timestamp when CAPA was closed';
COMMENT ON COLUMN capas.verified_at IS 'Timestamp when CAPA was verified';

-- Update existing CAPAs with default values for new fields
UPDATE capas SET 
  verification_status = 'pending',
  severity = 3,
  sla_days = 14,
  escalation_level = 0,
  corrective_actions = '[]',
  preventive_actions = '[]',
  verification_steps = '[]',
  status_history = '[]'
WHERE verification_status IS NULL;

-- Create a function to update status history
CREATE OR REPLACE FUNCTION update_capa_status_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Add new status change to history
    NEW.status_history = COALESCE(NEW.status_history, '[]'::jsonb) || 
      jsonb_build_object(
        'timestamp', NOW(),
        'user_id', NEW.created_by_id,
        'from_status', OLD.status,
        'to_status', NEW.status,
        'note', 'Status updated'
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status history
CREATE TRIGGER capa_status_history_trigger
  BEFORE UPDATE ON capas
  FOR EACH ROW
  EXECUTE FUNCTION update_capa_status_history();

-- Create a function to check and escalate overdue CAPAs
CREATE OR REPLACE FUNCTION check_overdue_capas()
RETURNS TABLE(capa_id INTEGER, days_overdue INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    EXTRACT(DAYS FROM (NOW() - c.target_date))::INTEGER as days_overdue
  FROM capas c
  WHERE c.verification_status NOT IN ('verified', 'closed')
    AND c.target_date < NOW()
    AND c.escalation_level < 3; -- Max 3 escalation levels
END;
$$ LANGUAGE plpgsql;

-- Create a view for CAPA dashboard statistics
CREATE OR REPLACE VIEW capa_dashboard_stats AS
SELECT 
  COUNT(*) as total_capas,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_capas,
  COUNT(*) FILTER (WHERE verification_status = 'in_review') as in_review_capas,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_capas,
  COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected_capas,
  COUNT(*) FILTER (WHERE severity = 1) as low_severity_capas,
  COUNT(*) FILTER (WHERE severity = 2) as medium_low_severity_capas,
  COUNT(*) FILTER (WHERE severity = 3) as medium_severity_capas,
  COUNT(*) FILTER (WHERE severity = 4) as high_severity_capas,
  COUNT(*) FILTER (WHERE severity = 5) as critical_severity_capas,
  COUNT(*) FILTER (WHERE target_date < NOW() AND verification_status NOT IN ('verified', 'closed')) as overdue_capas,
  COUNT(*) FILTER (WHERE escalation_level > 0) as escalated_capas,
  AVG(severity) as avg_severity,
  AVG(escalation_level) as avg_escalation_level
FROM capas;

-- Grant necessary permissions
GRANT SELECT ON capa_dashboard_stats TO postgres;
GRANT EXECUTE ON FUNCTION check_overdue_capas() TO postgres;
GRANT EXECUTE ON FUNCTION update_capa_status_history() TO postgres;

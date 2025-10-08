-- =====================================================
-- CAPA Dashboard Tables Migration
-- =====================================================
-- This migration adds the necessary tables for the CAPA dashboard:
-- 1. capa_actions: Store corrective, preventive, and verification actions
-- 2. timeline_events: Store timeline events for CAPA tracking
-- 3. capa_alerts: Store alerts and notifications
-- 4. Views for dashboard statistics
-- =====================================================

-- Drop tables if they exist (for clean re-run)
DROP TABLE IF EXISTS capa_alerts CASCADE;
DROP TABLE IF EXISTS timeline_events CASCADE;
DROP TABLE IF EXISTS capa_actions CASCADE;
DROP VIEW IF EXISTS capa_dashboard_stats CASCADE;

-- =====================================================
-- 1. Table: capa_actions
-- =====================================================
CREATE TABLE capa_actions (
    id SERIAL PRIMARY KEY,
    capa_id INTEGER NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('corrective', 'preventive', 'verification')),
    task TEXT NOT NULL,
    description TEXT,
    assigned_to VARCHAR(100),
    assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_capa_actions_capa_id ON capa_actions(capa_id);
CREATE INDEX idx_capa_actions_type ON capa_actions(action_type);
CREATE INDEX idx_capa_actions_status ON capa_actions(status);
CREATE INDEX idx_capa_actions_assigned_to_id ON capa_actions(assigned_to_id);
CREATE INDEX idx_capa_actions_due_date ON capa_actions(due_date);

-- =====================================================
-- 2. Table: timeline_events
-- =====================================================
CREATE TABLE timeline_events (
    id SERIAL PRIMARY KEY,
    capa_id INTEGER NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('capa_created', 'capa_updated', 'status_change', 'action_started', 'action_completed', 'action_updated', 'verification_step', 'comment_added', 'assignment_changed', 'escalation')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(200),
    action_id INTEGER REFERENCES capa_actions(id) ON DELETE SET NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    progress_percentage INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_timeline_events_capa_id ON timeline_events(capa_id);
CREATE INDEX idx_timeline_events_type ON timeline_events(event_type);
CREATE INDEX idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX idx_timeline_events_created_at ON timeline_events(created_at);

-- =====================================================
-- 3. Table: capa_alerts
-- =====================================================
CREATE TABLE capa_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('overdue', 'upcoming', 'escalation', 'completion', 'system', 'deadline_approaching', 'action_required')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    capa_id INTEGER REFERENCES capas(id) ON DELETE CASCADE,
    capa_title VARCHAR(200),
    action_id INTEGER REFERENCES capa_actions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE,
    days_until_due INTEGER,
    read BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX idx_capa_alerts_type ON capa_alerts(alert_type);
CREATE INDEX idx_capa_alerts_priority ON capa_alerts(priority);
CREATE INDEX idx_capa_alerts_capa_id ON capa_alerts(capa_id);
CREATE INDEX idx_capa_alerts_user_id ON capa_alerts(user_id);
CREATE INDEX idx_capa_alerts_read ON capa_alerts(read);
CREATE INDEX idx_capa_alerts_created_at ON capa_alerts(created_at);

-- =====================================================
-- 4. View: capa_dashboard_stats
-- =====================================================
CREATE OR REPLACE VIEW capa_dashboard_stats AS
SELECT 
    COUNT(*) as total_capas,
    COUNT(*) FILTER (WHERE target_date < NOW() AND status NOT IN ('verified', 'closed')) as overdue_capas,
    COUNT(*) FILTER (WHERE status IN ('verified', 'closed') AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) as completed_this_month,
    COUNT(*) FILTER (WHERE priority = 'urgent' AND status IN ('pending', 'assigned')) as critical_pending,
    COALESCE(ROUND(AVG(EXTRACT(DAY FROM (COALESCE(updated_at, NOW()) - created_at))) FILTER (WHERE status IN ('verified', 'closed'))), 0) as average_completion_time,
    0 as cost_savings
FROM capas;

-- =====================================================
-- 5. Helper Functions
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to capa_actions
CREATE TRIGGER update_capa_actions_updated_at 
    BEFORE UPDATE ON capa_actions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create timeline event when action status changes
CREATE OR REPLACE FUNCTION create_action_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO timeline_events (capa_id, event_type, title, description, action_id, user_id, new_status)
        VALUES (
            NEW.capa_id,
            'action_started',
            'بدء إجراء جديد',
            NEW.task,
            NEW.id,
            NEW.assigned_to_id,
            NEW.status
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO timeline_events (capa_id, event_type, title, description, action_id, user_id, old_status, new_status, progress_percentage)
        VALUES (
            NEW.capa_id,
            CASE 
                WHEN NEW.status = 'completed' THEN 'action_completed'
                ELSE 'action_updated'
            END,
            'تحديث حالة الإجراء',
            NEW.task,
            NEW.id,
            NEW.assigned_to_id,
            OLD.status,
            NEW.status,
            NEW.completion_percentage
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for timeline events
CREATE TRIGGER action_timeline_trigger
    AFTER INSERT OR UPDATE ON capa_actions
    FOR EACH ROW
    EXECUTE FUNCTION create_action_timeline_event();

-- Function to generate alerts for overdue actions
CREATE OR REPLACE FUNCTION generate_overdue_alerts()
RETURNS void AS $$
BEGIN
    -- Insert alerts for overdue actions (not already alerted)
    INSERT INTO capa_alerts (alert_type, title, message, priority, capa_id, capa_title, action_id, user_id, due_date, days_until_due, action_required)
    SELECT 
        'overdue',
        'إجراء متأخر',
        'الإجراء "' || a.task || '" متأخر عن الموعد المحدد',
        CASE 
            WHEN EXTRACT(DAY FROM (NOW() - a.due_date)) > 7 THEN 'critical'
            WHEN EXTRACT(DAY FROM (NOW() - a.due_date)) > 3 THEN 'high'
            ELSE 'medium'
        END,
        a.capa_id,
        c.title,
        a.id,
        a.assigned_to_id,
        a.due_date,
        EXTRACT(DAY FROM (a.due_date - NOW()))::INTEGER,
        true
    FROM capa_actions a
    JOIN capas c ON c.id = a.capa_id
    WHERE a.due_date < NOW()
        AND a.status NOT IN ('completed', 'cancelled')
        AND NOT EXISTS (
            SELECT 1 FROM capa_alerts 
            WHERE action_id = a.id 
            AND alert_type = 'overdue'
            AND created_at > NOW() - INTERVAL '1 day'
        );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created tables: capa_actions, timeline_events, capa_alerts';
    RAISE NOTICE 'Created view: capa_dashboard_stats';
    RAISE NOTICE 'Created helper functions and triggers';
END $$;


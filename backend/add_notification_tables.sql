-- Add notification tables to the database

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'round_assigned', 'round_reminder', 'round_deadline', 
        'capa_assigned', 'capa_deadline', 'system_update', 'general'
    )),
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    entity_type VARCHAR(50), -- ROUND, CAPA, etc.
    entity_id INTEGER, -- ID of the related entity
    is_email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    round_assignments BOOLEAN DEFAULT TRUE,
    round_reminders BOOLEAN DEFAULT TRUE,
    round_deadlines BOOLEAN DEFAULT TRUE,
    capa_assignments BOOLEAN DEFAULT TRUE,
    capa_deadlines BOOLEAN DEFAULT TRUE,
    system_updates BOOLEAN DEFAULT FALSE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON user_notification_settings(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_notification_settings_updated_at 
    BEFORE UPDATE ON user_notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification settings for existing users
INSERT INTO user_notification_settings (user_id, email_notifications, sms_notifications, round_assignments, round_reminders, round_deadlines, capa_assignments, capa_deadlines, system_updates, weekly_reports)
SELECT 
    id as user_id,
    TRUE as email_notifications,
    FALSE as sms_notifications,
    TRUE as round_assignments,
    TRUE as round_reminders,
    TRUE as round_deadlines,
    TRUE as capa_assignments,
    TRUE as capa_deadlines,
    FALSE as system_updates,
    TRUE as weekly_reports
FROM users
WHERE id NOT IN (SELECT user_id FROM user_notification_settings);

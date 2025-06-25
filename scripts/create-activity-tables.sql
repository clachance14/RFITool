-- Create activity tracking tables for RFI activity log
-- This script ensures all tables needed for permanent activity tracking exist

-- 1. Create rfi_status_logs table for status change tracking
CREATE TABLE IF NOT EXISTS rfi_status_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    from_stage TEXT,
    to_stage TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create rfi_activity table for general activity tracking
CREATE TABLE IF NOT EXISTS rfi_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    activity_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rfi_status_logs_rfi_id ON rfi_status_logs(rfi_id);
CREATE INDEX IF NOT EXISTS idx_rfi_status_logs_changed_at ON rfi_status_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfi_status_logs_changed_by ON rfi_status_logs(changed_by);

CREATE INDEX IF NOT EXISTS idx_rfi_activity_rfi_id ON rfi_activity(rfi_id);
CREATE INDEX IF NOT EXISTS idx_rfi_activity_created_at ON rfi_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfi_activity_user_id ON rfi_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_rfi_activity_type ON rfi_activity(activity_type);

-- 4. Enable Row Level Security
ALTER TABLE rfi_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_activity ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for activity tracking tables
-- Users can only see activity for RFIs they have access to
CREATE POLICY "rfi_status_logs_company_access" ON rfi_status_logs
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM rfis r
        JOIN projects p ON r.project_id = p.id
        JOIN company_users cu ON p.company_id = cu.company_id
        WHERE r.id = rfi_status_logs.rfi_id
        AND cu.user_id = auth.uid()
    )
);

CREATE POLICY "rfi_activity_company_access" ON rfi_activity
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM rfis r
        JOIN projects p ON r.project_id = p.id
        JOIN company_users cu ON p.company_id = cu.company_id
        WHERE r.id = rfi_activity.rfi_id
        AND cu.user_id = auth.uid()
    )
);

-- 6. Create function to automatically log RFI status changes
CREATE OR REPLACE FUNCTION log_rfi_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status or stage actually changed
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.stage IS DISTINCT FROM NEW.stage THEN
        INSERT INTO rfi_status_logs (
            rfi_id,
            from_status,
            to_status,
            from_stage,
            to_stage,
            changed_by,
            changed_at,
            additional_data
        ) VALUES (
            NEW.id,
            COALESCE(OLD.status::TEXT, 'unknown'),
            COALESCE(NEW.status::TEXT, 'unknown'),
            OLD.stage::TEXT,
            NEW.stage::TEXT,
            COALESCE(NEW.updated_by, auth.uid()),
            NOW(),
            jsonb_build_object(
                'previous_updated_at', OLD.updated_at,
                'new_updated_at', NEW.updated_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to automatically log status changes
DROP TRIGGER IF EXISTS trigger_log_rfi_status_change ON rfis;
CREATE TRIGGER trigger_log_rfi_status_change
    AFTER UPDATE ON rfis
    FOR EACH ROW
    EXECUTE FUNCTION log_rfi_status_change();

-- 8. Create function to log general RFI activity
CREATE OR REPLACE FUNCTION log_rfi_activity(
    rfi_id_param UUID,
    user_id_param UUID,
    activity_type_param TEXT,
    details_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO rfi_activity (
        rfi_id,
        user_id,
        activity_type,
        details,
        created_at
    ) VALUES (
        rfi_id_param,
        user_id_param,
        activity_type_param,
        details_param,
        NOW()
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add updated_by column to rfis table if it doesn't exist
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- 10. Create trigger to update updated_by when rfis are modified
CREATE OR REPLACE FUNCTION update_rfi_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rfi_updated_by ON rfis;
CREATE TRIGGER trigger_update_rfi_updated_by
    BEFORE UPDATE ON rfis
    FOR EACH ROW
    EXECUTE FUNCTION update_rfi_updated_by();

-- 11. Backfill existing RFI creation activities
INSERT INTO rfi_activity (rfi_id, user_id, activity_type, details, created_at)
SELECT 
    id as rfi_id,
    created_by as user_id,
    'created' as activity_type,
    jsonb_build_object(
        'message', 'RFI created: ' || subject,
        'rfi_number', rfi_number,
        'initial_status', status::text
    ) as details,
    created_at
FROM rfis
WHERE id NOT IN (
    SELECT rfi_id FROM rfi_activity WHERE activity_type = 'created'
);

-- 12. Verification queries
SELECT 'rfi_status_logs table created' as status, count(*) as record_count FROM rfi_status_logs;
SELECT 'rfi_activity table created' as status, count(*) as record_count FROM rfi_activity;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Activity tracking tables created successfully!';
    RAISE NOTICE '📋 Created rfi_status_logs table for status change tracking';
    RAISE NOTICE '📊 Created rfi_activity table for general activity tracking';
    RAISE NOTICE '🔧 Added automatic triggers for status change logging';
    RAISE NOTICE '🚀 Recent activity feed should now show permanent history';
END $$; 
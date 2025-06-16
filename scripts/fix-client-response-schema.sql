-- Fix client response schema issues
-- This script addresses the database errors from the console output

-- 1. Add missing client_cm_approval column if it doesn't exist
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS client_cm_approval TEXT;

-- 2. Update the status enum to include the correct values
-- First, let's check the current enum values
DO $$
BEGIN
    -- Check if we need to add new enum values
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'rfi_status_new' AND e.enumlabel = 'responded'
    ) THEN
        ALTER TYPE rfi_status_new ADD VALUE 'responded';
    END IF;
    
    -- Also add other status values that might be missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'rfi_status_new' AND e.enumlabel = 'active'
    ) THEN
        ALTER TYPE rfi_status_new ADD VALUE 'active';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'rfi_status_new' AND e.enumlabel = 'closed'
    ) THEN
        ALTER TYPE rfi_status_new ADD VALUE 'closed';
    END IF;
END $$;

-- 3. Ensure the notifications table exists with proper structure
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('response_received', 'overdue_reminder', 'status_changed', 'link_generated')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create an index for better performance on notifications
CREATE INDEX IF NOT EXISTS idx_notifications_rfi_id ON notifications(rfi_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. Add missing columns to rfis table if they don't exist
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS additional_comments TEXT;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS client_response_submitted_by VARCHAR(255);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS response_status VARCHAR(50) CHECK (response_status IN ('approved', 'rejected', 'needs_clarification'));

-- 6. Ensure stage column exists with proper enum values
-- First check if stage enum exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rfi_stage') THEN
        CREATE TYPE rfi_stage AS ENUM (
            'draft',
            'sent_to_client',
            'awaiting_response',
            'response_received',
            'field_work_in_progress',
            'work_completed',
            'declined',
            'late_overdue',
            'revision_requested',
            'on_hold'
        );
    END IF;
END $$;

-- Add stage column if it doesn't exist
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS stage rfi_stage DEFAULT 'draft';

-- 7. Add updated_at trigger for notifications table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Add secure link columns if they don't exist
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS secure_link_token VARCHAR(255) UNIQUE;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS link_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS allow_multiple_responses BOOLEAN DEFAULT FALSE;

-- 9. Verification queries to check if everything is properly set up
SELECT 
    'Checking rfis table columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rfis' 
AND column_name IN ('client_cm_approval', 'additional_comments', 'client_response_submitted_by', 'response_status', 'stage', 'secure_link_token', 'link_expires_at', 'allow_multiple_responses')
ORDER BY column_name;

-- Check notifications table
SELECT 
    'Checking notifications table' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check enum values
SELECT 
    'Checking rfi_status_new enum values' as check_type,
    e.enumlabel as enum_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'rfi_status_new'
ORDER BY e.enumsortorder;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Client response schema fixes completed successfully!';
    RAISE NOTICE '📋 Added missing columns to rfis table';
    RAISE NOTICE '📊 Created notifications table with proper structure';
    RAISE NOTICE '🔧 Updated enum types with required values';
    RAISE NOTICE '🚀 Client response functionality should now work properly';
END $$; 
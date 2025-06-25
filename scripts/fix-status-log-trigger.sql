-- Fix the log_rfi_status_change trigger to handle client responses
-- This addresses the "null value in column changed_by" error

-- Create a system user for fallback operations if it doesn't exist
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Try to find an existing system user
    SELECT id INTO system_user_id FROM users WHERE email = 'system@rfitrak.com' LIMIT 1;
    
    -- If no system user exists, create one
    IF system_user_id IS NULL THEN
        INSERT INTO users (id, email, full_name)
        VALUES (gen_random_uuid(), 'system@rfitrak.com', 'System User')
        RETURNING id INTO system_user_id;
        
        RAISE NOTICE 'Created system user with ID: %', system_user_id;
    ELSE
        RAISE NOTICE 'Using existing system user with ID: %', system_user_id;
    END IF;
END $$;

-- Update the trigger function to handle client responses properly
CREATE OR REPLACE FUNCTION log_rfi_status_change()
RETURNS TRIGGER AS $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Only log if status or stage actually changed
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.stage IS DISTINCT FROM NEW.stage THEN
        
        -- For client responses, we'll create a special activity entry instead of status log
        IF NEW.stage = 'response_received' 
           AND OLD.stage != 'response_received' 
           AND NEW.client_response_submitted_by IS NOT NULL THEN
            
            -- Get system user for the activity log
            SELECT id INTO system_user_id FROM users WHERE email = 'system@rfitrak.com' LIMIT 1;
            
            -- Log client response as a general activity (not status change)
            INSERT INTO rfi_activity (
                rfi_id,
                user_id,
                activity_type,
                details,
                created_at
            ) VALUES (
                NEW.id,
                system_user_id,
                'client_response_submitted',
                jsonb_build_object(
                    'message', NEW.client_response_submitted_by || ' submitted a client response',
                    'responder_name', NEW.client_response_submitted_by,
                    'response_length', COALESCE(LENGTH(NEW.client_response), 0),
                    'stage_change', OLD.stage || ' → ' || NEW.stage,
                    'performed_by_type', 'client'
                ),
                NOW()
            );
            
            RAISE LOG 'Logged client response activity for: %', NEW.client_response_submitted_by;
            RETURN NEW;
        END IF;
        
        -- For regular user-driven changes, log to status_logs as usual
        IF auth.uid() IS NOT NULL OR NEW.updated_by IS NOT NULL THEN
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
                    'new_updated_at', NEW.updated_at,
                    'trigger_source', 'automatic'
                )
            );
        ELSE
            -- Get system user for fallback
            SELECT id INTO system_user_id FROM users WHERE email = 'system@rfitrak.com' LIMIT 1;
            
            -- Log as general activity if no user ID available
            IF system_user_id IS NOT NULL THEN
                INSERT INTO rfi_activity (
                    rfi_id,
                    user_id,
                    activity_type,
                    details,
                    created_at
                ) VALUES (
                    NEW.id,
                    system_user_id,
                    'status_changed',
                    jsonb_build_object(
                        'message', 'Status changed from ' || COALESCE(OLD.status::TEXT, 'unknown') || ' to ' || COALESCE(NEW.status::TEXT, 'unknown'),
                        'from_status', OLD.status::TEXT,
                        'to_status', NEW.status::TEXT,
                        'from_stage', OLD.stage::TEXT,
                        'to_stage', NEW.stage::TEXT,
                        'performed_by_type', 'system'
                    ),
                    NOW()
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the rfis trigger to not set updated_by when using service role
CREATE OR REPLACE FUNCTION update_rfi_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set updated_by if there's an authenticated user (not service role)
    IF auth.uid() IS NOT NULL THEN
        NEW.updated_by = auth.uid();
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill any existing client responses as activity entries
INSERT INTO rfi_activity (rfi_id, user_id, activity_type, details, created_at)
SELECT 
    r.id as rfi_id,
    (SELECT id FROM users WHERE email = 'system@rfitrak.com' LIMIT 1) as user_id,
    'client_response_submitted' as activity_type,
    jsonb_build_object(
        'message', COALESCE(r.client_response_submitted_by, 'Client') || ' submitted a response',
        'responder_name', r.client_response_submitted_by,
        'response_length', LENGTH(r.client_response),
        'stage', r.stage,
        'performed_by_type', 'client',
        'backfilled', true
    ) as details,
    COALESCE(r.date_responded, r.updated_at, r.created_at) as created_at
FROM rfis r
WHERE r.client_response IS NOT NULL 
  AND r.client_response_submitted_by IS NOT NULL
  AND r.stage = 'response_received'
  AND NOT EXISTS (
    SELECT 1 FROM rfi_activity 
    WHERE rfi_id = r.id 
    AND activity_type = 'client_response_submitted'
  );

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Status log trigger fixed!';
    RAISE NOTICE '📊 Client responses will be logged as activities with responder names';
    RAISE NOTICE '🔧 Regular user changes will still be logged in rfi_status_logs';
    RAISE NOTICE '🔄 Backfilled existing client responses as activity entries';
    RAISE NOTICE '🚀 Recent activity feed should now show all changes including client responses';
END $$; 
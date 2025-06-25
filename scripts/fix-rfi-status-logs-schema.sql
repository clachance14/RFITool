-- Fix rfi_status_logs table schema
-- Add missing from_stage and to_stage columns

-- Add the missing columns if they don't exist
ALTER TABLE rfi_status_logs ADD COLUMN IF NOT EXISTS from_stage TEXT;
ALTER TABLE rfi_status_logs ADD COLUMN IF NOT EXISTS to_stage TEXT;

-- Verify the columns were added
SELECT 
    'RFI Status Logs Columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rfi_status_logs' 
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RFI Status Logs schema fixed!';
    RAISE NOTICE '📊 Added missing from_stage and to_stage columns';
    RAISE NOTICE '🚀 Client response submission should now work properly';
END $$; 
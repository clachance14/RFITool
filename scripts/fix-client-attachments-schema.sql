-- Fix client attachments schema
-- This script adds missing columns to rfi_attachments table for client upload functionality

-- Add client-specific columns to rfi_attachments table
ALTER TABLE rfi_attachments ADD COLUMN IF NOT EXISTS uploaded_by_type VARCHAR(50) DEFAULT 'contractor' CHECK (uploaded_by_type IN ('contractor', 'client'));
ALTER TABLE rfi_attachments ADD COLUMN IF NOT EXISTS client_session_token VARCHAR(255);
ALTER TABLE rfi_attachments ADD COLUMN IF NOT EXISTS client_uploaded_by VARCHAR(255);
ALTER TABLE rfi_attachments ADD COLUMN IF NOT EXISTS attachment_category VARCHAR(100) DEFAULT 'general';
ALTER TABLE rfi_attachments ADD COLUMN IF NOT EXISTS is_visible_to_client BOOLEAN DEFAULT TRUE;
ALTER TABLE rfi_attachments ADD COLUMN IF NOT EXISTS virus_scan_status VARCHAR(50) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'failed'));

-- Add file_size column if it doesn't exist (some queries expect this)
ALTER TABLE rfi_attachments ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Update file_size from file_size_bytes if file_size is null
UPDATE rfi_attachments SET file_size = file_size_bytes WHERE file_size IS NULL AND file_size_bytes IS NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rfi_attachments_uploaded_by_type ON rfi_attachments(uploaded_by_type);
CREATE INDEX IF NOT EXISTS idx_rfi_attachments_client_session_token ON rfi_attachments(client_session_token);
CREATE INDEX IF NOT EXISTS idx_rfi_attachments_attachment_category ON rfi_attachments(attachment_category);
CREATE INDEX IF NOT EXISTS idx_rfi_attachments_is_visible_to_client ON rfi_attachments(is_visible_to_client);

-- Verify the columns were added
SELECT 
    'Checking rfi_attachments table columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rfi_attachments' 
AND column_name IN (
    'uploaded_by_type', 
    'client_session_token', 
    'client_uploaded_by',
    'attachment_category',
    'is_visible_to_client',
    'virus_scan_status',
    'file_size'
)
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Client attachments schema fixes completed successfully!';
    RAISE NOTICE '📎 Added client-specific columns to rfi_attachments table';
    RAISE NOTICE '🔧 Added uploaded_by_type, client_session_token, client_uploaded_by';
    RAISE NOTICE '📊 Added attachment_category, is_visible_to_client, virus_scan_status';
    RAISE NOTICE '🚀 Client file upload functionality should now work properly';
END $$; 
-- Add missing additional_comments column to rfis table
-- This column is referenced in the client response submission feature

-- Add the additional_comments column if it doesn't exist
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS additional_comments TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rfis' AND column_name = 'additional_comments'; 
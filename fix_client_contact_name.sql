-- Fix client_contact_name field for projects table
-- This handles existing projects properly

-- Step 1: Add the column as nullable first
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_contact_name VARCHAR(255);

-- Step 2: Update any existing projects with a default value
UPDATE projects 
SET client_contact_name = 'Update Contact Name' 
WHERE client_contact_name IS NULL;

-- Step 3: Now make it NOT NULL since all records have a value
ALTER TABLE projects 
ALTER COLUMN client_contact_name SET NOT NULL;

-- This approach safely handles existing data without violating constraints 
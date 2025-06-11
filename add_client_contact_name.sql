-- Add client_contact_name field to projects table
-- This field will store the name of the client contact person who will be the default RFI recipient

ALTER TABLE projects 
ADD COLUMN client_contact_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Contact';

-- Remove the default after adding the column (so future inserts require the field)
ALTER TABLE projects 
ALTER COLUMN client_contact_name DROP DEFAULT;

-- Update the UPDATED_TECH_SPEC.md comment to reflect this change
-- The projects table now includes:
-- - project_manager_contact (email)
-- - client_contact_name (person's name) 
-- RFI Tracking Application - Admin Isolation Migration
-- This script implements the admin isolation feature and role updates
-- 
-- Features:
-- 1. Updates role system from 'owner' to 'super_admin'
-- 2. Adds 'app_owner' role for system administrators
-- 3. Implements admin-level project isolation within companies
-- 4. Adds safety policies to prevent accidental deletions
-- 5. Implements email domain-based company detection

-- ============================================
-- STEP 1: UPDATE ROLE SYSTEM
-- ============================================

-- Add app_owner role if it doesn't exist
INSERT INTO roles (id, name, description) VALUES 
(0, 'app_owner', 'Application owner with cross-company access for billing and system administration')
ON CONFLICT (id) DO UPDATE SET 
name = EXCLUDED.name, 
description = EXCLUDED.description;

-- Update existing owner role to super_admin
UPDATE roles 
SET name = 'super_admin', 
    description = 'Company super administrator - first user with user management capabilities'
WHERE id = 1 AND name = 'owner';

-- Ensure admin role description is updated
UPDATE roles 
SET description = 'Company administrator - manages own projects and RFIs'
WHERE id = 2 AND name = 'admin';

-- ============================================
-- STEP 2: ADD ADMIN OWNERSHIP TO PROJECTS
-- ============================================

-- Add created_by column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Set created_by for existing projects (assign to first admin in each company)
-- NOTE: Run scripts/add-timestamp-columns.sql first to ensure created_at columns exist
UPDATE projects 
SET created_by = (
  SELECT cu.user_id 
  FROM company_users cu 
  WHERE cu.company_id = projects.company_id 
  AND cu.role_id IN (1, 2) -- super_admin or admin
  ORDER BY cu.created_at ASC -- Use company join date to determine first admin
  LIMIT 1
)
WHERE created_by IS NULL;

-- ============================================
-- STEP 3: COMPANY DOMAIN DETECTION FUNCTIONS
-- ============================================

-- Function to extract domain from email
CREATE OR REPLACE FUNCTION get_company_domain(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(split_part(email, '@', 2));
END;
$$ LANGUAGE plpgsql;

-- Function to find or create company by email domain
CREATE OR REPLACE FUNCTION find_or_create_company_by_email(user_email TEXT, user_name TEXT)
RETURNS UUID AS $$
DECLARE
  domain TEXT;
  company_record RECORD;
  new_company_id UUID;
BEGIN
  domain := get_company_domain(user_email);
  
  -- Skip common email providers - create individual companies
  IF domain IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com') THEN
    INSERT INTO companies (name) 
    VALUES (user_name || '''s Company') 
    RETURNING id INTO new_company_id;
    RETURN new_company_id;
  END IF;
  
  -- Look for existing company with same domain
  SELECT c.* INTO company_record
  FROM companies c
  JOIN company_users cu ON c.id = cu.company_id
  JOIN users u ON cu.user_id = u.id
  WHERE get_company_domain(u.email) = domain
  LIMIT 1;
  
  IF company_record.id IS NOT NULL THEN
    RETURN company_record.id;
  ELSE
    -- Create new company based on domain
    INSERT INTO companies (name) 
    VALUES (initcap(replace(domain, '.com', '')) || ' Inc.') 
    RETURNING id INTO new_company_id;
    RETURN new_company_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: USER PROJECT ACCESS FUNCTION
-- ============================================

-- Function to determine which projects a user can access
CREATE OR REPLACE FUNCTION get_user_projects()
RETURNS TABLE(project_id UUID) AS $$
BEGIN
  -- App owner (role_id = 0) sees ALL projects across ALL companies
  IF (SELECT role_id FROM company_users WHERE user_id = auth.uid()) = 0 THEN
    RETURN QUERY SELECT p.id FROM projects p;
  -- Super admin (role_id = 1) sees all company projects
  ELSIF (SELECT role_id FROM company_users WHERE user_id = auth.uid()) = 1 THEN
    RETURN QUERY 
    SELECT p.id FROM projects p 
    WHERE p.company_id = get_user_company_id();
  ELSE
    -- Regular admins/users only see their own projects
    RETURN QUERY 
    SELECT p.id FROM projects p 
    WHERE p.company_id = get_user_company_id() 
    AND p.created_by = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- STEP 5: UPDATE RLS POLICIES
-- ============================================

-- Drop existing project policies
DROP POLICY IF EXISTS "projects_authenticated_only" ON projects;
DROP POLICY IF EXISTS "projects_company_isolation" ON projects;

-- Create new admin isolation policy for projects
CREATE POLICY "projects_admin_isolation" ON projects
  FOR ALL 
  TO authenticated 
  USING (id IN (SELECT project_id FROM get_user_projects()));

-- ============================================
-- STEP 6: SAFETY POLICIES FOR DELETIONS
-- ============================================

-- Projects: Only app owner can delete any project, others can only delete their own
CREATE POLICY "projects_delete_protection" ON projects
  FOR DELETE
  TO authenticated 
  USING (
    -- App owner can delete anything
    (SELECT role_id FROM company_users WHERE user_id = auth.uid()) = 0
    OR 
    -- Others can only delete their own projects
    (created_by = auth.uid() AND company_id = get_user_company_id())
  );

-- Users: Only app owner can delete users
DROP POLICY IF EXISTS "users_authenticated_only" ON users;
CREATE POLICY "users_company_isolation" ON users
  FOR SELECT
  TO authenticated 
  USING (
    -- App owner sees all users
    (SELECT role_id FROM company_users WHERE user_id = auth.uid()) = 0
    OR
    -- Others see users in their company
    id IN (
      SELECT cu.user_id 
      FROM company_users cu 
      WHERE cu.company_id = get_user_company_id()
    )
  );

CREATE POLICY "users_delete_protection" ON users
  FOR DELETE
  TO authenticated 
  USING (
    (SELECT role_id FROM company_users WHERE user_id = auth.uid()) = 0
  );

-- Company Users: Only app owner can remove users from companies
DROP POLICY IF EXISTS "company_users_authenticated_only" ON company_users;
CREATE POLICY "company_users_isolation" ON company_users
  FOR SELECT
  TO authenticated 
  USING (
    -- App owner sees all
    (SELECT role_id FROM company_users WHERE user_id = auth.uid()) = 0
    OR
    -- Others see their company
    company_id = get_user_company_id()
  );

CREATE POLICY "company_users_delete_protection" ON company_users
  FOR DELETE
  TO authenticated 
  USING (
    (SELECT role_id FROM company_users WHERE user_id = auth.uid()) = 0
  );

-- ============================================
-- STEP 7: UPDATE RFI POLICIES FOR ADMIN ISOLATION
-- ============================================

-- RFIs: Update to respect admin isolation
DROP POLICY IF EXISTS "rfis_authenticated_only" ON rfis;
DROP POLICY IF EXISTS "rfis_company_isolation" ON rfis;

CREATE POLICY "rfis_admin_isolation" ON rfis
  FOR ALL 
  TO authenticated 
  USING (
    project_id IN (SELECT project_id FROM get_user_projects())
  );

-- RFI Attachments: Update to respect admin isolation
DROP POLICY IF EXISTS "rfi_attachments_authenticated_only" ON rfi_attachments;
DROP POLICY IF EXISTS "rfi_attachments_company_isolation" ON rfi_attachments;

CREATE POLICY "rfi_attachments_admin_isolation" ON rfi_attachments
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      WHERE r.project_id IN (SELECT project_id FROM get_user_projects())
    )
  );

-- RFI Activity: Update to respect admin isolation
DROP POLICY IF EXISTS "rfi_activity_authenticated_only" ON rfi_activity;
DROP POLICY IF EXISTS "rfi_activity_company_isolation" ON rfi_activity;

CREATE POLICY "rfi_activity_admin_isolation" ON rfi_activity
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      WHERE r.project_id IN (SELECT project_id FROM get_user_projects())
    )
  );

-- RFI Status Logs: Update to respect admin isolation
DROP POLICY IF EXISTS "rfi_status_logs_authenticated_only" ON rfi_status_logs;
DROP POLICY IF EXISTS "rfi_status_logs_company_isolation" ON rfi_status_logs;

CREATE POLICY "rfi_status_logs_admin_isolation" ON rfi_status_logs
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      WHERE r.project_id IN (SELECT project_id FROM get_user_projects())
    )
  );

-- RFI Revisions: Update to respect admin isolation
DROP POLICY IF EXISTS "rfi_revisions_authenticated_only" ON rfi_revisions;
DROP POLICY IF EXISTS "rfi_revisions_company_isolation" ON rfi_revisions;

CREATE POLICY "rfi_revisions_admin_isolation" ON rfi_revisions
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      WHERE r.project_id IN (SELECT project_id FROM get_user_projects())
    )
  );

-- RFI Cost Items: Update to respect admin isolation
DROP POLICY IF EXISTS "rfi_cost_items_authenticated_only" ON rfi_cost_items;
DROP POLICY IF EXISTS "rfi_cost_items_company_isolation" ON rfi_cost_items;

CREATE POLICY "rfi_cost_items_admin_isolation" ON rfi_cost_items
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      WHERE r.project_id IN (SELECT project_id FROM get_user_projects())
    )
  );

-- Client Sessions: Update to respect admin isolation
DROP POLICY IF EXISTS "client_sessions_authenticated_only" ON client_sessions;
DROP POLICY IF EXISTS "client_sessions_company_isolation" ON client_sessions;

CREATE POLICY "client_sessions_admin_isolation" ON client_sessions
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      WHERE r.project_id IN (SELECT project_id FROM get_user_projects())
    )
  );

-- ============================================
-- STEP 8: BILLING QUERIES FOR APP OWNER
-- ============================================

-- View for app owner to see billing data by company
CREATE OR REPLACE VIEW company_billing_summary AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT r.id) as total_rfis,
  COUNT(DISTINCT cu.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN cu.role_id = 1 THEN cu.user_id END) as super_admins,
  COUNT(DISTINCT CASE WHEN cu.role_id = 2 THEN cu.user_id END) as admins,
  COUNT(DISTINCT CASE WHEN cu.role_id = 3 THEN cu.user_id END) as rfi_users,
  MAX(r.created_at) as last_activity_date
FROM companies c
LEFT JOIN company_users cu ON c.id = cu.company_id
LEFT JOIN projects p ON c.id = p.company_id
LEFT JOIN rfis r ON p.id = r.project_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Grant access to app owner role
GRANT SELECT ON company_billing_summary TO authenticated;

-- ============================================
-- STEP 9: VERIFICATION QUERIES
-- ============================================

-- Verify the migration worked
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Roles updated: app_owner (0), super_admin (1), admin (2)';
  RAISE NOTICE 'Projects table updated with created_by column';
  RAISE NOTICE 'RLS policies updated for admin isolation';
  RAISE NOTICE 'Safety policies implemented for deletions';
  RAISE NOTICE 'Company domain detection functions created';
END $$;

-- Show role summary
SELECT 
  r.id,
  r.name,
  r.description,
  COUNT(cu.user_id) as user_count
FROM roles r
LEFT JOIN company_users cu ON r.id = cu.role_id
GROUP BY r.id, r.name, r.description
ORDER BY r.id; 
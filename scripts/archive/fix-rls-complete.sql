-- Complete RLS Security Fix
-- This ensures that ONLY authenticated users can access data

-- First, ensure RLS is enabled on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "company_isolation" ON companies;
DROP POLICY IF EXISTS "users_company_isolation" ON users;
DROP POLICY IF EXISTS "company_users_isolation" ON company_users;
DROP POLICY IF EXISTS "projects_company_isolation" ON projects;
DROP POLICY IF EXISTS "rfis_company_isolation" ON rfis;
DROP POLICY IF EXISTS "rfi_attachments_company_isolation" ON rfi_attachments;
DROP POLICY IF EXISTS "rfi_activity_company_isolation" ON rfi_activity;
DROP POLICY IF EXISTS "rfi_status_logs_company_isolation" ON rfi_status_logs;
DROP POLICY IF EXISTS "rfi_revisions_company_isolation" ON rfi_revisions;
DROP POLICY IF EXISTS "rfi_cost_items_company_isolation" ON rfi_cost_items;
DROP POLICY IF EXISTS "client_sessions_company_isolation" ON client_sessions;
DROP POLICY IF EXISTS "roles_read_only" ON roles;
DROP POLICY IF EXISTS "permissions_read_only" ON permissions;
DROP POLICY IF EXISTS "role_permissions_read_only" ON role_permissions;
DROP POLICY IF EXISTS "plans_read_only" ON plans;
DROP POLICY IF EXISTS "company_subscriptions_company_isolation" ON company_subscriptions;

-- Drop and recreate the helper function
DROP FUNCTION IF EXISTS get_user_company_id();
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create policies that ONLY allow authenticated users

-- Companies
CREATE POLICY "companies_authenticated_only" ON companies
  FOR ALL 
  TO authenticated 
  USING (id = get_user_company_id());

-- Users  
CREATE POLICY "users_authenticated_only" ON users
  FOR ALL 
  TO authenticated 
  USING (
    id IN (
      SELECT cu.user_id 
      FROM company_users cu 
      WHERE cu.company_id = get_user_company_id()
    )
  );

-- Company Users
CREATE POLICY "company_users_authenticated_only" ON company_users
  FOR ALL 
  TO authenticated 
  USING (company_id = get_user_company_id());

-- Projects
CREATE POLICY "projects_authenticated_only" ON projects
  FOR ALL 
  TO authenticated 
  USING (company_id = get_user_company_id());

-- RFIs
CREATE POLICY "rfis_authenticated_only" ON rfis
  FOR ALL 
  TO authenticated 
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id = get_user_company_id()
    )
  );

-- RFI Attachments
CREATE POLICY "rfi_attachments_authenticated_only" ON rfi_attachments
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Activity
CREATE POLICY "rfi_activity_authenticated_only" ON rfi_activity
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Status Logs
CREATE POLICY "rfi_status_logs_authenticated_only" ON rfi_status_logs
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Revisions
CREATE POLICY "rfi_revisions_authenticated_only" ON rfi_revisions
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Cost Items
CREATE POLICY "rfi_cost_items_authenticated_only" ON rfi_cost_items
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- Client Sessions
CREATE POLICY "client_sessions_authenticated_only" ON client_sessions
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- Roles (read-only for authenticated users)
CREATE POLICY "roles_authenticated_read_only" ON roles
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Permissions (read-only for authenticated users)
CREATE POLICY "permissions_authenticated_read_only" ON permissions
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Role Permissions (read-only for authenticated users)
CREATE POLICY "role_permissions_authenticated_read_only" ON role_permissions
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Plans (read-only for authenticated users)
CREATE POLICY "plans_authenticated_read_only" ON plans
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Company Subscriptions
CREATE POLICY "company_subscriptions_authenticated_only" ON company_subscriptions
  FOR ALL 
  TO authenticated 
  USING (company_id = get_user_company_id());

-- CRITICAL: Ensure anonymous role has NO access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM anon;

-- Grant proper permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the setup
SELECT 'RLS setup complete' as status; 
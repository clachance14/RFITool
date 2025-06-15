-- RLS Security Fix - Corrected Policies
-- This script fixes the issues found in the RLS security test

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can only access their own company" ON companies;
DROP POLICY IF EXISTS "Company isolation for projects" ON projects;
DROP POLICY IF EXISTS "Company isolation for rfis" ON rfis;
DROP POLICY IF EXISTS "Company isolation for rfi_attachments" ON rfi_attachments;
DROP POLICY IF EXISTS "Client sessions access control" ON client_sessions;
DROP POLICY IF EXISTS "Roles are read-only" ON roles;
DROP POLICY IF EXISTS "Permissions are read-only" ON permissions;
DROP POLICY IF EXISTS "Role permissions are read-only" ON role_permissions;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_user_company_id(UUID);

-- Recreate the helper function with proper security
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

-- Companies: Users can only see their own company
CREATE POLICY "company_isolation" ON companies
  FOR ALL 
  TO authenticated 
  USING (id = get_user_company_id());

-- Users: Users can see users in their company
CREATE POLICY "users_company_isolation" ON users
  FOR ALL 
  TO authenticated 
  USING (
    id IN (
      SELECT cu.user_id 
      FROM company_users cu 
      WHERE cu.company_id = get_user_company_id()
    )
  );

-- Company Users: Users can see company_users records for their company
CREATE POLICY "company_users_isolation" ON company_users
  FOR ALL 
  TO authenticated 
  USING (company_id = get_user_company_id());

-- Projects: Company isolation
CREATE POLICY "projects_company_isolation" ON projects
  FOR ALL 
  TO authenticated 
  USING (company_id = get_user_company_id());

-- RFIs: Company isolation via project
CREATE POLICY "rfis_company_isolation" ON rfis
  FOR ALL 
  TO authenticated 
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE company_id = get_user_company_id()
    )
  );

-- RFI Attachments: Company isolation via RFI
CREATE POLICY "rfi_attachments_company_isolation" ON rfi_attachments
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Activity: Company isolation via RFI
CREATE POLICY "rfi_activity_company_isolation" ON rfi_activity
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Status Logs: Company isolation via RFI
CREATE POLICY "rfi_status_logs_company_isolation" ON rfi_status_logs
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Revisions: Company isolation via RFI
CREATE POLICY "rfi_revisions_company_isolation" ON rfi_revisions
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- RFI Cost Items: Company isolation via RFI
CREATE POLICY "rfi_cost_items_company_isolation" ON rfi_cost_items
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- Client sessions: Company isolation via RFI
CREATE POLICY "client_sessions_company_isolation" ON client_sessions
  FOR ALL 
  TO authenticated 
  USING (
    rfi_id IN (
      SELECT r.id FROM rfis r
      JOIN projects p ON r.project_id = p.id
      WHERE p.company_id = get_user_company_id()
    )
  );

-- Roles: Read-only for authenticated users
CREATE POLICY "roles_read_only" ON roles
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Permissions: Read-only for authenticated users  
CREATE POLICY "permissions_read_only" ON permissions
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Role permissions: Read-only for authenticated users
CREATE POLICY "role_permissions_read_only" ON role_permissions
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Plans: Read-only for authenticated users
CREATE POLICY "plans_read_only" ON plans
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Company subscriptions: Company isolation
CREATE POLICY "company_subscriptions_company_isolation" ON company_subscriptions
  FOR ALL 
  TO authenticated 
  USING (company_id = get_user_company_id());

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 
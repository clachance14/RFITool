-- Fix App Owner RLS Policies (with CASCADE)
-- This script properly handles function dependencies and recreates everything

-- Drop the function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS get_user_company_id() CASCADE;

-- Create the updated get_user_company_id function
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
DECLARE
    user_role_id INTEGER;
    company_id UUID;
BEGIN
    -- Get the user's role
    SELECT role_id INTO user_role_id
    FROM company_users 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- If app_owner (role_id = 0), return NULL to indicate "all companies"
    IF user_role_id = 0 THEN
        RETURN NULL;
    END IF;
    
    -- For other roles, return their specific company
    SELECT cu.company_id INTO company_id
    FROM company_users cu
    WHERE cu.user_id = auth.uid()
    LIMIT 1;
    
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create the is_app_owner function
CREATE OR REPLACE FUNCTION is_app_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role_id = 0
        FROM company_users 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate all the policies that were dropped

-- Company Users policy
CREATE POLICY "company_users_app_owner_access" ON company_users
  FOR ALL
  TO authenticated 
  USING (
    -- App owner sees all
    is_app_owner()
    OR
    -- Others see their company
    company_id = get_user_company_id()
    OR
    -- Allow access to own record during signup
    user_id = auth.uid()
  )
  WITH CHECK (
    -- App owner can insert/update any record
    is_app_owner()
    OR
    -- Allow insert of own record during signup
    user_id = auth.uid()
  );

-- Companies policy
CREATE POLICY "companies_app_owner_access" ON companies
  FOR ALL 
  TO authenticated 
  USING (
    -- App owner sees all companies
    is_app_owner()
    OR
    -- Others see their own company
    id = get_user_company_id()
  )
  WITH CHECK (
    -- App owner can create/update any company
    is_app_owner()
    OR
    -- Allow creation during signup (no existing company_users record yet)
    NOT EXISTS (SELECT 1 FROM company_users WHERE user_id = auth.uid())
  );

-- Users policy
CREATE POLICY "users_app_owner_access" ON users
  FOR ALL
  TO authenticated 
  USING (
    -- App owner sees all users
    is_app_owner()
    OR
    -- Others see users in their company
    id IN (
      SELECT cu.user_id 
      FROM company_users cu 
      WHERE cu.company_id = get_user_company_id()
    )
    OR
    -- Allow access to own record
    id = auth.uid()
  )
  WITH CHECK (
    -- App owner can insert/update any user
    is_app_owner()
    OR
    -- Allow insert of own record during signup
    id = auth.uid()
  );

-- Projects policy
CREATE POLICY "projects_app_owner_access" ON projects
  FOR ALL 
  TO authenticated 
  USING (
    -- App owner sees all projects
    is_app_owner()
    OR
    -- Others see projects based on admin isolation rules
    id IN (SELECT project_id FROM get_user_projects())
  )
  WITH CHECK (
    -- App owner can create/update any project
    is_app_owner()
    OR
    -- Others can only create in their company
    company_id = get_user_company_id()
  );

-- Projects delete protection policy
CREATE POLICY "projects_delete_protection" ON projects
  FOR DELETE
  TO authenticated 
  USING (
    -- App owner can delete anything
    is_app_owner()
    OR 
    -- Others can only delete their own projects
    (created_by = auth.uid() AND company_id = get_user_company_id())
  );

-- Company subscriptions policy (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_subscriptions') THEN
        EXECUTE 'CREATE POLICY "company_subscriptions_app_owner_access" ON company_subscriptions
          FOR ALL 
          TO authenticated 
          USING (
            -- App owner sees all
            is_app_owner()
            OR
            -- Others see their company
            company_id = get_user_company_id()
          )';
    END IF;
END $$;

-- Update the get_user_projects function to handle app_owner
DROP FUNCTION IF EXISTS get_user_projects();
CREATE OR REPLACE FUNCTION get_user_projects()
RETURNS TABLE(project_id UUID) AS $$
BEGIN
  -- App owner (role_id = 0) sees ALL projects across ALL companies
  IF is_app_owner() THEN
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

-- Test the functions
SELECT 'App Owner RLS policies updated with CASCADE' as status;

-- Verify app owner can see company_users
SELECT 
    'Testing app owner access to company_users' as test,
    COUNT(*) as total_records
FROM company_users;

-- Show current user's role
SELECT 
    'Current user role check' as test,
    is_app_owner() as is_app_owner,
    get_user_company_id() as company_id; 
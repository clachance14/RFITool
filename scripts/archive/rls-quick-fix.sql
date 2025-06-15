-- Quick RLS Fix Script
-- This will temporarily fix RLS issues to test authentication

-- ===== PART 1: TEMPORARY RLS BYPASS (FOR TESTING) =====
-- This temporarily disables RLS on key tables to test if that's the issue

BEGIN;

-- Temporarily disable RLS on core tables for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;  
ALTER TABLE company_users DISABLE ROW LEVEL SECURITY;

-- Test if this fixes the login issue
SELECT 'RLS temporarily disabled for testing' as status;

-- Test a simple query that the app would make
SELECT 
    u.id,
    u.email,
    u.full_name,
    cu.company_id,
    cu.role_id,
    c.name as company_name
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
WHERE u.email = 'sarah.pm@icsconst.com';

-- If the above query works, then RLS was the issue
-- Now let's re-enable RLS with proper policies

-- ===== PART 2: RE-ENABLE RLS WITH PROPER POLICIES =====

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "users_authenticated_only" ON users;
DROP POLICY IF EXISTS "companies_authenticated_only" ON companies;
DROP POLICY IF EXISTS "company_users_authenticated_only" ON company_users;

-- Create new, more permissive policies for authenticated users
-- These allow authenticated users to access their own company's data

-- Users policy: Allow access to users in the same company
CREATE POLICY "users_company_access" ON users
    FOR ALL 
    TO authenticated 
    USING (
        id = auth.uid() OR  -- Users can always access their own record
        id IN (
            SELECT user_id FROM company_users 
            WHERE company_id = get_user_company_id()
        )
    );

-- Companies policy: Allow access to user's own company
CREATE POLICY "companies_own_company" ON companies
    FOR ALL 
    TO authenticated 
    USING (id = get_user_company_id());

-- Company_users policy: Allow access to user's own company relationships
CREATE POLICY "company_users_own_company" ON company_users
    FOR ALL 
    TO authenticated 
    USING (
        user_id = auth.uid() OR  -- Users can see their own relationships
        company_id = get_user_company_id()  -- Users can see their company's relationships
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure anonymous has no access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM anon;

-- Test the new policies
SELECT 'New RLS policies created' as status;

-- Test query again with new policies
SELECT 
    'Testing with new RLS policies...' as test_status,
    u.id,
    u.email,
    u.full_name,
    cu.company_id,
    cu.role_id,
    c.name as company_name
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
WHERE u.email = 'sarah.pm@icsconst.com';

COMMIT;

-- Final status
SELECT 'RLS fix complete - test your app now!' as final_status; 
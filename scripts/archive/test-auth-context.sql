-- Test Authentication Context in RLS
-- This tests if auth.uid() works and RLS recognizes sessions

-- ===== TEST 1: Check if auth.uid() function works =====
SELECT 
    'Testing auth.uid() function...' as test_1;

-- Test the auth.uid() function directly
SELECT 
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'User authenticated'
        ELSE 'No authenticated user'
    END as auth_status;

-- ===== TEST 2: Test get_user_company_id() function =====
SELECT 
    'Testing get_user_company_id() function...' as test_2;

-- Test our custom function
SELECT 
    get_user_company_id() as user_company_id,
    CASE 
        WHEN get_user_company_id() IS NOT NULL THEN 'Company found'
        ELSE 'No company for user'
    END as company_status;

-- ===== TEST 3: Test RLS with a known user ID =====
SELECT 
    'Testing manual user context...' as test_3;

-- Temporarily set the user context for testing
-- (This simulates what happens when a user is logged in)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get Sarah's user ID
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'sarah.pm@icsconst.com' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found test user ID: %', test_user_id;
        
        -- Test if we can query company_users with this user ID
        IF EXISTS (
            SELECT 1 FROM company_users 
            WHERE user_id = test_user_id
        ) THEN
            RAISE NOTICE '✅ company_users table accessible for user';
        ELSE
            RAISE NOTICE '❌ No company_users record found for user';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Test user not found';
    END IF;
END $$;

-- ===== TEST 4: Check RLS policy effectiveness =====
SELECT 
    'Testing RLS policy queries...' as test_4;

-- These queries will fail if RLS is working and no user is authenticated
-- That's actually good - it means RLS is protecting the data

-- Test users table access (should fail without auth context)
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM users WHERE email = 'sarah.pm@icsconst.com') THEN
            RAISE NOTICE '⚠️ Users table accessible without auth (RLS may be off)';
        ELSE
            RAISE NOTICE '⚠️ Users table empty or inaccessible';
        END IF;
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '✅ Users table properly protected by RLS';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Users table error: %', SQLERRM;
    END;
END $$;

-- ===== TEST 5: Show current session info =====
SELECT 
    'Checking current session info...' as test_5;

-- Show what the database knows about the current session
SELECT 
    current_user as db_user,
    current_setting('role') as current_role,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- ===== SUMMARY =====
SELECT 
    'Test complete - check output above' as summary;

-- Test Auth Context - Simple Diagnostic Queries
-- Run these queries to identify what's missing for authentication

-- 1. Check table row counts
SELECT 'USERS' as table_name, COUNT(*) as count FROM users;
SELECT 'COMPANIES' as table_name, COUNT(*) as count FROM companies;  
SELECT 'ROLES' as table_name, COUNT(*) as count FROM roles;
SELECT 'COMPANY_USERS' as table_name, COUNT(*) as count FROM company_users;

-- 2. Show roles (should have admin, rfi_user, etc.)
SELECT * FROM roles ORDER BY id;

-- 3. Show companies (should have test companies)
SELECT * FROM companies ORDER BY name;

-- 4. Show users (should have test users)
SELECT id, email, full_name FROM users ORDER BY email;

-- 5. Show user-company-role relationships
SELECT 
    u.email,
    c.name as company,
    r.name as role
FROM company_users cu
JOIN users u ON cu.user_id = u.id
JOIN companies c ON cu.company_id = c.id
JOIN roles r ON cu.role_id = r.id
ORDER BY u.email; 
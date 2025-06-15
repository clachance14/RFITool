-- Comprehensive Database Schema Diagnostic
-- Run this in your Supabase SQL Editor to find the exact issue

-- ===== STEP 1: Test Basic Database Connection =====
SELECT 'Database connection working' as status;

-- ===== STEP 2: Check if core tables exist =====
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'companies', 'company_users', 'roles', 'projects', 'rfis')
ORDER BY table_name;

-- ===== STEP 3: Test the get_user_company_id function =====
-- This function is critical for RLS policies
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_user_company_id' 
            AND routine_schema = 'public'
        ) 
        THEN '✅ Function exists'
        ELSE '❌ Function missing'
    END as get_user_company_id_status;

-- Test if the function works with a test user
DO $$
DECLARE
    test_user_id UUID;
    company_id UUID;
BEGIN
    -- Get one of our test users
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'sarah.pm@icsconst.com' LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the company lookup
        SELECT cu.company_id INTO company_id 
        FROM company_users cu 
        WHERE cu.user_id = test_user_id 
        LIMIT 1;
        
        IF company_id IS NOT NULL THEN
            RAISE NOTICE '✅ User-company relationship works: % -> %', test_user_id, company_id;
        ELSE
            RAISE NOTICE '❌ No company found for user: %', test_user_id;
        END IF;
    ELSE
        RAISE NOTICE '❌ Test user not found';
    END IF;
END $$;

-- ===== STEP 4: Check RLS status on core tables =====
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'companies', 'company_users', 'projects', 'rfis')
ORDER BY tablename;

-- ===== STEP 5: Check RLS policies =====
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'companies', 'company_users')
ORDER BY tablename, policyname;

-- ===== STEP 6: Test authenticated role permissions =====
SELECT 
    table_name,
    privilege_type,
    grantee,
    CASE WHEN grantee = 'authenticated' THEN '✅ HAS ACCESS' ELSE '⚠️ OTHER' END as auth_access
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'companies', 'company_users')
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- ===== STEP 7: Test a simple query that the app would make =====
-- This simulates what happens when someone tries to log in

-- Test 1: Can we query users table?
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
            RAISE NOTICE '✅ Users table accessible';
        ELSE
            RAISE NOTICE '⚠️ Users table empty but accessible';
        END IF;
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ Users table: insufficient_privilege';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Users table error: %', SQLERRM;
    END;
END $$;

-- Test 2: Can we query company_users table?
DO $$
BEGIN
    BEGIN
        IF EXISTS (SELECT 1 FROM company_users LIMIT 1) THEN
            RAISE NOTICE '✅ Company_users table accessible';
        ELSE
            RAISE NOTICE '⚠️ Company_users table empty but accessible';
        END IF;
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ Company_users table: insufficient_privilege';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Company_users table error: %', SQLERRM;
    END;
END $$;

-- Test 3: Test the exact query the app uses for user lookup
DO $$
DECLARE
    user_record RECORD;
BEGIN
    BEGIN
        -- This simulates the query used during login
        SELECT u.*, cu.company_id, cu.role_id 
        INTO user_record
        FROM users u
        JOIN company_users cu ON u.id = cu.user_id
        WHERE u.email = 'sarah.pm@icsconst.com'
        LIMIT 1;
        
        IF user_record.id IS NOT NULL THEN
            RAISE NOTICE '✅ Login query simulation successful for: %', user_record.email;
            RAISE NOTICE '    User ID: %', user_record.id;
            RAISE NOTICE '    Company ID: %', user_record.company_id;
            RAISE NOTICE '    Role ID: %', user_record.role_id;
        ELSE
            RAISE NOTICE '❌ Login query simulation: No user found';
        END IF;
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ Login query simulation: insufficient_privilege';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Login query simulation error: %', SQLERRM;
    END;
END $$;

-- ===== STEP 8: Check for missing critical functions or triggers =====
SELECT 
    routine_name,
    routine_type,
    CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_company_id', 'update_updated_at_column')
ORDER BY routine_name;

-- ===== FINAL SUMMARY =====
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DIAGNOSTIC SUMMARY ===';
    RAISE NOTICE 'Check the output above for any ❌ errors';
    RAISE NOTICE 'Common issues:';
    RAISE NOTICE '1. Missing get_user_company_id() function';
    RAISE NOTICE '2. RLS policies too restrictive';
    RAISE NOTICE '3. Missing permissions for authenticated role';
    RAISE NOTICE '4. Auth user not properly linked to company_users';
END $$;

-- Diagnose Schema Error - Simple Queries
-- Run each query separately to see results

-- 1. Check if core tables have any data
SELECT 'USERS TABLE' as table_name, COUNT(*) as row_count FROM users;

SELECT 'COMPANIES TABLE' as table_name, COUNT(*) as row_count FROM companies;

SELECT 'ROLES TABLE' as table_name, COUNT(*) as row_count FROM roles;

SELECT 'COMPANY_USERS TABLE' as table_name, COUNT(*) as row_count FROM company_users;

-- 2. Show what roles exist (if any)
SELECT 'AVAILABLE ROLES' as section, id, name, description FROM roles ORDER BY id;

-- 3. Show what companies exist (if any)
SELECT 'AVAILABLE COMPANIES' as section, id, name FROM companies ORDER BY name;

-- 4. Show what users exist (if any)
SELECT 'AVAILABLE USERS' as section, id, email, full_name FROM users ORDER BY email;

-- 5. Show company-user relationships (if any)
SELECT 
    'COMPANY USER RELATIONSHIPS' as section,
    cu.user_id,
    cu.company_id, 
    cu.role_id,
    u.email,
    c.name as company_name,
    r.name as role_name
FROM company_users cu
LEFT JOIN users u ON cu.user_id = u.id
LEFT JOIN companies c ON cu.company_id = c.id  
LEFT JOIN roles r ON cu.role_id = r.id
ORDER BY u.email; 
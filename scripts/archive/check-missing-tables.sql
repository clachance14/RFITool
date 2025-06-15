-- Check for Missing Tables in Database Schema
-- This will help identify what tables are missing

-- ===== CHECK ALL EXISTING TABLES =====
SELECT 
    'EXISTING TABLES' as check_type,
    tablename,
    CASE WHEN tablename IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ===== CHECK SPECIFIC TABLES NEEDED BY THE APP =====
SELECT 
    'CHECKING CORE TABLES' as check_type;

-- Test each table individually
DO $$
DECLARE
    tbl_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- List of tables the app expects
    FOR tbl_name IN 
        SELECT unnest(ARRAY[
            'users', 
            'companies', 
            'company_users', 
            'roles', 
            'permissions', 
            'role_permissions',
            'projects', 
            'rfis',
            'plans',
            'company_subscriptions'
        ])
    LOOP
        -- Check if table exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = tbl_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ Table exists: %', tbl_name;
        ELSE
            RAISE NOTICE '❌ Table MISSING: %', tbl_name;
        END IF;
    END LOOP;
END $$;

-- ===== CHECK FOREIGN KEY CONSTRAINTS =====
SELECT 
    'FOREIGN KEY CONSTRAINTS' as check_type,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ===== CHECK IF WE CAN QUERY ESSENTIAL TABLES =====
DO $$
BEGIN
    -- Test users table
    BEGIN
        IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
            RAISE NOTICE '✅ Can query users table';
        ELSE
            RAISE NOTICE '⚠️ Users table empty but accessible';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Cannot query users table: %', SQLERRM;
    END;

    -- Test companies table
    BEGIN
        IF EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
            RAISE NOTICE '✅ Can query companies table';
        ELSE
            RAISE NOTICE '⚠️ Companies table empty but accessible';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Cannot query companies table: %', SQLERRM;
    END;

    -- Test company_users table
    BEGIN
        IF EXISTS (SELECT 1 FROM company_users LIMIT 1) THEN
            RAISE NOTICE '✅ Can query company_users table';
        ELSE
            RAISE NOTICE '⚠️ Company_users table empty but accessible';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Cannot query company_users table: %', SQLERRM;
    END;

    -- Test roles table
    BEGIN
        IF EXISTS (SELECT 1 FROM roles LIMIT 1) THEN
            RAISE NOTICE '✅ Can query roles table';
        ELSE
            RAISE NOTICE '⚠️ Roles table empty but accessible';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Cannot query roles table: %', SQLERRM;
    END;

    -- Test the specific query that useUserRole makes
    BEGIN
        IF EXISTS (
            SELECT role_id 
            FROM company_users 
            WHERE user_id = '3150e052-b6a9-4c97-8df2-ac337ab5d323'
        ) THEN
            RAISE NOTICE '✅ Can run useUserRole query successfully';
        ELSE
            RAISE NOTICE '⚠️ useUserRole query runs but returns no data';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ useUserRole query failed: %', SQLERRM;
    END;
END $$;

-- ===== FINAL SUMMARY =====
SELECT 'Database schema check complete' as status; 
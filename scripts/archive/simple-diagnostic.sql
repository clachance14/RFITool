-- Simple Database Diagnostic - Show what tables exist and basic info
-- This avoids PL/pgSQL blocks that might not show output properly

-- ===== SHOW ALL EXISTING TABLES =====
SELECT 
    'EXISTING TABLES' as section,
    tablename as table_name,
    '✅ EXISTS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ===== CHECK FOR EXPECTED CORE TABLES =====
SELECT 
    'CORE TABLE CHECK' as section,
    expected_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = expected_table
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('users'),
        ('companies'), 
        ('company_users'),
        ('roles'),
        ('permissions'),
        ('role_permissions'),
        ('projects'),
        ('rfis'),
        ('plans'),
        ('company_subscriptions')
) AS expected(expected_table)
ORDER BY expected_table;

-- ===== SHOW ROW COUNTS FOR KEY TABLES =====
SELECT 
    'ROW COUNTS' as section,
    'users' as table_name,
    (SELECT COUNT(*) FROM users) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')

UNION ALL

SELECT 
    'ROW COUNTS' as section,
    'companies' as table_name,
    (SELECT COUNT(*) FROM companies) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')

UNION ALL

SELECT 
    'ROW COUNTS' as section,
    'company_users' as table_name,
    (SELECT COUNT(*) FROM company_users) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_users')

UNION ALL

SELECT 
    'ROW COUNTS' as section,
    'roles' as table_name,
    (SELECT COUNT(*) FROM roles) as row_count
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles')

ORDER BY table_name;

-- ===== TEST THE PROBLEMATIC QUERY =====
SELECT 
    'USERROLE QUERY TEST' as section,
    'Testing company_users query' as test_description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_users')
        THEN 'Table exists - can test query'
        ELSE 'Table missing - cannot test'
    END as result; 
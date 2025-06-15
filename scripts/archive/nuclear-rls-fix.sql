-- Nuclear RLS Fix - Completely disable RLS on ALL tables
-- This is for testing only to isolate the authentication issue

BEGIN;

-- Get all tables that have RLS enabled
DO $$
DECLARE
    table_record RECORD;
BEGIN
    RAISE NOTICE '🚨 NUCLEAR RLS FIX - DISABLING ALL RLS POLICIES';
    
    -- Disable RLS on ALL tables in public schema
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
            RAISE NOTICE 'Disabled RLS on table: %', table_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not disable RLS on %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Drop ALL policies on ALL tables
    FOR table_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY %I ON %I', table_record.policyname, table_record.tablename);
            RAISE NOTICE 'Dropped policy % on table %', table_record.policyname, table_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy % on %: %', table_record.policyname, table_record.tablename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ ALL RLS DISABLED';
END $$;

-- Grant FULL permissions to authenticated role on ALL tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO authenticated;

-- Still block anonymous access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM anon;

-- Test the complete bypass
SELECT 'Nuclear RLS fix applied - testing...' as status;

-- Test the user query that should work now
SELECT 
    'Testing with NO RLS:' as test,
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
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚨🚨🚨 NUCLEAR RLS FIX COMPLETE 🚨🚨🚨';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  ALL ROW LEVEL SECURITY DISABLED';
    RAISE NOTICE '⚠️  ALL POLICIES REMOVED';
    RAISE NOTICE '⚠️  THIS IS FOR TESTING ONLY!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ If login works now, the issue was RLS';
    RAISE NOTICE '❌ If login still fails, the issue is deeper';
    RAISE NOTICE '';
    RAISE NOTICE 'Test your app immediately!';
END $$; 
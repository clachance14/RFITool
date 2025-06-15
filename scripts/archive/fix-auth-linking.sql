-- Diagnostic and Fix Script for Auth User Linking
-- Run this in your Supabase SQL Editor

-- First, let's see what we have
DO $$
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC: Current Database State ===';
END $$;

-- Check auth users
SELECT 
    'AUTH USERS' as table_name,
    COUNT(*) as count
FROM auth.users;

SELECT 
    'AUTH USERS DETAILS' as info,
    id,
    email,
    email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email LIKE '%icsconst.com' OR email LIKE '%metrodev.com'
ORDER BY email;

-- Check database user profiles  
SELECT 
    'DATABASE PROFILES' as table_name,
    COUNT(*) as count
FROM users
WHERE email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
);

SELECT 
    'DATABASE PROFILE DETAILS' as info,
    id,
    email,
    full_name
FROM users
WHERE email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
)
ORDER BY email;

-- Check if IDs match between auth users and database profiles
SELECT 
    'AUTH vs DATABASE ID MATCH' as check_type,
    au.email,
    au.id as auth_id,
    u.id as db_id,
    CASE WHEN au.id = u.id THEN 'MATCH' ELSE 'NO MATCH' END as status
FROM auth.users au
LEFT JOIN users u ON au.email = u.email
WHERE au.email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
)
ORDER BY au.email;

-- Now let's fix any mismatched IDs
DO $$
DECLARE
    auth_user RECORD;
    db_user RECORD;
    old_id UUID;
BEGIN
    RAISE NOTICE '=== FIXING AUTH USER LINKING ===';
    
    -- Temporarily disable foreign key constraints
    SET session_replication_role = replica;
    
    FOR auth_user IN 
        SELECT id, email 
        FROM auth.users 
        WHERE email IN (
            'sarah.pm@icsconst.com',
            'mike.rfi@icsconst.com', 
            'alex@metrodev.com',
            'emma.view@icsconst.com',
            'jordan.admin@icsconst.com'
        )
    LOOP
        -- Get the database user
        SELECT * INTO db_user FROM users WHERE email = auth_user.email;
        
        IF db_user.id IS NOT NULL AND db_user.id != auth_user.id THEN
            old_id := db_user.id;
            
            RAISE NOTICE 'Updating user % from % to %', auth_user.email, old_id, auth_user.id;
            
            -- Update company_users first (to avoid FK constraint issues)
            UPDATE company_users 
            SET user_id = auth_user.id 
            WHERE user_id = old_id;
            
            -- Update the user profile ID
            UPDATE users 
            SET id = auth_user.id, updated_at = NOW()
            WHERE id = old_id;
            
            RAISE NOTICE 'Successfully updated user: %', auth_user.email;
        ELSIF db_user.id = auth_user.id THEN
            RAISE NOTICE 'User % already linked correctly', auth_user.email;
        ELSE
            RAISE NOTICE 'No database profile found for %', auth_user.email;
        END IF;
    END LOOP;
    
    -- Re-enable foreign key constraints
    SET session_replication_role = DEFAULT;
    
    RAISE NOTICE '=== LINKING COMPLETE ===';
END $$;

-- Final verification
SELECT 
    'FINAL VERIFICATION' as status,
    u.full_name,
    u.email,
    c.name as company_name,
    CASE cu.role_id
        WHEN 1 THEN 'super_admin'
        WHEN 2 THEN 'admin' 
        WHEN 3 THEN 'rfi_user'
        WHEN 4 THEN 'view_only'
        WHEN 5 THEN 'client_collaborator'
        ELSE 'unknown'
    END as role_name,
    u.id as user_id,
    au.id as auth_id,
    CASE WHEN u.id = au.id THEN '✅ LINKED' ELSE '❌ NOT LINKED' END as link_status
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
)
ORDER BY u.full_name;

-- Fix Auth Linking - Create Missing Supabase Auth Users
-- This creates auth.users entries for our test users

-- WARNING: This approach creates auth users directly in the database
-- This is not the normal way but works for test users
-- In production, users should sign up through the normal Supabase Auth flow

-- First, let's create the auth users for our test accounts
-- We'll use a known password for all test users: TestPass123!

-- Note: In a real scenario, you'd have users sign up normally through Supabase Auth UI
-- But for testing, we can create them directly

-- Method 1: Create auth users using Supabase's admin functions
-- (This requires admin privileges)

DO $$
DECLARE
    test_users TEXT[][] := ARRAY[
        ['sarah.pm@icsconst.com', 'Sarah Johnson', '3150e052-b6a9-4c97-8df2-ac337ab5d323'],
        ['mike.rfi@icsconst.com', 'Mike Chen', '2eaa29ff-38a4-41d2-804c-375b932214d7'],
        ['alex@metrodev.com', 'Alex Rodriguez', '6228278a-cb1b-4e4e-b49b-93d67e662fe9'],
        ['emma.view@icsconst.com', 'Emma Davis', 'd52ca1e9-0f15-40b1-8ee6-0823b3a260d2'],
        ['jordan.admin@icsconst.com', 'Jordan Smith', 'dd2dd798-d5a2-451d-a4e2-9ee2521baaa8']
    ];
    user_record TEXT[];
    user_email TEXT;
    user_name TEXT;
    user_id UUID;
    auth_exists BOOLEAN;
BEGIN
    FOREACH user_record SLICE 1 IN ARRAY test_users
    LOOP
        user_email := user_record[1];
        user_name := user_record[2];
        user_id := user_record[3]::UUID;
        
        -- Check if auth user already exists
        SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO auth_exists;
        
        IF NOT auth_exists THEN
            -- Insert into auth.users table directly
            -- This is a workaround for testing - normally done through Supabase Auth API
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                role,
                aud,
                confirmation_token,
                email_change_token_new,
                recovery_token
            ) VALUES (
                user_id,
                '00000000-0000-0000-0000-000000000000',
                user_email,
                crypt('TestPass123!', gen_salt('bf')), -- Hash the password
                NOW(),
                NOW(),
                NOW(),
                'authenticated',
                'authenticated',
                '',
                '',
                ''
            );
            
            RAISE NOTICE 'Created auth user for: %', user_email;
        ELSE
            RAISE NOTICE 'Auth user already exists for: %', user_email;
        END IF;
    END LOOP;
END $$; 
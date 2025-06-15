-- Check Supabase Auth Users vs Custom Users Table
-- This will show us what's missing

-- 1. Check what's in the auth.users table (Supabase Auth)
SELECT 
    'AUTH.USERS (Supabase Auth)' as section,
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users
ORDER BY email;

-- 2. Check what's in the public.users table (Our app)
SELECT 
    'PUBLIC.USERS (Our App)' as section,
    id,
    email,
    full_name,
    created_at
FROM public.users
ORDER BY email;

-- 3. Find users that exist in public.users but NOT in auth.users
SELECT 
    'MISSING FROM AUTH.USERS' as section,
    p.email,
    p.full_name,
    'Missing from Supabase Auth' as status
FROM public.users p
LEFT JOIN auth.users a ON p.id = a.id
WHERE a.id IS NULL
ORDER BY p.email;

-- 4. Find users that exist in auth.users but NOT in public.users
SELECT 
    'MISSING FROM PUBLIC.USERS' as section,
    a.email,
    a.id,
    'Missing from app users table' as status
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL
ORDER BY a.email;

-- 5. Check if our test user emails exist in auth.users
SELECT 
    'TEST USER AUTH STATUS' as section,
    test_email,
    CASE 
        WHEN a.email IS NOT NULL THEN '✅ EXISTS IN AUTH'
        ELSE '❌ MISSING FROM AUTH'
    END as auth_status
FROM (
    VALUES 
        ('sarah.pm@icsconst.com'),
        ('mike.rfi@icsconst.com'),
        ('alex@metrodev.com'),
        ('emma.view@icsconst.com'),
        ('jordan.admin@icsconst.com')
) AS test_users(test_email)
LEFT JOIN auth.users a ON a.email = test_users.test_email
ORDER BY test_email; 
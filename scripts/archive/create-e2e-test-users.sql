-- E2E Test Users Setup for RFITrak
-- Run this in your Supabase SQL Editor
-- 
-- IMPORTANT: This script creates user profiles and company relationships,
-- but you'll need to create the actual auth users through the Supabase Dashboard
-- or Auth API (see instructions at the bottom)

BEGIN;

-- ================================================================
-- STEP 1: CREATE TEST COMPANIES
-- ================================================================

-- Create ICS Construction company (only if it doesn't exist)
INSERT INTO companies (name, created_at, updated_at)
SELECT 'ICS Construction', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE name = 'ICS Construction'
);

-- Create Metro Development company (only if it doesn't exist)
INSERT INTO companies (name, created_at, updated_at)
SELECT 'Metro Development', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE name = 'Metro Development'
);

-- ================================================================
-- STEP 2: GET COMPANY IDs FOR REFERENCE
-- ================================================================

-- This will help us reference the company IDs
DO $$
DECLARE
    ics_company_id UUID;
    metro_company_id UUID;
BEGIN
    -- Get company IDs
    SELECT id INTO ics_company_id FROM companies WHERE name = 'ICS Construction';
    SELECT id INTO metro_company_id FROM companies WHERE name = 'Metro Development';
    
    -- Store them in a temporary table for the rest of the script
    CREATE TEMP TABLE temp_companies (
        name TEXT,
        company_id UUID
    );
    
    INSERT INTO temp_companies VALUES 
        ('ICS Construction', ics_company_id),
        ('Metro Development', metro_company_id);
        
    RAISE NOTICE 'ICS Construction ID: %', ics_company_id;
    RAISE NOTICE 'Metro Development ID: %', metro_company_id;
END $$;

-- ================================================================
-- STEP 3: CREATE PLACEHOLDER USER PROFILES
-- ================================================================
-- Note: These will be updated with real auth user IDs after creating auth users

-- Generate placeholder UUIDs for each test user
DO $$
DECLARE
    sarah_id UUID := gen_random_uuid();
    mike_id UUID := gen_random_uuid();
    alex_id UUID := gen_random_uuid();
    emma_id UUID := gen_random_uuid();
    jordan_id UUID := gen_random_uuid();
    ics_company_id UUID;
    metro_company_id UUID;
BEGIN
    -- Get company IDs
    SELECT company_id INTO ics_company_id FROM temp_companies WHERE name = 'ICS Construction';
    SELECT company_id INTO metro_company_id FROM temp_companies WHERE name = 'Metro Development';
    
    -- Create user profiles (only if they don't exist)
    -- Sarah Johnson (admin)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarah.pm@icsconst.com') THEN
        INSERT INTO users (id, email, full_name, status, created_at, updated_at) 
        VALUES (sarah_id, 'sarah.pm@icsconst.com', 'Sarah Johnson', 'active', NOW(), NOW());
    ELSE
        -- Get existing user ID
        SELECT id INTO sarah_id FROM users WHERE email = 'sarah.pm@icsconst.com';
        -- Update the existing user
        UPDATE users SET full_name = 'Sarah Johnson', updated_at = NOW() 
        WHERE email = 'sarah.pm@icsconst.com';
    END IF;
    
    -- Mike Chen (rfi_user)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'mike.rfi@icsconst.com') THEN
        INSERT INTO users (id, email, full_name, status, created_at, updated_at) 
        VALUES (mike_id, 'mike.rfi@icsconst.com', 'Mike Chen', 'active', NOW(), NOW());
    ELSE
        SELECT id INTO mike_id FROM users WHERE email = 'mike.rfi@icsconst.com';
        UPDATE users SET full_name = 'Mike Chen', updated_at = NOW() 
        WHERE email = 'mike.rfi@icsconst.com';
    END IF;
    
    -- Alex Rodriguez (client_collaborator)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'alex@metrodev.com') THEN
        INSERT INTO users (id, email, full_name, status, created_at, updated_at) 
        VALUES (alex_id, 'alex@metrodev.com', 'Alex Rodriguez', 'active', NOW(), NOW());
    ELSE
        SELECT id INTO alex_id FROM users WHERE email = 'alex@metrodev.com';
        UPDATE users SET full_name = 'Alex Rodriguez', updated_at = NOW() 
        WHERE email = 'alex@metrodev.com';
    END IF;
    
    -- Emma Davis (view_only)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'emma.view@icsconst.com') THEN
        INSERT INTO users (id, email, full_name, status, created_at, updated_at) 
        VALUES (emma_id, 'emma.view@icsconst.com', 'Emma Davis', 'active', NOW(), NOW());
    ELSE
        SELECT id INTO emma_id FROM users WHERE email = 'emma.view@icsconst.com';
        UPDATE users SET full_name = 'Emma Davis', updated_at = NOW() 
        WHERE email = 'emma.view@icsconst.com';
    END IF;
    
    -- Jordan Smith (super_admin)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'jordan.admin@icsconst.com') THEN
        INSERT INTO users (id, email, full_name, status, created_at, updated_at) 
        VALUES (jordan_id, 'jordan.admin@icsconst.com', 'Jordan Smith', 'active', NOW(), NOW());
    ELSE
        SELECT id INTO jordan_id FROM users WHERE email = 'jordan.admin@icsconst.com';
        UPDATE users SET full_name = 'Jordan Smith', updated_at = NOW() 
        WHERE email = 'jordan.admin@icsconst.com';
    END IF;
    
    -- Link users to companies with appropriate roles (only if not already linked)
    -- Sarah Johnson - admin at ICS Construction
    IF NOT EXISTS (SELECT 1 FROM company_users WHERE user_id = sarah_id AND company_id = ics_company_id) THEN
        INSERT INTO company_users (user_id, company_id, role_id, created_at) 
        VALUES (sarah_id, ics_company_id, 2, NOW());
    ELSE
        UPDATE company_users SET role_id = 2, created_at = NOW() 
        WHERE user_id = sarah_id AND company_id = ics_company_id;
    END IF;
    
    -- Mike Chen - rfi_user at ICS Construction
    IF NOT EXISTS (SELECT 1 FROM company_users WHERE user_id = mike_id AND company_id = ics_company_id) THEN
        INSERT INTO company_users (user_id, company_id, role_id, created_at) 
        VALUES (mike_id, ics_company_id, 3, NOW());
    ELSE
        UPDATE company_users SET role_id = 3, created_at = NOW() 
        WHERE user_id = mike_id AND company_id = ics_company_id;
    END IF;
    
    -- Alex Rodriguez - client_collaborator at Metro Development
    IF NOT EXISTS (SELECT 1 FROM company_users WHERE user_id = alex_id AND company_id = metro_company_id) THEN
        INSERT INTO company_users (user_id, company_id, role_id, created_at) 
        VALUES (alex_id, metro_company_id, 5, NOW());
    ELSE
        UPDATE company_users SET role_id = 5, created_at = NOW() 
        WHERE user_id = alex_id AND company_id = metro_company_id;
    END IF;
    
    -- Emma Davis - view_only at ICS Construction
    IF NOT EXISTS (SELECT 1 FROM company_users WHERE user_id = emma_id AND company_id = ics_company_id) THEN
        INSERT INTO company_users (user_id, company_id, role_id, created_at) 
        VALUES (emma_id, ics_company_id, 4, NOW());
    ELSE
        UPDATE company_users SET role_id = 4, created_at = NOW() 
        WHERE user_id = emma_id AND company_id = ics_company_id;
    END IF;
    
    -- Jordan Smith - super_admin at ICS Construction
    IF NOT EXISTS (SELECT 1 FROM company_users WHERE user_id = jordan_id AND company_id = ics_company_id) THEN
        INSERT INTO company_users (user_id, company_id, role_id, created_at) 
        VALUES (jordan_id, ics_company_id, 1, NOW());
    ELSE
        UPDATE company_users SET role_id = 1, created_at = NOW() 
        WHERE user_id = jordan_id AND company_id = ics_company_id;
    END IF;
        
    -- Store the generated IDs for reference
    CREATE TEMP TABLE temp_user_ids (
        email TEXT,
        placeholder_id UUID,
        role_name TEXT,
        company_name TEXT
    );
    
    INSERT INTO temp_user_ids VALUES
        ('sarah.pm@icsconst.com', sarah_id, 'admin', 'ICS Construction'),
        ('mike.rfi@icsconst.com', mike_id, 'rfi_user', 'ICS Construction'),
        ('alex@metrodev.com', alex_id, 'client_collaborator', 'Metro Development'),
        ('emma.view@icsconst.com', emma_id, 'view_only', 'ICS Construction'),
        ('jordan.admin@icsconst.com', jordan_id, 'super_admin', 'ICS Construction');
        
    RAISE NOTICE '===== PLACEHOLDER USER IDs CREATED =====';
    RAISE NOTICE 'Sarah Johnson (admin): %', sarah_id;
    RAISE NOTICE 'Mike Chen (rfi_user): %', mike_id;
    RAISE NOTICE 'Alex Rodriguez (client_collaborator): %', alex_id;
    RAISE NOTICE 'Emma Davis (view_only): %', emma_id;
    RAISE NOTICE 'Jordan Smith (super_admin): %', jordan_id;
END $$;

-- ================================================================
-- STEP 4: VERIFY SETUP
-- ================================================================

-- Display created users and their roles
SELECT 
    u.full_name,
    u.email,
    c.name as company_name,
    r.name as role_name,
    u.id as user_id,
    cu.company_id
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
LEFT JOIN roles r ON cu.role_id = r.id
WHERE u.email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
)
ORDER BY u.full_name;

COMMIT;

-- ================================================================
-- NEXT STEPS: CREATE AUTH USERS
-- ================================================================

/*
NOW YOU NEED TO CREATE THE ACTUAL AUTH USERS:

Option 1: Use Supabase Dashboard
1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user" for each email:
   
   📧 sarah.pm@icsconst.com
   👤 Sarah Johnson  
   🔑 TestPass123!
   
   📧 mike.rfi@icsconst.com
   👤 Mike Chen
   🔑 TestPass123!
   
   📧 alex@metrodev.com  
   👤 Alex Rodriguez
   🔑 TestPass123!
   
   📧 emma.view@icsconst.com
   👤 Emma Davis
   🔑 TestPass123!
   
   📧 jordan.admin@icsconst.com
   👤 Jordan Smith  
   🔑 TestPass123!

3. After creating each auth user, run the update-auth-user-ids.sql script

Option 2: Use the Admin API (requires service role key)
Run: node scripts/create-auth-users.js (create this script if needed)

AFTER CREATING AUTH USERS, run the update-auth-user-ids.sql script to link them properly.
*/ 
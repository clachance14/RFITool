-- Update Script: Link Auth Users to Profiles
-- Run this AFTER creating the auth users in Supabase Dashboard
-- This will update the placeholder user IDs with real auth user IDs

BEGIN;

-- Temporarily disable foreign key checks to allow smooth ID updates
SET session_replication_role = replica;

DO $$
DECLARE
    auth_user RECORD;
    existing_user RECORD;
    old_id UUID;
BEGIN
    RAISE NOTICE 'Starting auth user ID updates...';
    
    -- For each auth user, update the corresponding profile
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
        -- Check if we have a placeholder user for this email
        SELECT * INTO existing_user 
        FROM users 
        WHERE email = auth_user.email;
        
        IF existing_user.id IS NOT NULL THEN
            old_id := existing_user.id;
            
            -- Update the user's ID to match the auth user ID
            UPDATE users 
            SET id = auth_user.id, updated_at = NOW()
            WHERE id = existing_user.id;
            
            -- Update company_users to point to the new auth user ID
            UPDATE company_users 
            SET user_id = auth_user.id 
            WHERE user_id = old_id;
            
            RAISE NOTICE 'Updated user: % (% -> %)', 
                auth_user.email, old_id, auth_user.id;
        ELSE
            RAISE NOTICE 'No existing user found for: %', auth_user.email;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Auth user ID updates completed!';
END $$;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify the updates
SELECT 
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
    au.email as auth_email
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
)
ORDER BY u.full_name;

COMMIT; 
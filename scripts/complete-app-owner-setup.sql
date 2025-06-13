-- Complete App Owner Setup
-- This script handles all scenarios to properly set up the app owner account
-- Run this after signing up with cory@pipetrak.co

DO $$
DECLARE
    auth_user_id UUID;
    placeholder_user_id UUID;
    app_owner_company_id UUID;
    existing_user_record RECORD;
BEGIN
    -- Get your auth user ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'cory@pipetrak.co';
    
    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found. Please sign up first with cory@pipetrak.co';
    END IF;
    
    RAISE NOTICE 'Found auth user ID: %', auth_user_id;
    
    -- Get app owner company ID
    SELECT id INTO app_owner_company_id
    FROM companies 
    WHERE name = 'RFITrak System Administration';
    
    IF app_owner_company_id IS NULL THEN
        RAISE EXCEPTION 'App owner company not found. Please run create-app-owner.sql first';
    END IF;
    
    RAISE NOTICE 'Found app owner company ID: %', app_owner_company_id;
    
    -- Check if auth user already has a user record
    SELECT * INTO existing_user_record
    FROM users 
    WHERE id = auth_user_id;
    
    IF existing_user_record.id IS NULL THEN
        -- Auth user doesn't have a user record, create it
        RAISE NOTICE 'Creating user record for auth user...';
        INSERT INTO users (id, email, full_name, status, created_at, updated_at)
        VALUES (auth_user_id, 'cory@pipetrak.co', 'Cory (App Owner)', 'active', NOW(), NOW());
        RAISE NOTICE 'User record created successfully';
    ELSE
        -- Update existing user record
        RAISE NOTICE 'Updating existing user record...';
        UPDATE users 
        SET full_name = 'Cory (App Owner)', email = 'cory@pipetrak.co'
        WHERE id = auth_user_id;
        RAISE NOTICE 'User record updated successfully';
    END IF;
    
    -- Handle placeholder user if it exists
    SELECT id INTO placeholder_user_id
    FROM users 
    WHERE email = 'cory@pipetrak.co' AND id != auth_user_id;
    
    IF placeholder_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found placeholder user, cleaning up...';
        
        -- Update company_users to point to real auth user
        UPDATE company_users 
        SET user_id = auth_user_id, role_id = 0
        WHERE user_id = placeholder_user_id;
        
        -- Delete placeholder user
        DELETE FROM users WHERE id = placeholder_user_id;
        
        RAISE NOTICE 'Placeholder user cleaned up successfully';
    ELSE
        -- No placeholder, check if auth user has company_users record
        IF EXISTS (SELECT 1 FROM company_users WHERE user_id = auth_user_id) THEN
            -- Update existing company_users record
            RAISE NOTICE 'Updating existing company_users record...';
            UPDATE company_users 
            SET role_id = 0, company_id = app_owner_company_id
            WHERE user_id = auth_user_id;
        ELSE
            -- Create new company_users record
            RAISE NOTICE 'Creating company_users record...';
            INSERT INTO company_users (user_id, company_id, role_id, created_at, updated_at)
            VALUES (auth_user_id, app_owner_company_id, 0, NOW(), NOW());
        END IF;
        
        RAISE NOTICE 'Company_users record handled successfully';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 App owner setup completed successfully!';
    RAISE NOTICE 'Auth User ID: %', auth_user_id;
    RAISE NOTICE 'Email: cory@pipetrak.co';
    RAISE NOTICE 'Role: App Owner (role_id: 0)';
    RAISE NOTICE 'Company: RFITrak System Administration';
    RAISE NOTICE 'You now have full app owner access!';
    
END $$;

-- Verify the setup
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    c.name as company_name,
    CASE cu.role_id
        WHEN 0 THEN 'app_owner'
        WHEN 1 THEN 'super_admin'
        WHEN 2 THEN 'admin'
        WHEN 3 THEN 'rfi_user'
        WHEN 4 THEN 'view_only'
        WHEN 5 THEN 'client_collaborator'
        ELSE 'unknown'
    END as role_name,
    cu.role_id
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
WHERE u.email = 'cory@pipetrak.co';

-- Show final role distribution
SELECT 
    CASE role_id
        WHEN 0 THEN 'app_owner'
        WHEN 1 THEN 'super_admin'
        WHEN 2 THEN 'admin'
        WHEN 3 THEN 'rfi_user'
        WHEN 4 THEN 'view_only'
        WHEN 5 THEN 'client_collaborator'
        ELSE 'unknown'
    END as role_name,
    COUNT(*) as count
FROM company_users
GROUP BY role_id
ORDER BY role_id; 
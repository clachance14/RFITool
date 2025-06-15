-- Link App Owner Auth User (Fixed Version)
-- Run this AFTER you've signed up with cory@pipetrak.co in your app
-- This will properly link your actual Supabase Auth user ID to the app owner role

DO $$
DECLARE
    auth_user_id UUID;
    placeholder_user_id UUID;
    app_owner_company_id UUID;
BEGIN
    -- Get your auth user ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'cory@pipetrak.co';
    
    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found. Please sign up first with cory@pipetrak.co';
    END IF;
    
    -- Get the placeholder user ID
    SELECT id INTO placeholder_user_id
    FROM users 
    WHERE email = 'cory@pipetrak.co' AND id != auth_user_id;
    
    -- Get app owner company ID
    SELECT id INTO app_owner_company_id
    FROM companies 
    WHERE name = 'RFITrak System Administration';
    
    IF placeholder_user_id IS NOT NULL THEN
        -- We have a placeholder user, need to merge with real auth user
        RAISE NOTICE 'Found placeholder user, merging with auth user...';
        
        -- Update the company_users table to point to the real auth user
        UPDATE company_users 
        SET user_id = auth_user_id, role_id = 0  -- Set to app_owner role
        WHERE user_id = placeholder_user_id;
        
        -- Delete the placeholder user record
        DELETE FROM users WHERE id = placeholder_user_id;
        
        -- Update the real user record to have the correct name
        UPDATE users 
        SET full_name = 'Cory (App Owner)'
        WHERE id = auth_user_id;
        
        RAISE NOTICE 'Placeholder user merged successfully!';
        
    ELSE
        -- No placeholder user, just update the existing auth user's role
        RAISE NOTICE 'No placeholder found, updating existing user role...';
        
        -- Check if user already has a company_users record
        IF EXISTS (SELECT 1 FROM company_users WHERE user_id = auth_user_id) THEN
            -- Update existing record to app_owner role
            UPDATE company_users 
            SET role_id = 0, company_id = app_owner_company_id
            WHERE user_id = auth_user_id;
        ELSE
            -- Create new company_users record
            INSERT INTO company_users (user_id, company_id, role_id, created_at, updated_at)
            VALUES (auth_user_id, app_owner_company_id, 0, NOW(), NOW());
        END IF;
        
        -- Update user name
        UPDATE users 
        SET full_name = 'Cory (App Owner)'
        WHERE id = auth_user_id;
    END IF;
    
    RAISE NOTICE 'App owner setup completed successfully!';
    RAISE NOTICE 'Auth User ID: %', auth_user_id;
    RAISE NOTICE 'Email: cory@pipetrak.co';
    RAISE NOTICE 'Role: App Owner (role_id: 0)';
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
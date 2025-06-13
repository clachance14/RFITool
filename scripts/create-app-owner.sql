-- Create App Owner Account for cory@pipetrak.co
-- This script creates the app owner (system administrator) account directly in the database
-- Run this in your Supabase SQL Editor

BEGIN;

-- Step 1: Create the app owner company
INSERT INTO companies (name, created_at, updated_at)
VALUES ('RFITrak System Administration', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get the company ID for the app owner company
DO $$
DECLARE
    app_owner_company_id UUID;
    app_owner_user_id UUID;
BEGIN
    -- Get the app owner company ID
    SELECT id INTO app_owner_company_id 
    FROM companies 
    WHERE name = 'RFITrak System Administration';

    -- Check if app owner already exists
    IF EXISTS (
        SELECT 1 FROM company_users 
        WHERE role_id = 0
    ) THEN
        RAISE NOTICE 'App owner already exists. Skipping creation.';
        RETURN;
    END IF;

    -- Generate a UUID for the app owner user
    -- Note: In production, this would be created by Supabase Auth
    -- For now, we'll create a placeholder that you'll need to update after auth signup
    app_owner_user_id := gen_random_uuid();

    -- Step 2: Create user profile in users table
    INSERT INTO users (
        id,
        email,
        full_name,
        status,
        created_at,
        updated_at
    ) VALUES (
        app_owner_user_id,
        'cory@pipetrak.co',
        'Cory (App Owner)',
        'active',
        NOW(),
        NOW()
    );

    -- Step 3: Link user to app owner company with app owner role (role_id = 0)
    INSERT INTO company_users (
        user_id,
        company_id,
        role_id,
        created_at,
        updated_at
    ) VALUES (
        app_owner_user_id,
        app_owner_company_id,
        0, -- app owner role
        NOW(),
        NOW()
    );

    RAISE NOTICE 'App owner account created successfully!';
    RAISE NOTICE 'Email: cory@pipetrak.co';
    RAISE NOTICE 'Role: App Owner (role_id: 0)';
    RAISE NOTICE 'Company: RFITrak System Administration';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT NEXT STEPS:';
    RAISE NOTICE '1. Sign up at your app with cory@pipetrak.co';
    RAISE NOTICE '2. After signup, run the update script to link your auth user';
    RAISE NOTICE '3. You will then have full app owner access';

END $$;

-- Step 4: Show current role distribution
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

COMMIT; 
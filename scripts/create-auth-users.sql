-- Create Supabase Auth Users Directly via SQL
-- This script creates the auth users without needing the dashboard
-- Run this in your Supabase SQL Editor

-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to generate auth user with proper password hashing
CREATE OR REPLACE FUNCTION create_auth_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    encrypted_password TEXT;
BEGIN
    -- Generate new UUID for the user
    user_id := gen_random_uuid();
    
    -- Hash the password using crypt (compatible with Supabase Auth)
    encrypted_password := crypt(user_password, gen_salt('bf'));
    
    -- Insert into auth.users table
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        raw_app_meta_data,
        aud,
        role
    ) VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000', -- Default instance ID
        user_email,
        encrypted_password,
        NOW(), -- Auto-confirm email
        NOW(),
        NOW(),
        COALESCE(
            CASE WHEN user_name IS NOT NULL 
            THEN json_build_object('full_name', user_name)::jsonb 
            ELSE '{}'::jsonb END
        ), -- User metadata
        '{}'::jsonb, -- App metadata
        'authenticated', -- Audience
        'authenticated' -- Role
    );
    
    -- Also insert into auth.identities for email provider
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        user_id,
        json_build_object('email', user_email, 'sub', user_id::text)::jsonb,
        'email',
        user_id::text, -- Use user_id as provider_id for email provider
        NOW(),
        NOW()
    );
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create all 5 test users
DO $$
DECLARE
    sarah_auth_id UUID;
    mike_auth_id UUID;
    alex_auth_id UUID;
    emma_auth_id UUID;
    jordan_auth_id UUID;
BEGIN
    RAISE NOTICE 'Creating Supabase Auth users...';
    
    -- Check if users already exist and skip if they do
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sarah.pm@icsconst.com') THEN
        sarah_auth_id := create_auth_user('sarah.pm@icsconst.com', 'TestPass123!', 'Sarah Johnson');
        RAISE NOTICE 'Created Sarah Johnson: %', sarah_auth_id;
    ELSE
        RAISE NOTICE 'Sarah Johnson already exists, skipping...';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mike.rfi@icsconst.com') THEN
        mike_auth_id := create_auth_user('mike.rfi@icsconst.com', 'TestPass123!', 'Mike Chen');
        RAISE NOTICE 'Created Mike Chen: %', mike_auth_id;
    ELSE
        RAISE NOTICE 'Mike Chen already exists, skipping...';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'alex@metrodev.com') THEN
        alex_auth_id := create_auth_user('alex@metrodev.com', 'TestPass123!', 'Alex Rodriguez');
        RAISE NOTICE 'Created Alex Rodriguez: %', alex_auth_id;
    ELSE
        RAISE NOTICE 'Alex Rodriguez already exists, skipping...';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emma.view@icsconst.com') THEN
        emma_auth_id := create_auth_user('emma.view@icsconst.com', 'TestPass123!', 'Emma Davis');
        RAISE NOTICE 'Created Emma Davis: %', emma_auth_id;
    ELSE
        RAISE NOTICE 'Emma Davis already exists, skipping...';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jordan.admin@icsconst.com') THEN
        jordan_auth_id := create_auth_user('jordan.admin@icsconst.com', 'TestPass123!', 'Jordan Smith');
        RAISE NOTICE 'Created Jordan Smith: %', jordan_auth_id;
    ELSE
        RAISE NOTICE 'Jordan Smith already exists, skipping...';
    END IF;
    
    RAISE NOTICE '✅ Auth user creation completed!';
END $$;

-- Verify auth users were created
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
)
ORDER BY email;

-- Clean up the function (optional)
-- DROP FUNCTION IF EXISTS create_auth_user(TEXT, TEXT, TEXT); 
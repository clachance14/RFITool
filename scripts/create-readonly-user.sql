-- Script to create a sample read-only user for demonstration purposes
-- This user will have view-only access to the application

-- First, we need to create the user in Supabase auth
-- Note: This should be done via the admin API or Supabase dashboard
-- For manual creation, use these details:
-- Email: demo@readonly.com
-- Password: readonly123
-- Full Name: Demo Read-Only User

-- Once the auth user is created, insert the user record
-- Replace 'AUTH_USER_ID_HERE' with the actual auth user ID from Supabase
INSERT INTO users (
    id, 
    email, 
    full_name, 
    status
) VALUES (
    'AUTH_USER_ID_HERE', -- Replace with actual Supabase auth user ID
    'demo@readonly.com',
    'Demo Read-Only User',
    'active'
);

-- Link the user to a company with view_only role (role_id = 4)
-- Replace 'COMPANY_ID_HERE' with an existing company ID from your companies table
INSERT INTO company_users (
    user_id,
    company_id,
    role_id
) VALUES (
    'AUTH_USER_ID_HERE', -- Same auth user ID from above
    'COMPANY_ID_HERE',   -- Replace with existing company ID
    4                    -- role_id 4 = view_only
);

-- Verify the user was created correctly
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.status,
    cu.company_id,
    cu.role_id,
    c.name as company_name
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
WHERE u.email = 'demo@readonly.com'; 
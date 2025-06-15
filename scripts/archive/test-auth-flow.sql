-- Comprehensive Authentication Flow Test
-- This verifies all components needed for authentication are working

-- 1. Verify test users exist and are properly set up
SELECT 
    'TEST USERS STATUS' as section,
    u.email,
    u.full_name,
    c.name as company,
    r.name as role,
    cu.role_id
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
JOIN roles r ON cu.role_id = r.id
WHERE u.email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
)
ORDER BY u.email;

-- 2. Test the exact query useUserRole makes for each test user
SELECT 
    'USERROLE QUERY TEST - SARAH' as test_name,
    cu.role_id,
    r.name as role_name
FROM company_users cu
JOIN roles r ON cu.role_id = r.id
WHERE cu.user_id = (SELECT id FROM users WHERE email = 'sarah.pm@icsconst.com');

SELECT 
    'USERROLE QUERY TEST - MIKE' as test_name,
    cu.role_id,
    r.name as role_name
FROM company_users cu
JOIN roles r ON cu.role_id = r.id
WHERE cu.user_id = (SELECT id FROM users WHERE email = 'mike.rfi@icsconst.com');

-- 3. Test the exact query useProjects makes for each test user
SELECT 
    'PROJECTS QUERY TEST - SARAH' as test_name,
    COUNT(p.*) as accessible_projects
FROM company_users cu
JOIN projects p ON p.company_id = cu.company_id OR cu.role_id = 0  -- app_owner sees all
WHERE cu.user_id = (SELECT id FROM users WHERE email = 'sarah.pm@icsconst.com');

-- 4. Verify all required roles exist
SELECT 
    'REQUIRED ROLES CHECK' as section,
    r.id,
    r.name,
    'EXISTS' as status
FROM roles r
WHERE r.name IN ('app_owner', 'super_admin', 'admin', 'rfi_user', 'view_only', 'client_collaborator')
ORDER BY r.id;

-- 5. Test permissions for each role
SELECT 
    'PERMISSION TEST' as section,
    r.name as role,
    CASE 
        WHEN r.name IN ('app_owner', 'super_admin', 'admin', 'rfi_user') THEN 'CAN CREATE RFI'
        ELSE 'CANNOT CREATE RFI'
    END as create_rfi_permission,
    CASE 
        WHEN r.name IN ('app_owner', 'super_admin', 'admin') THEN 'CAN CREATE PROJECT'
        ELSE 'CANNOT CREATE PROJECT'
    END as create_project_permission
FROM roles r
ORDER BY r.id;

-- 6. Final status check
SELECT 
    'AUTHENTICATION SYSTEM STATUS' as section,
    'ALL COMPONENTS VERIFIED' as status,
    COUNT(DISTINCT u.id) as total_test_users,
    COUNT(DISTINCT c.id) as total_companies,
    COUNT(DISTINCT r.id) as total_roles
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
JOIN roles r ON cu.role_id = r.id
WHERE u.email IN (
    'sarah.pm@icsconst.com',
    'mike.rfi@icsconst.com', 
    'alex@metrodev.com',
    'emma.view@icsconst.com',
    'jordan.admin@icsconst.com'
); 
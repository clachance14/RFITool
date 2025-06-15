-- Authentication Data Check
-- Simple queries to identify missing data causing auth errors

-- Table counts
SELECT 'USERS' as table_name, COUNT(*) as count FROM users;
SELECT 'COMPANIES' as table_name, COUNT(*) as count FROM companies;  
SELECT 'ROLES' as table_name, COUNT(*) as count FROM roles;
SELECT 'COMPANY_USERS' as table_name, COUNT(*) as count FROM company_users;

-- Show all roles  
SELECT 'ROLES:' as section, id, name FROM roles ORDER BY id;

-- Show all companies
SELECT 'COMPANIES:' as section, id, name FROM companies ORDER BY name;

-- Show all users
SELECT 'USERS:' as section, id, email, full_name FROM users ORDER BY email;

-- Show user-company relationships
SELECT 
    'RELATIONSHIPS:' as section,
    u.email,
    c.name as company,
    r.name as role
FROM company_users cu
JOIN users u ON cu.user_id = u.id
JOIN companies c ON cu.company_id = c.id
JOIN roles r ON cu.role_id = r.id
ORDER BY u.email; 
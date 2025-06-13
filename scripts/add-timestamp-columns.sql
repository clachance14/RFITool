-- Add Missing Timestamp Columns for User Tracking
-- This script adds created_at and updated_at columns where missing
-- to properly track user creation and company join dates

-- ============================================
-- ADD TIMESTAMPS TO USERS TABLE
-- ============================================

-- Add created_at column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update created_at for existing users (set to a reasonable default)
-- Use the earliest project creation date they're associated with, or current time
UPDATE users 
SET created_at = COALESCE(
  (SELECT MIN(p.created_at) 
   FROM projects p 
   JOIN company_users cu ON p.company_id = cu.company_id 
   WHERE cu.user_id = users.id),
  NOW() - INTERVAL '30 days' -- Default to 30 days ago if no projects
)
WHERE created_at IS NULL OR created_at = NOW();

-- ============================================
-- ADD TIMESTAMPS TO COMPANY_USERS TABLE
-- ============================================

-- Add created_at column to company_users table if it doesn't exist
ALTER TABLE company_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column to company_users table if it doesn't exist  
ALTER TABLE company_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update created_at for existing company_users records
-- Set to user's created_at or a reasonable default
UPDATE company_users 
SET created_at = COALESCE(
  (SELECT u.created_at FROM users u WHERE u.id = company_users.user_id),
  NOW() - INTERVAL '25 days' -- Slightly after user creation
)
WHERE created_at IS NULL OR created_at = NOW();

-- Set updated_at to same as created_at for existing records
UPDATE company_users 
SET updated_at = created_at
WHERE updated_at IS NULL OR updated_at = NOW();

-- ============================================
-- ADD TIMESTAMPS TO COMPANIES TABLE
-- ============================================

-- Ensure companies table has both timestamps
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update timestamps for existing companies
UPDATE companies 
SET created_at = COALESCE(
  (SELECT MIN(p.created_at) FROM projects p WHERE p.company_id = companies.id),
  NOW() - INTERVAL '35 days' -- Default to 35 days ago
)
WHERE created_at IS NULL OR created_at = NOW();

UPDATE companies 
SET updated_at = created_at
WHERE updated_at IS NULL OR updated_at = NOW();

-- ============================================
-- CREATE UPDATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically update updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_users_updated_at ON company_users;
CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show the updated table structures using SQL queries
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'company_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data with timestamps
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.created_at as user_created_at,
  u.updated_at as user_updated_at,
  cu.created_at as joined_company_at,
  cu.updated_at as company_user_updated_at,
  cu.role_id,
  c.name as company_name,
  c.created_at as company_created_at
FROM users u
JOIN company_users cu ON u.id = cu.user_id
JOIN companies c ON cu.company_id = c.id
ORDER BY c.name, cu.created_at;

-- Summary report
SELECT 
  'users' as table_name,
  COUNT(*) as total_records,
  COUNT(created_at) as records_with_created_at,
  COUNT(updated_at) as records_with_updated_at
FROM users
UNION ALL
SELECT 
  'companies' as table_name,
  COUNT(*) as total_records,
  COUNT(created_at) as records_with_created_at,
  COUNT(updated_at) as records_with_updated_at
FROM companies
UNION ALL
SELECT 
  'company_users' as table_name,
  COUNT(*) as total_records,
  COUNT(created_at) as records_with_created_at,
  COUNT(updated_at) as records_with_updated_at
FROM company_users;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Timestamp columns added successfully!';
  RAISE NOTICE '📋 Tables updated: users, companies, company_users';
  RAISE NOTICE '🕒 Triggers created for automatic updated_at maintenance';
  RAISE NOTICE '📊 Run the verification queries above to see the results';
END $$; 
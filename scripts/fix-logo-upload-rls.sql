-- Fix Logo Upload RLS Issues for Admin Users
-- This script addresses RLS policies that prevent admin users from uploading company logos

-- 1. Ensure the companies table RLS policy allows admin updates
-- Drop existing policy and recreate with proper permissions
DROP POLICY IF EXISTS "companies_authenticated_only" ON companies;

-- Create improved companies policy that allows admin users to update their company
CREATE POLICY "companies_authenticated_access" ON companies
  FOR ALL 
  TO authenticated 
  USING (id = get_user_company_id())
  WITH CHECK (id = get_user_company_id());

-- 2. Create storage bucket policies for logo uploads
-- Note: These need to be run in Supabase Dashboard or via service role

-- First, ensure the storage buckets exist
-- Run these commands in Supabase SQL Editor or Dashboard:

-- Create company-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create company-logos bucket policy for authenticated users
CREATE POLICY "Authenticated users can upload company logos" ON storage.objects
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'company-logos');

-- Allow authenticated users to read company logos
CREATE POLICY "Authenticated users can view company logos" ON storage.objects
  FOR SELECT 
  TO authenticated 
  USING (bucket_id = 'company-logos');

-- Allow authenticated users to update company logos (for their company)
CREATE POLICY "Authenticated users can update company logos" ON storage.objects
  FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'company-logos');

-- Allow authenticated users to delete company logos (for their company)
CREATE POLICY "Authenticated users can delete company logos" ON storage.objects
  FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'company-logos');

-- 3. Create client-logos bucket and policies if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-logos', 'client-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can manage client logos" ON storage.objects
  FOR ALL 
  TO authenticated 
  USING (bucket_id = 'client-logos')
  WITH CHECK (bucket_id = 'client-logos');

-- 4. Ensure proper permissions for service role (admin operations)
-- The service role should have full access to bypass RLS when needed

-- 5. Add function to check if user has admin privileges
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_users.user_id = is_admin_user.user_id 
    AND role_id IN (0, 1, 2)  -- Admin, Super Admin, App Owner roles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Create enhanced policy for companies table that considers admin status
DROP POLICY IF EXISTS "companies_authenticated_access" ON companies;

CREATE POLICY "companies_admin_access" ON companies
  FOR ALL 
  TO authenticated 
  USING (
    -- Users can access their own company
    id = get_user_company_id()
    OR 
    -- Admin users can access their company
    is_admin_user()
  )
  WITH CHECK (
    -- Users can modify their own company
    id = get_user_company_id()
    OR 
    -- Admin users can modify their company
    is_admin_user()
  );

-- 7. Grant necessary permissions for authenticated role
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 8. Refresh schema cache
SELECT pg_catalog.pg_notify('pgrst', 'reload schema');

-- Instructions for manual setup in Supabase Dashboard:
-- 1. Go to Storage settings in Supabase Dashboard
-- 2. Create buckets: 'company-logos' and 'client-logos' (set as public)
-- 3. In Storage > Policies, ensure the above policies are applied
-- 4. Test upload functionality after running this script 
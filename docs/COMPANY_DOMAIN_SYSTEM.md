# Domain-Based Company Assignment System

## Overview

RFITrak uses an intelligent domain-based company assignment system to automatically organize users into companies based on their email domains. This ensures that colleagues from the same organization are automatically grouped together while maintaining proper role hierarchies.

## How It Works

### Email Domain Detection

When a user signs up, the system extracts their email domain and uses it to determine company assignment:

```
clachance@ics.ac → Domain: "ics.ac" → Company: "Ics Inc."
john@microsoft.com → Domain: "microsoft.com" → Company: "Microsoft Inc."  
jane@gmail.com → Domain: "gmail.com" → Uses user-entered company name
```

### Company Assignment Logic

1. **Business Domains**: Any domain that's not a common email provider
   - Company name is auto-generated from domain
   - Format: `{Domain_Base} Inc.` (e.g., "ics.ac" → "Ics Inc.")
   - Users automatically join existing company or create new one

2. **Personal Email Providers**: Common providers like Gmail, Yahoo, etc.
   - User must enter their own company name
   - Each user gets their own company (no automatic grouping)
   - Providers: gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com, aol.com, protonmail.com

### Role Assignment Rules

#### First User (Super Admin)
- **When**: First person from a domain to sign up
- **Role**: Super Admin (role_id: 1)
- **Permissions**: Can manage all company projects, invite users, manage company settings

#### Subsequent Users (Admin)  
- **When**: Additional users from the same domain
- **Role**: Admin (role_id: 2)
- **Permissions**: Can manage their own projects, create RFIs, invite users

### Examples

#### Scenario 1: New Company
```
1. sarah@acme.com signs up
   → Creates "Acme Inc." company
   → Sarah becomes Super Admin

2. john@acme.com signs up  
   → Joins existing "Acme Inc." company
   → John becomes Admin
```

#### Scenario 2: Personal Email
```
1. contractor@gmail.com signs up
   → Enters "Smith Construction" as company name
   → Creates "Smith Construction" company
   → Becomes Super Admin of their own company
```

#### Scenario 3: Existing Company
```
1. Company "Ics Inc." already exists with users
2. newuser@ics.ac signs up
   → Automatically joins "Ics Inc."
   → Becomes Admin (not Super Admin)
```

## Implementation Details

### Code Locations

- **Signup Logic**: `src/contexts/AuthContext.tsx` - `signUp()` function
- **Signup Form**: `src/app/login/page.tsx` - Dynamic form fields
- **Role Management**: `src/hooks/useUserRole.ts` - Permission system

### Database Functions

The system uses PostgreSQL functions for domain-based company detection:

```sql
-- Extract domain from email
CREATE OR REPLACE FUNCTION get_company_domain(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(split_part(email, '@', 2));
END;
$$ LANGUAGE plpgsql;

-- Find or create company by domain
CREATE OR REPLACE FUNCTION find_or_create_company_by_email(user_email TEXT, user_name TEXT)
RETURNS UUID AS $$
-- [Implementation in scripts/admin-isolation-migration.sql]
```

### Signup Form Behavior

The signup form adapts based on the email domain:

1. **Personal Email Domains**:
   - Shows "Company Name" input field (required)
   - User can enter any company name

2. **Business Domains**:
   - Hides company name input
   - Shows preview: "You'll be assigned to: {Generated Company Name}"
   - Shows role assignment explanation

## Benefits

### For Users
- **Automatic Organization**: Colleagues automatically grouped together
- **Consistent Naming**: Standardized company names prevent duplicates
- **Clear Role Hierarchy**: Transparent role assignment based on join order

### For Administrators
- **Reduced Cleanup**: No duplicate companies with different names
- **Predictable Structure**: Companies organized by domain
- **Security**: Company isolation based on verifiable email domains

## Migration & Cleanup

When implementing this system, existing duplicate companies should be consolidated:

```sql
-- Example: Consolidate "ICS Inc." and "ICS Construction" 
-- Keep earliest created company, move users, standardize name
UPDATE companies SET name = 'Ics Inc.' WHERE id = '{earliest_company_id}';
UPDATE company_users SET company_id = '{earliest_company_id}' 
WHERE company_id = '{duplicate_company_id}';
DELETE FROM companies WHERE id = '{duplicate_company_id}';
```

## Future Considerations

### Advanced Domain Handling
- Subdomain support (e.g., `team1@project.acme.com`)
- Multi-domain companies (e.g., `acme.com` and `acme.co.uk`)
- Domain verification for enhanced security

### Enterprise Features
- Custom company naming rules
- Manual domain-to-company mapping
- Bulk user import with domain validation

## Troubleshooting

### Common Issues

1. **User in Wrong Company**
   - Cause: Email domain changed or company renamed
   - Solution: Admin can move user to correct company

2. **Duplicate Companies**
   - Cause: Manual company creation before domain system
   - Solution: Run consolidation script to merge companies

3. **Personal Email Confusion**
   - Cause: Business user used personal email
   - Solution: User can create new account with business email, data can be migrated 
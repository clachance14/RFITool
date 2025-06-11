# Read-Only User Setup Guide

## Overview

Your RFI tracking application now supports read-only users who can view all content but cannot create or modify anything. This is perfect for sharing access with stakeholders who need to see project information without making changes.

## What Read-Only Users Can Do

✅ **Allowed Actions:**
- View all RFIs and their details
- Browse all projects
- Navigate through the entire application
- View reports and statistics
- Access project timelines and information

❌ **Restricted Actions:**
- Create new RFIs
- Edit existing RFIs
- Create new projects
- Edit project details
- Access admin features
- Manage users

## Setting Up Read-Only Users

### Method 1: Using the Admin Panel (Recommended)

1. Log in as an admin user
2. Go to the **Admin** section
3. Click on the **Users & Permissions** tab
4. Click the **Create Read-Only User** button
5. Fill in the user's information:
   - Full Name
   - Email Address
   - Temporary Password (default: `readonly123`)
6. Click **Create User**
7. Share the generated credentials with the user

### Method 2: Using the Node.js Script

1. Ensure you have the required environment variables set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the script:
   ```bash
   cd RFITrak
   node scripts/create-demo-user.js
   ```

3. The script will create a demo user with these credentials:
   - **Email:** demo@readonly.com
   - **Password:** readonly123

### Method 3: Manual Database Setup

If you prefer to set up users manually, use the SQL script:

1. Open `scripts/create-readonly-user.sql`
2. First create the user in Supabase Auth (via dashboard or API)
3. Update the script with the actual user ID and company ID
4. Run the SQL commands

## User Roles Explained

The application has the following role hierarchy:

| Role ID | Role Name | Description |
|---------|-----------|-------------|
| 1 | Owner | Full system access including user management |
| 2 | Admin | Manage RFIs, projects, and most settings |
| 3 | RFI User | Create and edit RFIs |
| 4 | **View Only** | Read-only access to RFIs and projects |
| 5 | Client Collaborator | View RFIs and project data, respond to RFIs |

## How Permissions Work

The permission system is implemented through:

1. **Role-based Access Control:** Each user has a role that determines their permissions
2. **Permission Gates:** UI components that hide/show features based on permissions
3. **API Protection:** Server-side validation ensures users can only access allowed resources

### Permission Gates in Use

The following UI elements are hidden for read-only users:

- "Create RFI" buttons and links
- "New Project" creation forms
- "Edit Project" buttons
- Admin navigation items
- User management features

## Testing Read-Only Access

To test the read-only functionality:

1. Create a read-only user using one of the methods above
2. Log out of your admin account
3. Log in with the read-only credentials
4. Navigate through the application
5. Verify that:
   - All content is visible
   - Creation/editing buttons are hidden
   - Navigation works properly
   - No error messages appear

## Sharing Access with Stakeholders

When sharing read-only access:

1. **Create individual accounts** for each person (don't share one account)
2. **Use meaningful names** like "Client Review User" or "Stakeholder View"
3. **Set strong temporary passwords** and ask users to change them
4. **Explain the limitations** so users understand why certain features aren't available
5. **Provide a brief tour** of what they can access

## Security Considerations

- Read-only users are still authenticated users in your system
- They can see all data within your company/organization
- Consider whether sensitive financial or internal project information should be visible
- Users can change their own passwords after logging in
- Consider implementing project-level restrictions if needed

## Troubleshooting

### User Can't Log In
- Verify the email and password are correct
- Check that the user exists in both `auth.users` and `users` tables
- Ensure the user is linked to a company in `company_users`

### User Sees "Access Denied" Errors
- Verify the user's role_id is set to 4 (view_only)
- Check that the user is linked to the correct company
- Clear browser cache and try again

### Features Still Appear for Read-Only Users
- Check that PermissionGate components are properly wrapped around restricted features
- Verify the useUserRole hook is working correctly
- Check browser console for any JavaScript errors

## Advanced Configuration

### Custom Permissions

You can modify the permission system by editing:
- `src/hooks/useUserRole.ts` - Core permission logic
- `src/components/PermissionGate.tsx` - UI permission gates

### Adding New Restrictions

To restrict additional features:

1. Wrap the UI element with `<PermissionGate permission="feature_name">`
2. Add the permission check to `useUserRole.ts`
3. Test with a read-only user account

## Support

If you encounter issues with read-only users:

1. Check the browser console for errors
2. Verify database records are correct
3. Test with a fresh browser session
4. Review the permission logic in the code

The read-only user system provides a secure way to share your RFI tracking data with stakeholders while maintaining control over who can make changes to your projects and RFIs. 
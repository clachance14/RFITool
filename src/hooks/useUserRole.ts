import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// User role mapping from role_id to role string
const ROLE_MAPPING = {
  0: 'app_owner',     // App owner - sees all companies (system admin)
  1: 'super_admin',   // Company super admin - first user, can manage company
  2: 'admin',         // Admin - manages own projects only
  3: 'rfi_user',      // Regular RFI user
  4: 'view_only',     // View only user
  5: 'client_collaborator' // Client user
} as const;

type UserRole = typeof ROLE_MAPPING[keyof typeof ROLE_MAPPING];

interface UserRoleData {
  role: UserRole | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  canCreateRFI: boolean;
  canEditRFI: boolean;
  canCreateProject: boolean;
  canEditProject: boolean;
  canAccessAdmin: boolean;
}

export function useUserRole(): UserRoleData {
  const { session } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check for role preview mode (App Owner only)
        const previewRole = typeof window !== 'undefined' ? localStorage.getItem('role_preview_mode') : null;
        
        // Get user's actual role from company_users table
        const { data: companyUser, error } = await supabase
          .from('company_users')
          .select('role_id')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else if (companyUser) {
          const actualRole = ROLE_MAPPING[companyUser.role_id as keyof typeof ROLE_MAPPING];
          
          // If in preview mode and user is App Owner, use preview role
          if (previewRole && actualRole === 'app_owner') {
            setRole(previewRole as UserRole);
          } else {
            setRole(actualRole || null);
          }
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session?.user?.id]);

  // Permission checking functions
  const hasPermission = (permission: string): boolean => {
    if (!role) return false;

    switch (permission) {
      case 'create_rfi':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
      case 'edit_rfi':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
      case 'create_project':
        return ['app_owner', 'super_admin', 'admin'].includes(role);
      case 'edit_project':
        return ['app_owner', 'super_admin', 'admin'].includes(role);
      case 'access_admin':
        return ['app_owner', 'super_admin', 'admin'].includes(role);
      case 'view_rfis':
        return true; // All authenticated users can view RFIs
      case 'view_projects':
        return true; // All authenticated users can view projects
      case 'view_reports':
        return true; // All authenticated users can view reports
      
      // RFI Workflow permissions
      case 'generate_client_link':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
      case 'print_rfi':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
      case 'print_package':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
      case 'submit_rfi':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
      case 'respond_to_rfi':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user', 'client_collaborator'].includes(role);
      case 'close_rfi':
        return ['app_owner', 'super_admin', 'admin', 'rfi_user'].includes(role);
      case 'delete_rfi':
        return ['app_owner', 'super_admin', 'admin'].includes(role);
      case 'export_data':
        return ['app_owner', 'super_admin', 'admin'].includes(role);
      
      // User Management permissions - Updated for safety
      case 'create_user':
        return ['app_owner', 'super_admin'].includes(role); // Super admin can add users
      case 'invite_user':
        return ['app_owner', 'super_admin'].includes(role); // Super admin can invite users
      case 'view_users':
        return ['app_owner', 'super_admin'].includes(role); // Super admin can view users
      case 'edit_user_roles':
        return ['app_owner'].includes(role); // Only app owner can edit roles
      case 'delete_user':
        return ['app_owner'].includes(role); // Only app owner can delete users
      case 'create_readonly_user':
        return ['app_owner', 'super_admin', 'admin'].includes(role);
      
      // Project Management permissions - Updated for safety
      case 'delete_project':
        return ['app_owner'].includes(role); // Only app owner can delete any project
      case 'delete_own_project':
        return ['app_owner', 'super_admin', 'admin'].includes(role); // Can delete own projects
      
      // Company Management
      case 'edit_company_settings':
        return ['app_owner', 'super_admin'].includes(role);
      
      default:
        return false;
    }
  };

  return {
    role,
    loading,
    hasPermission,
    canCreateRFI: hasPermission('create_rfi'),
    canEditRFI: hasPermission('edit_rfi'),
    canCreateProject: hasPermission('create_project'),
    canEditProject: hasPermission('edit_project'),
    canAccessAdmin: hasPermission('access_admin'),
  };
} 
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// User role mapping from role_id to role string
const ROLE_MAPPING = {
  1: 'owner',    // Company owner/creator
  2: 'admin',    // Admin
  3: 'rfi_user', // Regular RFI user
  4: 'view_only', // View only user
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
        // Get user's role from company_users table
        const { data: companyUser, error } = await supabase
          .from('company_users')
          .select('role_id')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else if (companyUser) {
          const userRole = ROLE_MAPPING[companyUser.role_id as keyof typeof ROLE_MAPPING];
          setRole(userRole || null);
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
        return ['owner', 'admin', 'rfi_user'].includes(role);
      case 'edit_rfi':
        return ['owner', 'admin', 'rfi_user'].includes(role);
      case 'create_project':
        return ['owner', 'admin'].includes(role);
      case 'edit_project':
        return ['owner', 'admin'].includes(role);
      case 'access_admin':
        return ['owner', 'admin'].includes(role);
      case 'view_rfis':
        return true; // All authenticated users can view RFIs
      case 'view_projects':
        return true; // All authenticated users can view projects
      case 'view_reports':
        return true; // All authenticated users can view reports
      
      // RFI Workflow permissions (restricted for demo users)
      case 'generate_client_link':
        return ['owner', 'admin', 'rfi_user'].includes(role);
      case 'print_rfi':
        return ['owner', 'admin', 'rfi_user'].includes(role);
      case 'print_package':
        return ['owner', 'admin', 'rfi_user'].includes(role);
      case 'submit_rfi':
        return ['owner', 'admin', 'rfi_user'].includes(role);
      case 'respond_to_rfi':
        return ['owner', 'admin', 'rfi_user', 'client_collaborator'].includes(role);
      case 'close_rfi':
        return ['owner', 'admin', 'rfi_user'].includes(role);
      case 'delete_rfi':
        return ['owner', 'admin'].includes(role);
      case 'export_data':
        return ['owner', 'admin'].includes(role);
      
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
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface PermissionGateProps {
  permission?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * PermissionGate component that conditionally renders children based on user permissions
 * 
 * @param permission - The permission to check (e.g., 'create_rfi', 'edit_project')
 * @param fallback - Component to render when permission is denied (optional)
 * @param children - Content to render when permission is granted
 * @param allowedRoles - Alternative to permission, directly specify allowed roles
 */
export function PermissionGate({ 
  permission, 
  fallback = null, 
  children, 
  allowedRoles 
}: PermissionGateProps) {
  const { hasPermission, role, loading } = useUserRole();

  // Show loading state if needed
  if (loading) {
    return <>{fallback}</>;
  }

  // Check permission using the permission string
  if (permission) {
    const hasAccess = hasPermission(permission);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Check permission using allowed roles
  if (allowedRoles && role) {
    const hasAccess = allowedRoles.includes(role);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Default to showing fallback if no permission specified
  return <>{fallback}</>;
}

/**
 * Hook version for conditional logic in components
 */
export function usePermissions() {
  const roleData = useUserRole();
  
  return {
    ...roleData,
    isViewOnly: roleData.role === 'view_only',
    isClient: roleData.role === 'client_collaborator',
    isReadOnly: roleData.role === 'view_only' || roleData.role === 'client_collaborator',
  };
} 
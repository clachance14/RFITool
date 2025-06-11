import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';

interface PermissionButtonProps {
  permission?: string;
  allowedRoles?: string[];
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  title?: string;
}

/**
 * PermissionButton component that shows buttons as disabled/greyed for unauthorized users
 * instead of hiding them completely. This provides better UX by showing what features exist.
 */
export function PermissionButton({ 
  permission,
  allowedRoles,
  children,
  onClick,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  title,
  ...props
}: PermissionButtonProps) {
  const { hasPermission, role, loading } = useUserRole();

  // Determine if user has access
  let hasAccess = true;
  let disabledReason = '';

  if (permission) {
    hasAccess = hasPermission(permission);
    if (!hasAccess) {
      disabledReason = `Requires ${permission.replace('_', ' ')} permission`;
    }
  } else if (allowedRoles && role) {
    hasAccess = allowedRoles.includes(role);
    if (!hasAccess) {
      disabledReason = `Available to: ${allowedRoles.join(', ')} users only`;
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled={true}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }

  // Show disabled button for unauthorized users
  if (!hasAccess) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled={true}
        className={`${className} opacity-50 cursor-not-allowed`}
        title={title || disabledReason}
        {...props}
      >
        {children}
      </Button>
    );
  }

  // Show normal button for authorized users
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
      onClick={onClick}
      title={title}
      {...props}
    >
      {children}
    </Button>
  );
} 
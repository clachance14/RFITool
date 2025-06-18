"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/auth/callback',
    '/auth/reset-password',
    '/client/logged-out',
  ];

  // Define client routes that have their own authentication logic
  const clientRoutes = [
    '/client/',
    '/rfi/',
  ];

  useEffect(() => {
    // Wait for auth state to be determined
    if (loading || roleLoading) return;

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
    const isClientRoute = clientRoutes.some(route => pathname.startsWith(route));

    // If it's a public route or client route, allow access
    if (isPublicRoute || isClientRoute) {
      return;
    }

    // If user is not authenticated and trying to access protected route, redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Special handling for client users - only allow access to RFI Log, Reports, RFI details, and Profile
    if (role === 'client_collaborator') {
      const clientAllowedRoutes = ['/rfi-log', '/reports', '/rfis/', '/profile'];
      const isAllowedRoute = clientAllowedRoutes.some(route => pathname === route || pathname.startsWith(route));
      
      if (!isAllowedRoute) {
        // Redirect client users to RFI Log as their default page
        router.replace('/rfi-log');
        return;
      }
    }

    // If user is authenticated but trying to access login page, redirect based on role
    if (user && pathname === '/login') {
      if (role === 'client_collaborator') {
        router.replace('/rfi-log');
      } else {
        router.replace('/');
      }
      return;
    }
  }, [user, loading, roleLoading, role, pathname, router]);

  // Show loading while authentication is being determined
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Check if current route is public or client route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  const isClientRoute = clientRoutes.some(route => pathname.startsWith(route));

  // If it's a public route or client route, show content without auth check
  if (isPublicRoute || isClientRoute) {
    return <>{children}</>;
  }

  // If user is not authenticated and trying to access protected route, show loading
  // (redirect will happen in useEffect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-500">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  // User is authenticated, show content
  return <>{children}</>;
} 
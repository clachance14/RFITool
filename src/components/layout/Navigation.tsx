"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, FilePlus, LogOut, FileText, Settings, FolderOpen, BarChart3, User } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { role, loading } = useUserRole();
  
  // Define which navigation items clients can access
  const isClientRole = role === 'client_collaborator';
  const clientAllowedRoutes = ['/rfi-log', '/reports'];

  const handleLogout = async () => {
    try {
      // Use proper Supabase signOut
      await signOut();
      
      // Clear any local storage/session data
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Redirect to dedicated login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, clear local data and redirect
      localStorage.removeItem('user');
      sessionStorage.clear();
      router.push('/login');
    }
  };

  // Don't render navigation until role is loaded to prevent showing wrong menu items
  if (loading) {
    return (
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 min-h-screen">
        <div className="mb-8 text-2xl font-bold tracking-wide text-gray-800">
          RFITrak
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading menu...</div>
        </div>
      </div>
    );
  }

  // If role is null/undefined, don't show navigation items except logout
  if (!role) {
    return (
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 min-h-screen">
        <div className="mb-8 text-2xl font-bold tracking-wide text-gray-800">
          RFITrak
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center">
            <p>Account setup incomplete</p>
            <p className="text-sm">Please contact your administrator</p>
          </div>
        </div>
        <button
          className="flex items-center px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full mt-8"
          data-testid="nav-logout"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-6 w-6" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 min-h-screen" data-testid="desktop-nav">
        <div className="mb-8 text-2xl font-bold tracking-wide text-gray-800">
          RFITrak
        </div>
        <ul className="flex-1 space-y-2" role="navigation" aria-label="Main navigation">
          {!isClientRole && (
            <li>
              <Link
                href="/"
                className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="nav-home"
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                <Home className="mr-3 h-6 w-6" />
                Home
              </Link>
            </li>
          )}
          {!isClientRole && (
            <li>
              <Link
                href="/projects"
                className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                  pathname === '/projects' || pathname.startsWith('/projects/')
                    ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="nav-projects"
                aria-current={pathname === '/projects' || pathname.startsWith('/projects/') ? 'page' : undefined}
              >
                <FolderOpen className="mr-3 h-6 w-6" />
                Projects
              </Link>
            </li>
          )}
          <li>
            <Link
              href="/rfi-log"
              className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                pathname === '/rfi-log'
                  ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-rfi-log"
              aria-current={pathname === '/rfi-log' ? 'page' : undefined}
            >
              <FileText className="mr-3 h-6 w-6" />
              RFI Log
            </Link>
          </li>
          {!isClientRole && (
            <li>
              <Link
                href="/rfis/create"
                className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                  pathname === '/rfis/create'
                    ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="nav-create-rfi"
                aria-current={pathname === '/rfis/create' ? 'page' : undefined}
              >
                <FilePlus className="mr-3 h-6 w-6" />
                Create RFI
              </Link>
            </li>
          )}
          <li>
            <Link
              href="/reports"
              className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                pathname === '/reports'
                  ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-reports"
              aria-current={pathname === '/reports' ? 'page' : undefined}
            >
              <BarChart3 className="mr-3 h-6 w-6" />
              Reports
            </Link>
          </li>
          <PermissionGate permission="access_admin">
            <li>
              <Link
                href="/admin"
                className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                  pathname === '/admin'
                    ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid="nav-admin"
                aria-current={pathname === '/admin' ? 'page' : undefined}
              >
                <Settings className="mr-3 h-6 w-6" />
                Admin
              </Link>
            </li>
          </PermissionGate>

        </ul>
        
        {/* Profile Link */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/profile"
            className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors w-full ${
              pathname === '/profile'
                ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            data-testid="nav-profile"
            aria-current={pathname === '/profile' ? 'page' : undefined}
          >
            <User className="mr-3 h-6 w-6" />
            Profile Settings
          </Link>
        </div>
        
        <button
          className="flex items-center px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full mt-8"
          data-testid="nav-logout"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-6 w-6" />
          Logout
        </button>
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-white border-t border-gray-200 shadow p-1 justify-around" data-testid="mobile-nav">
        {!isClientRole && (
          <Link
            href="/"
            className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
              pathname === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
            data-testid="mobile-nav-home"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>
        )}
        {!isClientRole && (
          <Link
            href="/projects"
            className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
              pathname === '/projects' || pathname.startsWith('/projects/') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
            data-testid="mobile-nav-projects"
            aria-current={pathname === '/projects' || pathname.startsWith('/projects/') ? 'page' : undefined}
          >
            <FolderOpen className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Projects</span>
          </Link>
        )}
        <Link
          href="/rfi-log"
          className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
            pathname === '/rfi-log' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          }`}
          data-testid="mobile-nav-rfi-log"
          aria-current={pathname === '/rfi-log' ? 'page' : undefined}
        >
          <FileText className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">RFI Log</span>
        </Link>
        {!isClientRole && (
          <Link
            href="/rfis/create"
            className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
              pathname === '/rfis/create' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
            data-testid="mobile-nav-create-rfi"
            aria-current={pathname === '/rfis/create' ? 'page' : undefined}
          >
            <FilePlus className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Create RFI</span>
          </Link>
        )}
        <PermissionGate permission="access_admin">
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
              pathname === '/admin' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
            data-testid="mobile-nav-admin"
            aria-current={pathname === '/admin' ? 'page' : undefined}
          >
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Admin</span>
          </Link>
        </PermissionGate>
        <Link
          href="/reports"
          className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
            pathname === '/reports' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          }`}
          data-testid="mobile-nav-reports"
          aria-current={pathname === '/reports' ? 'page' : undefined}
        >
          <BarChart3 className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Reports</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center px-2 py-1 rounded transition-colors text-gray-500 hover:text-red-600"
          data-testid="mobile-nav-logout"
        >
          <LogOut className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Logout</span>
        </button>

      </nav>
    </>
  );
} 
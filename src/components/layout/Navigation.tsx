"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FilePlus, LogOut, FileText, Settings, FolderOpen, TestTube } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // TODO: Add actual logout API call here
      // For now, just clear any local storage/session data
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      // TODO: Add proper error handling
      router.push('/login');
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 min-h-screen" data-testid="desktop-nav">
        <div className="mb-8 text-2xl font-bold tracking-wide text-gray-800">
          RFITrak
        </div>
        <ul className="flex-1 space-y-2" role="navigation" aria-label="Main navigation">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-dashboard"
              aria-current={pathname === '/dashboard' ? 'page' : undefined}
            >
              <LayoutDashboard className="mr-3 h-6 w-6" />
              Dashboard
            </Link>
          </li>
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
          <li>
            <Link
              href="/test-upload"
              className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                pathname === '/test-upload'
                  ? 'bg-gray-100 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="nav-tests"
              aria-current={pathname === '/test-upload' ? 'page' : undefined}
            >
              <TestTube className="mr-3 h-6 w-6" />
              Tests
            </Link>
          </li>

        </ul>
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
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
            pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          }`}
          data-testid="mobile-nav-dashboard"
          aria-current={pathname === '/dashboard' ? 'page' : undefined}
        >
          <LayoutDashboard className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Dashboard</span>
        </Link>
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
        <Link
          href="/test-upload"
          className={`flex flex-col items-center justify-center px-2 py-1 rounded transition-colors ${
            pathname === '/test-upload' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          }`}
          data-testid="mobile-nav-tests"
          aria-current={pathname === '/test-upload' ? 'page' : undefined}
        >
          <TestTube className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Tests</span>
        </Link>

      </nav>
    </>
  );
} 
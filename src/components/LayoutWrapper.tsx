"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import Navigation from '@/components/layout/Navigation';
import Header from '@/components/layout/Header';
import { LogOut, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Role display mapping
const ROLE_DISPLAY = {
  'app_owner': 'App Owner',
  'super_admin': 'Super Admin', 
  'admin': 'Admin',
  'rfi_user': 'RFI User',
  'view_only': 'View Only',
  'client_collaborator': 'Client Collaborator'
} as const;

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, loading, signOut } = useAuth();
  const { role } = useUserRole();
  const router = useRouter();

  // For unauthenticated users or loading state, show content without navigation
  if (!user || loading) {
    return <>{children}</>;
  }

  // Get display role name
  const displayRole = role ? ROLE_DISPLAY[role] || role : 'Unknown Role';

  // For authenticated client users, show a simplified client layout with proper flex structure
  if (role === 'client_collaborator') {
    return (
      <div className="min-h-screen flex bg-gray-50">
        {/* Client Navigation Sidebar */}
        <Navigation />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Client Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Left side - App Title */}
                <div className="flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">RFITrak</span>
                </div>

                {/* Right side - User Info and Actions */}
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.user_metadata?.full_name || user.email}</p>
                    <p className="text-xs text-gray-500">{user.user_metadata?.company}</p>
                    <p className="text-xs text-blue-600">{displayRole}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    );
  }

  // For authenticated regular users, show the full layout with navigation
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Navigation />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 
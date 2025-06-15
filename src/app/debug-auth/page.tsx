'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugAuthPage() {
  const { user, session } = useAuth();
  const { role, loading } = useUserRole();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info: any = {
        // Auth state
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id,
        userEmail: user?.email,
        
        // Role state
        currentRole: role,
        roleLoading: loading,
        
        // Browser storage
        sessionStorage: {},
        localStorage: {},
        
        // URL info
        currentUrl: window.location.href,
        pathname: window.location.pathname,
        
        // Client detection
        isClientAccess: false,
        clientToken: null,
        clientSession: null,
      };

      // Check browser storage
      try {
        Object.keys(sessionStorage).forEach(key => {
          info.sessionStorage[key] = sessionStorage.getItem(key);
        });
        Object.keys(localStorage).forEach(key => {
          info.localStorage[key] = localStorage.getItem(key);
        });
        
        // Check client-specific data
        info.clientToken = sessionStorage.getItem('client_token') || localStorage.getItem('client_token');
        info.clientSession = sessionStorage.getItem('client_session');
        info.isClientAccess = !!(info.clientToken || info.clientSession);
      } catch (e) {
        info.storageError = e instanceof Error ? e.message : 'Unknown storage error';
      }

      // Check database role
      if (session?.user?.id) {
        try {
          const { data: companyUser, error } = await supabase
            .from('company_users')
            .select('role_id, company_id, status')
            .eq('user_id', session.user.id)
            .single();
          
          info.databaseRole = companyUser;
          info.databaseError = error;
        } catch (e) {
          info.databaseError = e instanceof Error ? e.message : 'Unknown database error';
        }
      }

      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, [user, session, role, loading]);

  const clearAllData = () => {
    // Clear all storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Force navigation to home
    window.location.href = '/';
  };

  const forceOwnerMode = () => {
    // Clear client data specifically
    ['client_session', 'client_token'].forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
    
    // Navigate to admin
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Debug</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auth Status */}
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Authentication Status</h3>
              <div className="space-y-1 text-sm">
                <div>User: {debugInfo.hasUser ? '✅ Authenticated' : '❌ Not authenticated'}</div>
                <div>Session: {debugInfo.hasSession ? '✅ Active' : '❌ No session'}</div>
                <div>User ID: {debugInfo.userId || 'None'}</div>
                <div>Email: {debugInfo.userEmail || 'None'}</div>
              </div>
            </div>

            {/* Role Status */}
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Role Status</h3>
              <div className="space-y-1 text-sm">
                <div>Current Role: {debugInfo.currentRole || 'None'}</div>
                <div>Loading: {debugInfo.roleLoading ? 'Yes' : 'No'}</div>
                <div>Database Role ID: {debugInfo.databaseRole?.role_id ?? 'Unknown'}</div>
                <div>Company ID: {debugInfo.databaseRole?.company_id ?? 'Unknown'}</div>
              </div>
            </div>

            {/* Client Detection */}
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Client Access Detection</h3>
              <div className="space-y-1 text-sm">
                <div>Is Client Access: {debugInfo.isClientAccess ? '⚠️ YES' : '✅ No'}</div>
                <div>Client Token: {debugInfo.clientToken ? '⚠️ Present' : '✅ None'}</div>
                <div>Client Session: {debugInfo.clientSession ? '⚠️ Present' : '✅ None'}</div>
              </div>
            </div>

            {/* URL Info */}
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-2">URL Information</h3>
              <div className="space-y-1 text-sm">
                <div>Current URL: {debugInfo.currentUrl}</div>
                <div>Pathname: {debugInfo.pathname}</div>
              </div>
            </div>
          </div>

          {/* Storage Data */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Browser Storage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Session Storage</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(debugInfo.sessionStorage, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Local Storage</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(debugInfo.localStorage, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={clearAllData}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear All Data & Go Home
            </button>
            <button
              onClick={forceOwnerMode}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Force Owner Mode
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Reload Page
            </button>
          </div>

          {/* Recommendations */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Recommendations</h3>
            <div className="text-sm text-yellow-700">
              {debugInfo.isClientAccess && (
                <div className="mb-2">⚠️ Client access detected - click "Force Owner Mode" to clear client data</div>
              )}
              {debugInfo.currentRole !== 'app_owner' && debugInfo.databaseRole?.role_id === 0 && (
                <div className="mb-2">⚠️ Database shows App Owner but role hook shows different - try "Clear All Data"</div>
              )}
              {!debugInfo.hasUser && (
                <div className="mb-2">❌ Not authenticated - you need to log in</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
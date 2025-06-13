"use client";

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Building2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ClientLayoutProps {
  children: React.ReactNode;
  rfiId?: string;
}

export default function ClientLayout({ children, rfiId }: ClientLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (rfiId) {
        // Fetch company info from the RFI data
        const { data: rfiData, error } = await supabase
          .from('rfis')
          .select(`
            projects (
              client_company_name
            )
          `)
          .eq('id', rfiId)
          .single();

        // Type assertion to treat projects as a single object (not array)
        if (!error && rfiData?.projects) {
          setCompanyName((rfiData.projects as any).client_company_name);
        }
      }
      setLoading(false);
    };

    fetchCompanyInfo();
  }, [rfiId]);

  const handleClientLogout = () => {
    // Clear any client session data
    sessionStorage.removeItem('client_session');
    localStorage.removeItem('client_token');
    
    // Redirect to a thank you page or login
    router.push('/client/logged-out');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Client Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Company */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">RFITrak</h1>
                  {companyName && (
                    <p className="text-sm text-gray-600">{companyName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Client Actions */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Client Portal
              </span>
              <button
                onClick={handleClientLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href={`/client/rfi-log${typeof window !== 'undefined' && sessionStorage.getItem('client_token') ? `?token=${sessionStorage.getItem('client_token')}` : ''}`}
              className={`inline-flex items-center px-1 pt-1 pb-4 border-b-2 text-sm font-medium ${
                pathname === '/client/rfi-log'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              RFI Log
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 RFITrak. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This is a secure client portal. Please do not share this link.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
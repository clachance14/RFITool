"use client";

import { Bell, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const { user, session } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for preview mode
    const checkPreviewMode = () => {
      if (typeof window !== 'undefined') {
        const preview = localStorage.getItem('role_preview_mode');
        setPreviewMode(preview);
      }
    };
    
    checkPreviewMode();
    
    if (session?.user?.id) {
      // Fetch user profile and company data
      const fetchUserData = async () => {
        try {
          // Fetch user profile from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', session.user.id)
            .single();
          
          if (!userError && userData) {
            setUserProfile(userData);
          }

          // Fetch user's company and role from company_users table
          const { data: companyUserData, error: companyUserError } = await supabase
            .from('company_users')
            .select(`
              role_id,
              companies (
                name
              )
            `)
            .eq('user_id', session.user.id)
            .single();
          
          if (!companyUserError && companyUserData) {
            setCompany(companyUserData.companies);
            
            // Set role name based on role_id
            const roleNames = {
              0: 'App Owner',
              1: 'Super Admin',
              2: 'Admin',
              3: 'RFI User',
              4: 'View Only',
              5: 'Client Collaborator'
            };
            setUserRole(roleNames[companyUserData.role_id as keyof typeof roleNames] || 'Unknown');
          } else {
            console.error('Error fetching company data:', companyUserError);
          }
        } catch (error) {
          console.error('Error in fetchUserData:', error);
        }
      };
      
      fetchUserData();
    }
  }, [session?.user?.id]);

  // Use actual user data or fallback to session data
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email || 'User';
  const displayEmail = userProfile?.email || user?.email || 'No email';
  const displayCompany = company?.name || 'No Company';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <span className="text-2xl font-bold tracking-wide text-gray-800">RFITrak</span>
        {previewMode && (
          <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Preview Mode: {previewMode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-6">
        <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Bell className="h-6 w-6 text-gray-500" />
          <span className="sr-only">View notifications</span>
        </button>
        <div className="flex flex-col items-end">
          <span className="font-semibold text-gray-800 text-lg">{displayName}</span>
          <span className="text-gray-500 text-sm">{displayEmail}</span>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 text-xs font-medium">{displayCompany}</span>
            {userRole && (
              <>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-purple-600 text-xs font-medium">{userRole}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 
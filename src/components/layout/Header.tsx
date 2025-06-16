"use client";

import { Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Role display mapping with colors
const ROLE_STYLES = {
  'App Owner': 'bg-red-100 text-red-800 border-red-200',
  'Super Admin': 'bg-purple-100 text-purple-800 border-purple-200',
  'Admin': 'bg-blue-100 text-blue-800 border-blue-200',
  'RFI User': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'View Only': 'bg-gray-100 text-gray-800 border-gray-200',
  'Client Collaborator': 'bg-orange-100 text-orange-800 border-orange-200',
  'Unknown': 'bg-gray-100 text-gray-800 border-gray-200'
} as const;

export default function Header() {
  const { user, session } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  useEffect(() => {
    
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

  // Get role style based on current role
  const currentRole = userRole;
  const roleStyle = ROLE_STYLES[currentRole as keyof typeof ROLE_STYLES] || ROLE_STYLES['Unknown'];

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <span className="text-2xl font-bold tracking-wide text-gray-800">RFITrak</span>
      </div>
      <div className="flex items-center space-x-6">
        <NotificationBell />
        <div className="flex items-center space-x-4">
          {/* Role Badge - Prominent Display */}
          {currentRole && (
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${roleStyle}`}>
              <User className="w-4 h-4" />
              <span>{currentRole}</span>
            </div>
          )}
          
          {/* User Info */}
          <div className="flex flex-col items-end">
            <span className="font-semibold text-gray-800 text-lg">{displayName}</span>
            <span className="text-gray-500 text-sm">{displayEmail}</span>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 text-xs font-medium">{displayCompany}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 
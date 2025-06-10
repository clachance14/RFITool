"use client";

import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const { user, session } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  
  useEffect(() => {
    if (session?.user?.id) {
      // Fetch user profile from database
      const fetchUserData = async () => {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', session.user.id)
          .single();
        
        if (!userError && userData) {
          setUserProfile(userData);
        }

        // Fetch company data - for now, get the most recent company
        // TODO: Add proper user-company relationship
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('name')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!companyError && companyData) {
          setCompany(companyData);
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
      </div>
      <div className="flex items-center space-x-6">
        <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Bell className="h-6 w-6 text-gray-500" />
          <span className="sr-only">View notifications</span>
        </button>
        <div className="flex flex-col items-end">
          <span className="font-semibold text-gray-800 text-lg">{displayName}</span>
          <span className="text-gray-500 text-sm">{displayEmail}</span>
          <span className="text-blue-600 text-xs font-medium">{displayCompany}</span>
        </div>
      </div>
    </header>
  );
} 
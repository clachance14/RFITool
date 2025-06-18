"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthUser extends User {
  company_id?: string;
  company_name?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, companyName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user as AuthUser || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user as AuthUser || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to generate company name from domain
  const generateCompanyName = (domain: string) => {
    // Remove common TLD and format as proper company name
    const baseName = domain.replace(/\.(com|org|net|edu|gov|ac|co\.uk|ca)$/i, '');
    return baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase() + ' Inc.';
  };

  const signUp = async (email: string, password: string, name: string, companyName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            company_name: companyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Auth signup error:', error);
        return { error };
      }

      // Create company record and user profile
      if (data.user) {
        console.log('User created:', data.user.id);
        
        // Extract domain from email
        const domain = email.toLowerCase().split('@')[1];
        console.log('Email domain:', domain);
        
        // Generate standardized company name from domain
        const standardCompanyName = generateCompanyName(domain);
        console.log('Generated company name:', standardCompanyName);
        
        // Skip common email providers - create individual companies for these
        const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com'];
        let companyId;
        let userRole = 1; // Default to super admin
        
        if (commonProviders.includes(domain)) {
          // For common email providers, use user-entered name (allow personal company names)
          console.log('Common email provider detected, creating new company with user-entered name');
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName, // Use user input for personal email providers
            })
            .select()
            .single();

          if (companyError) {
            console.error('Error creating company:', companyError);
            return { error: companyError };
          }
          
          companyId = company.id;
          userRole = 1; // Super admin for new company
          console.log('New personal company created:', company);
        } else {
          // For business domains, check if company with same domain exists
          console.log('Business domain detected, checking for existing company...');
          
          // Look for existing users with the same domain
          const { data: existingUsers, error: existingError } = await supabase
            .from('users')
            .select(`
              id,
              email,
              company_users!inner(
                company_id,
                companies!inner(id, name)
              )
            `)
            .ilike('email', `%@${domain}`);

          if (existingError) {
            console.error('Error checking existing users:', existingError);
            return { error: existingError };
          }

          if (existingUsers && existingUsers.length > 0) {
            // Company with this domain exists, add user to existing company
            companyId = (existingUsers[0].company_users as any).company_id;
            userRole = 2; // Admin role for subsequent users
            console.log('Existing company found, adding as admin. Company ID:', companyId);
          } else {
            // No existing company with this domain, create new one with standardized name
            console.log('No existing company found, creating new company with domain-based name');
            const { data: company, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: standardCompanyName, // Use domain-based name for business domains
              })
              .select()
              .single();

            if (companyError) {
              console.error('Error creating company:', companyError);
              return { error: companyError };
            }
            
            companyId = company.id;
            userRole = 1; // Super admin for first user in new company
            console.log('New business company created:', company);
          }
        }

        // Create user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: name,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError };
        }

        console.log('User profile created:', profile);

        // Link user to company in company_users table with appropriate role
        const { data: companyUser, error: companyUserError } = await supabase
          .from('company_users')
          .insert({
            user_id: data.user.id,
            company_id: companyId,
            role_id: userRole,
          })
          .select()
          .single();

        if (companyUserError) {
          console.error('Error linking user to company:', companyUserError);
          return { error: companyUserError };
        }

        const roleDescription = userRole === 1 ? 'Super Admin' : 'Admin';
        console.log(`User linked to company as ${roleDescription}:`, companyUser);
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      return { error };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      return { error };
    } catch (error) {
      console.error('Password update error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
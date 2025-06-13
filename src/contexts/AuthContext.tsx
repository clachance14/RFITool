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
        
        // Create company record
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
          return { error: companyError };
        }

        console.log('Company created:', company);

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

        // Link user to company in company_users table
        const { data: companyUser, error: companyUserError } = await supabase
          .from('company_users')
          .insert({
            user_id: data.user.id,
            company_id: company.id,
            role_id: 1, // Super admin role for first user
          })
          .select()
          .single();

        if (companyUserError) {
          console.error('Error linking user to company:', companyUserError);
          return { error: companyUserError };
        }

        console.log('User linked to company:', companyUser);
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

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
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
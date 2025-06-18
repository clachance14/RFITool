"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is a password recovery flow from URL parameters
        const type = searchParams.get('type');
        
        if (type === 'recovery') {
          // For password recovery, wait for auth state change and then redirect
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // User has a valid session for password reset
            router.push('/auth/reset-password');
            return;
          } else {
            // No session, something went wrong
            router.push('/login?error=invalid_reset_link');
            return;
          }
        }

        // For other auth flows (like email confirmation)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_callback_error');
          return;
        }

        // Redirect to home for successful authentication
        router.push('/');
      } catch (err) {
        console.error('Unexpected auth callback error:', err);
        router.push('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
} 
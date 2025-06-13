"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClientLayout from './ClientLayout';
import LayoutWrapper from '../LayoutWrapper';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
  rfiId?: string;
}

export default function ClientLayoutWrapper({ children, rfiId }: ClientLayoutWrapperProps) {
  const searchParams = useSearchParams();
  const [isClientAccess, setIsClientAccess] = useState(false);

  useEffect(() => {
    // Check for client access indicators
    const clientToken = searchParams.get('token');
    const clientSession = sessionStorage.getItem('client_session');
    const clientMode = searchParams.get('client');
    
    // Determine if this is client access based on:
    // 1. URL token parameter (secure link access)
    // 2. Client session exists
    // 3. Explicit client=true parameter
    const isClient = !!(clientToken || clientSession || clientMode === 'true');
    
    setIsClientAccess(isClient);

    // If accessing via token, store client session
    if (clientToken) {
      sessionStorage.setItem('client_session', 'active');
      sessionStorage.setItem('client_token', clientToken);
    }
  }, [searchParams]);

  // Use client layout for client access, regular layout for internal users
  if (isClientAccess) {
    return (
      <ClientLayout rfiId={rfiId}>
        {children}
      </ClientLayout>
    );
  }

  // Default to regular internal layout
  return (
    <LayoutWrapper>
      {children}
    </LayoutWrapper>
  );
} 
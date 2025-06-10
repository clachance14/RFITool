"use client";

import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/layout/Navigation';
import Header from '@/components/layout/Header';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, loading } = useAuth();

  // For unauthenticated users or loading state, show content without navigation
  if (!user || loading) {
    return <>{children}</>;
  }

  // For authenticated users, show the full layout with navigation
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
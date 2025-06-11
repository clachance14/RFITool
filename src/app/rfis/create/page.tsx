"use client";

import { SimpleRFIFormWorking } from '@/components/rfi/SimpleRFIFormWorking';
import { useUserRole } from '@/hooks/useUserRole';

export default function CreateRFIPage() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <SimpleRFIFormWorking isReadOnly={role === 'view_only'} />
    </div>
  );
} 
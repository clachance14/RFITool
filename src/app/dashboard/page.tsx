"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since Dashboard is now Home
    router.replace('/');
  }, [router]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Redirecting to Home...</div>
        </div>
      </div>
    </div>
  );
} 
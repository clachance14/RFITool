'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRFIs } from '@/contexts/RFIContext';
import { RfiDetailView } from '@/components/rfi/RfiDetailView';
import type { RFI } from '@/lib/types';

export default function RFIDetailPage() {
  const params = useParams();
  const { getRFIById, loading, error } = useRFIs();
  const [rfi, setRfi] = useState<RFI | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const rfiId = params.id as string;

  useEffect(() => {
    const fetchRFI = async () => {
      if (!rfiId) return;

      try {
        setFetchError(null);
        const rfiData = await getRFIById(rfiId);
        setRfi(rfiData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch RFI';
        setFetchError(errorMessage);
      }
    };

    fetchRFI();
  }, [rfiId, getRFIById]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFI details...</p>
        </div>
      </div>
    );
  }

  if (fetchError || error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RFI Not Found</h2>
          <p className="text-gray-600 mb-4">
            {fetchError || error || 'The requested RFI could not be found.'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!rfi) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No RFI data available.</p>
        </div>
      </div>
    );
  }

  return <RfiDetailView rfi={rfi} />;
} 
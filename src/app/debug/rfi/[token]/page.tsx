"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function DebugRFIPage() {
  const params = useParams();
  const token = params.token as string;
  const [rfiData, setRfiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRFIData();
  }, [token]);

  const fetchRFIData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/rfi/${token}`);
      const data = await response.json();
      
      console.log('RFI Data:', data);
      
      if (!data.success) {
        setError(data.error || 'Failed to load RFI');
        return;
      }
      
      setRfiData(data.data);
    } catch (err) {
      console.error('Error fetching RFI:', err);
      setError('Failed to load RFI data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RFI Debug Data</h1>
      <div className="bg-gray-100 p-4 rounded">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(rfiData, null, 2)}
        </pre>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Enhanced Features Check:</h2>
        <ul className="space-y-1">
          <li>• Work Impact: {rfiData?.work_impact ? '✅ Present' : '❌ Missing'}</li>
          <li>• Cost Impact: {rfiData?.cost_impact ? '✅ Present' : '❌ Missing'}</li>
          <li>• Schedule Impact: {rfiData?.schedule_impact ? '✅ Present' : '❌ Missing'}</li>
          <li>• Proposed Solution: {rfiData?.contractor_proposed_solution ? '✅ Present' : '❌ Missing'}</li>
          <li>• Labor Cost: {rfiData?.actual_labor_cost ? `✅ $${rfiData.actual_labor_cost}` : '❌ Missing'}</li>
          <li>• Material Cost: {rfiData?.actual_material_cost ? `✅ $${rfiData.actual_material_cost}` : '❌ Missing'}</li>
          <li>• Equipment Cost: {rfiData?.actual_equipment_cost ? `✅ $${rfiData.actual_equipment_cost}` : '❌ Missing'}</li>
          <li>• Requires Field Work: {rfiData?.requires_field_work ? '✅ Yes' : '❌ No'}</li>
          <li>• Field Work Description: {rfiData?.field_work_description ? '✅ Present' : '❌ Missing'}</li>
        </ul>
      </div>
      
      <div className="mt-4">
        <a 
          href={`/client/rfi/${token}`}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Client Portal
        </a>
      </div>
    </div>
  );
} 
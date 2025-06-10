"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Plus, Eye, FileText, AlertCircle } from 'lucide-react';

export default function RFIsPage() {
  const { rfis, getRFIs, loading, error } = useRFIs();
  const { projects, refetch } = useProjects();
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        await Promise.all([
          getRFIs(),
          refetch()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [getRFIs, refetch]);

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.project_name || 'Unknown Project';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingData || loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading RFIs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">RFIs</h1>
          <p className="text-gray-600 mt-1">Manage your Requests for Information</p>
        </div>
        
        <Link href="/rfis/create">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New RFI
          </Button>
        </Link>
      </div>

      {rfis.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RFIs yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first RFI</p>
          <Link href="/rfis/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First RFI
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFI Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attachments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rfis.map((rfi) => (
                  <tr key={rfi.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rfi.rfi_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {rfi.subject}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getProjectName(rfi.project_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfi.status)}`}>
                        {rfi.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(rfi.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {rfi.attachment_files && rfi.attachment_files.length > 0 ? (
                          <>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-sm text-blue-600 font-medium">
                              {rfi.attachment_files.length}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link href={`/rfis/${rfi.id}`}>
                        <Button variant="outline" size="sm" title="View RFI Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 
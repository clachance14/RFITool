'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RFI, RFIStatus } from '@/lib/types';
import { RFIStatusBadge } from '@/components/rfi/RFIStatusBadge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import ClientLayoutWrapper from '@/components/layout/ClientLayoutWrapper';

interface ClientRFI {
  id: string;
  rfi_number: string;
  subject: string;
  status: RFIStatus;
  urgency: string;
  created_at: string;
  date_responded?: string;
  client_response?: string;
  projects: {
    project_name: string;
    client_company_name: string;
    contractor_job_number: string;
  };
}

export default function ClientRFILogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { role } = useUserRole();
  const [rfis, setRfis] = useState<ClientRFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [sortField, setSortField] = useState<keyof ClientRFI>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<RFIStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if this is client access (either via token or authenticated client user)
  const clientToken = searchParams.get('token') || (typeof window !== 'undefined' ? sessionStorage.getItem('client_token') : null);
  const isAuthenticatedClient = user && role === 'client_collaborator';
  const isClientAccess = !!(clientToken || searchParams.get('client') === 'true' || (typeof window !== 'undefined' && sessionStorage.getItem('client_session')) || isAuthenticatedClient);

  useEffect(() => {
    if (!isClientAccess) {
      router.push('/login');
      return;
    }

    const fetchClientRFIs = async () => {
      try {
        setLoading(true);
        setError(null);

        let targetCompanyName = '';

        // Method 1: If we have a client token, use it to determine the company
        if (clientToken) {
          // First validate the token and get company info
          const response = await fetch(`/api/client/rfi/${clientToken}`);
          if (!response.ok) {
            throw new Error('Invalid access token');
          }
          
          const tokenData = await response.json();
          if (!tokenData.success) {
            throw new Error(tokenData.error || 'Access denied');
          }

          targetCompanyName = tokenData.data.projects.client_company_name;
        } 
        // Method 2: If user is authenticated as client_collaborator, get company from user profile
        else if (isAuthenticatedClient && user) {
          // Get user's company from company_users table
          const { data: companyUser, error: companyUserError } = await supabase
            .from('company_users')
            .select(`
              companies (
                name
              )
            `)
            .eq('user_id', user.id)
            .single();

          if (companyUserError || !companyUser) {
            throw new Error('Could not determine your company association');
          }

          targetCompanyName = (companyUser.companies as any)?.name || '';
        } else {
          throw new Error('No valid access method found');
        }

        if (!targetCompanyName) {
          throw new Error('Could not determine company name');
        }

        setCompanyName(targetCompanyName);

        // Fetch all RFIs for this company
        const { data: companyRfis, error: rfisError } = await supabase
          .from('rfis')
          .select(`
            id,
            rfi_number,
            subject,
            status,
            urgency,
            created_at,
            date_responded,
            client_response,
            projects!inner (
              project_name,
              client_company_name,
              contractor_job_number
            )
          `)
          .eq('projects.client_company_name', targetCompanyName)
          .order('created_at', { ascending: false });

        if (rfisError) {
          throw new Error('Failed to fetch RFIs');
        }

        // Transform the data to match our interface (projects is returned as array, we need single object)
        const transformedRfis = (companyRfis || []).map(rfi => ({
          ...rfi,
          projects: Array.isArray(rfi.projects) ? rfi.projects[0] : rfi.projects
        }));

        setRfis(transformedRfis);
      } catch (err) {
        console.error('Error fetching client RFIs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load RFIs');
      } finally {
        setLoading(false);
      }
    };

    fetchClientRFIs();
  }, [clientToken, isClientAccess, isAuthenticatedClient, user, router]);

  const getStatusColor = (status: RFIStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'non-urgent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedRfis = useMemo(() => {
    let filtered = rfis;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rfi => rfi.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rfi =>
        rfi.rfi_number.toLowerCase().includes(searchLower) ||
        rfi.subject.toLowerCase().includes(searchLower) ||
        rfi.projects.project_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rfis, statusFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof ClientRFI) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (!isClientAccess) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFIs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientLayoutWrapper>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your RFIs</h1>
          <p className="text-gray-600 mt-2">View all RFIs assigned to your company</p>
        </div>

        {/* Summary Stats */}
        {rfis.length > 0 && (
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{rfis.length}</div>
              <div className="text-sm text-gray-600">Total RFIs</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{rfis.filter(r => r.status === 'active').length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{rfis.filter(r => r.status === 'closed').length}</div>
              <div className="text-sm text-gray-600">Closed</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{rfis.filter(r => r.client_response).length}</div>
              <div className="text-sm text-gray-600">Responded</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search RFIs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RFIStatus | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* RFI Table */}
        {filteredAndSortedRfis.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No RFIs Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No RFIs match your current filters.' 
                : 'No RFIs have been assigned to your company yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('rfi_number')}
                    >
                      RFI Number
                      {sortField === 'rfi_number' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('subject')}
                    >
                      Subject
                      {sortField === 'subject' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {sortField === 'created_at' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedRfis.map((rfi) => (
                    <tr key={rfi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {rfi.rfi_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {rfi.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rfi.projects.project_name}</div>
                        <div className="text-xs text-gray-500">{rfi.projects.contractor_job_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rfi.status)}`}>
                          {rfi.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(rfi.urgency)}`}>
                          {rfi.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(rfi.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rfi.client_response ? (
                          <div className="text-sm">
                            <div className="text-green-600 font-medium">✓ Responded</div>
                            {rfi.date_responded && (
                              <div className="text-xs text-gray-500">
                                {format(new Date(rfi.date_responded), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
                 )}
       </div>
     </ClientLayoutWrapper>
   );
 } 
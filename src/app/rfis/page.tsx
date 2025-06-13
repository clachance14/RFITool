"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Plus, Eye, FileText, AlertCircle, Download, Clock, User, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

// Activity types for RFI timeline
interface RFIActivity {
  id: string;
  rfi_id: string;
  rfi_number: string;
  project_name: string;
  type: 'created' | 'status_change' | 'response' | 'attachment' | 'updated';
  description: string;
  timestamp: string;
  user?: string;
  from_status?: string;
  to_status?: string;
}

export default function RFIsPage() {
  const router = useRouter();
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

  const handleRowClick = (rfiId: string) => {
    router.push(`/rfis/${rfiId}`);
  };

  // Generate activity timeline from RFI data
  const generateActivityTimeline = (): RFIActivity[] => {
    const activities: RFIActivity[] = [];

    rfis.forEach(rfi => {
      const project = projects.find(p => p.id === rfi.project_id);
      const projectName = project?.project_name || 'Unknown Project';

      // RFI Creation
      activities.push({
        id: `${rfi.id}-created`,
        rfi_id: rfi.id,
        rfi_number: rfi.rfi_number,
        project_name: projectName,
        type: 'created',
        description: `RFI created: ${rfi.subject}`,
        timestamp: rfi.created_at,
        user: rfi.created_by
      });

      // Status changes (simulated based on current status and dates)
      if (rfi.status === 'active' || rfi.status === 'closed') {
        activities.push({
          id: `${rfi.id}-activated`,
          rfi_id: rfi.id,
          rfi_number: rfi.rfi_number,
          project_name: projectName,
          type: 'status_change',
          description: `Status changed from Draft to Active`,
          timestamp: rfi.updated_at,
          from_status: 'draft',
          to_status: 'active'
        });
      }

      if (rfi.stage === 'sent_to_client' && rfi.status === 'active') {
        activities.push({
          id: `${rfi.id}-sent`,
          rfi_id: rfi.id,
          rfi_number: rfi.rfi_number,
          project_name: projectName,
          type: 'status_change',
          description: `RFI sent to client`,
          timestamp: rfi.updated_at,
          from_status: 'active',
          to_status: 'active'
        });
      }

      // Response activity
      if (rfi.response && rfi.response_date) {
        activities.push({
          id: `${rfi.id}-response`,
          rfi_id: rfi.id,
          rfi_number: rfi.rfi_number,
          project_name: projectName,
          type: 'response',
          description: `Client response received`,
          timestamp: rfi.response_date,
          user: 'Client'
        });
      }

      // Attachments activity
      if (rfi.attachment_files && rfi.attachment_files.length > 0) {
        activities.push({
          id: `${rfi.id}-attachments`,
          rfi_id: rfi.id,
          rfi_number: rfi.rfi_number,
          project_name: projectName,
          type: 'attachment',
          description: `${rfi.attachment_files.length} attachment(s) added`,
          timestamp: rfi.created_at, // Approximate timestamp
          user: rfi.created_by
        });
      }
    });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const activityTimeline = generateActivityTimeline().slice(0, 20); // Show last 20 activities

  const getActivityIcon = (type: RFIActivity['type']) => {
    switch (type) {
      case 'created':
        return <Plus className="w-4 h-4 text-blue-600" />;
      case 'status_change':
        return <Send className="w-4 h-4 text-purple-600" />;
      case 'response':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'attachment':
        return <FileText className="w-4 h-4 text-orange-600" />;
      case 'updated':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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
        
        <div className="flex items-center space-x-3">
          {rfis.length > 0 && (
            <Link href="/admin?tab=export">
              <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                <Download className="w-4 h-4 mr-2" />
                Export RFIs
              </Button>
            </Link>
          )}
          <PermissionGate permission="create_rfi">
            <Link href="/rfis/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New RFI
              </Button>
            </Link>
          </PermissionGate>
        </div>
      </div>

      {rfis.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No RFIs yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first RFI</p>
          <PermissionGate permission="create_rfi">
            <Link href="/rfis/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First RFI
              </Button>
            </Link>
          </PermissionGate>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                    RFI Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rfis.map((rfi) => (
                  <tr 
                    key={rfi.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(rfi.id)}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rfi.rfi_number}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {rfi.subject}
                        </div>
                        {rfi.attachment_files && rfi.attachment_files.length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="text-xs text-gray-500">
                              {rfi.attachment_files.length} attachment{rfi.attachment_files.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 truncate">
                        {getProjectName(rfi.project_id)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rfi.status)}`}>
                        {rfi.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(rfi.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Timeline Section */}
      {rfis.length > 0 && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <span className="text-sm text-gray-500">Last 20 activities</span>
            </div>
          </div>
          
          <div className="p-6">
            {activityTimeline.length > 0 ? (
              <div className="space-y-4">
                {activityTimeline.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/rfis/${activity.rfi_id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {activity.rfi_number}
                          </Link>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">{activity.project_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {activity.user && (
                            <>
                              <User className="w-3 h-3" />
                              <span>{activity.user}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>
                            {isToday(new Date(activity.timestamp)) 
                              ? `Today at ${format(new Date(activity.timestamp), 'h:mm a')}`
                              : isYesterday(new Date(activity.timestamp))
                              ? `Yesterday at ${format(new Date(activity.timestamp), 'h:mm a')}`
                              : isThisWeek(new Date(activity.timestamp))
                              ? format(new Date(activity.timestamp), 'EEEE \'at\' h:mm a')
                              : format(new Date(activity.timestamp), 'MMM d, yyyy \'at\' h:mm a')
                            }
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                      
                      {/* Status change details */}
                      {activity.type === 'status_change' && activity.from_status && activity.to_status && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.from_status)}`}>
                            {activity.from_status}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.to_status)}`}>
                            {activity.to_status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
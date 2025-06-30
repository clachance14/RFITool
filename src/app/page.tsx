"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { useRecentRFIActivity } from '@/hooks/useRecentRFIActivity';
import { BarChart3, FileText, FolderOpen, Plus, Clock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

export default function HomePage() {
  const { user, session } = useAuth();
  const { projects, refetch: getProjects } = useProjects();
  const { rfis, getRFIs } = useRFIs();
  const { activities, fetchRecentActivity, loading: activitiesLoading } = useRecentRFIActivity();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load data if user is authenticated
    if (!user) {
      console.log('No user authenticated, skipping data load');
      return;
    }
    
    console.log('Loading home page data for user:', user.id);
    
    const loadData = async () => {
      try {
        console.log('Starting parallel data loading...');
        await Promise.all([
          getProjects(),
          getRFIs().then(data => console.log("RFI data fetched:", data?.length || 0)),
          fetchRecentActivity(15).then(() => console.log('Recent activity fetch completed'))
        ]);
        console.log('All data loading completed');
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getProjects, getRFIs, fetchRecentActivity, user]);

  // Debug effect to log activities when they change
  useEffect(() => {
    if (activities.length > 0) {
      console.log('🔥 HOMEPAGE ACTIVITIES UPDATED:');
      console.log('  - Total activities:', activities.length);
      console.log('  - Sample activities:', activities.slice(0, 3).map(a => ({
        type: a.type,
        rfi_number: a.rfi_number,
        description: a.description
      })));
      console.log('  - All activity types:', [...new Set(activities.map(a => a.type))]);
    }
  }, [activities]);

  // Show loading while data is being fetched
  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const activeRFIs = rfis.filter(rfi => rfi.status === 'active');
  const terminatedRFIs = rfis.filter(rfi => rfi.status === 'closed');
  const overdueRFIs = rfis.filter(rfi => rfi.stage === 'late_overdue');
  console.log('DEBUG: RFI count is:', rfis.length, 'Projects:', projects.length);
  
  // Helper function to format timestamps
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE \'at\' h:mm a');
    } else {
      return format(date, 'MMM d \'at\' h:mm a');
    }
  };

  // Helper function to get activity icon and color
  const getActivityIcon = (type: string, changeType?: string) => {
    switch (type) {
      case 'created':
        return <Plus className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        if (changeType === 'stage') {
          return <ArrowRight className="h-4 w-4 text-purple-600" />;
        }
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'response_received':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'link_generated':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      case 'overdue_reminder':
        return <Clock className="h-4 w-4 text-red-600" />;
      case 'updated':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to RFITrak</h1>
          <p className="text-gray-600">Manage your projects and RFIs efficiently</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Projects</div>
                <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total RFIs</div>
                <div className="text-2xl font-bold text-gray-900">{rfis.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Active RFIs</div>
                <div className="text-2xl font-bold text-gray-900">{activeRFIs.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Closed RFIs</div>
                <div className="text-2xl font-bold text-gray-900">{terminatedRFIs.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link 
            href="/rfis/create"
            className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <Plus className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Create New RFI</h3>
                <p className="text-blue-700 text-sm">Start a new request for information</p>
              </div>
            </div>
          </Link>

          <PermissionGate permission="create_project">
            <Link 
              href="/projects/create"
              className="bg-green-50 border-2 border-green-200 rounded-lg p-6 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Create New Project</h3>
                  <p className="text-green-700 text-sm">Set up a new project</p>
                </div>
              </div>
            </Link>
          </PermissionGate>

          <Link 
            href="/reports"
            className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-purple-900">View Reports</h3>
                <p className="text-purple-700 text-sm">Generate RFI status reports</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent RFI Changes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Recent RFI Changes</h2>
              </div>
            </div>
            <div className="p-6">
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading recent activity...</div>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type, activity.change_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {activity.rfi_number}
                          </div>
                          <Link 
                            href={`/rfis/${activity.rfi_id}`}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex-shrink-0 ml-2"
                          >
                            View →
                          </Link>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {activity.description}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{activity.user_name}</span>
                          </div>
                          <span>{formatTimestamp(activity.timestamp)}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {activity.project_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent RFI activity</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Debug: Activities length: {activities.length}, Loading: {activitiesLoading.toString()}
                  </div>
                  <div className="mt-2 space-x-2">
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/rfis/recent-activity/debug', {
                            headers: {
                              'Authorization': `Bearer ${session?.access_token}`,
                              'Content-Type': 'application/json',
                            },
                          });
                          const result = await response.json();
                          console.log('Debug results:', result);
                          alert('Debug results logged to console');
                        } catch (error) {
                          console.error('Debug failed:', error);
                        }
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                    >
                      Debug Database
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/rfis/recent-activity/simple-debug', {
                            headers: {
                              'Authorization': `Bearer ${session?.access_token}`,
                              'Content-Type': 'application/json',
                            },
                          });
                          const result = await response.json();
                          console.log('Simple Debug results:', result);
                          alert('Simple debug results logged to console');
                        } catch (error) {
                          console.error('Simple debug failed:', error);
                        }
                      }}
                      className="px-3 py-1 bg-green-200 text-green-700 text-xs rounded hover:bg-green-300"
                    >
                      Simple Debug
                    </button>
                  </div>
                  <Link 
                    href="/rfis/create"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Create your first RFI
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Active RFIs */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Active RFIs</h2>
            </div>
            <div className="p-6">
              {activeRFIs.length > 0 ? (
                <div className="space-y-3">
                  {activeRFIs.slice(0, 5).map(rfi => (
                    <div key={rfi.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{rfi.rfi_number}</div>
                        <div className="text-sm text-gray-500">{rfi.subject}</div>
                        <div className="text-xs text-gray-400 capitalize">{rfi.status}</div>
                      </div>
                      <Link 
                        href={`/rfis/${rfi.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active RFIs</p>
                  <Link 
                    href="/rfis/create"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Create your first RFI
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 

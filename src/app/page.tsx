"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { BarChart3, FileText, FolderOpen, Plus } from 'lucide-react';
import Link from 'next/link';
import { PermissionGate } from '@/components/PermissionGate';

export default function HomePage() {
  const { user } = useAuth();
  const { projects, refetch: getProjects } = useProjects();
  const { rfis, getRFIs } = useRFIs();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load data if user is authenticated
    if (!user) return;
    
    const loadData = async () => {
      try {
        await Promise.all([
          getProjects(),
          getRFIs().then(data => console.log("RFI data fetched:", data?.length || 0))
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getProjects, getRFIs, user]);

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
  console.log("DEBUG: RFI count:", rfis.length, "Projects:", projects.length); const recentProjects = projects.slice(0, 5);

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

        {/* Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            </div>
            <div className="p-6">
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{project.project_name}</div>
                        <div className="text-sm text-gray-500">{project.client_company_name}</div>
                      </div>
                      <Link 
                        href={`/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No projects yet</p>
                  <PermissionGate permission="create_project">
                    <Link 
                      href="/projects/create"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Create your first project
                    </Link>
                  </PermissionGate>
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

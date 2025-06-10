"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, FileText, Calendar, Users, BarChart3, Eye, Grid3X3, List } from 'lucide-react';

// Project statistics interface
interface ProjectStats {
  totalRFIs: number;
  openRFIs: number;
  closedRFIs: number;
  overdueRFIs: number;
}

// Function to determine project status color
const getProjectStatus = (project: Project): string => {
  if (!project.start_date) return 'Planning';
  
  const startDate = new Date(project.start_date);
  const today = new Date();
  const expectedCompletion = project.expected_completion ? new Date(project.expected_completion) : null;
  
  if (startDate > today) return 'Upcoming';
  if (expectedCompletion && expectedCompletion < today) return 'Overdue';
  if (expectedCompletion) return 'Active';
  return 'Active';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Active':
      return 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800';
    case 'Planning':
      return 'px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800';
    case 'Upcoming':
      return 'px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800';
    case 'Overdue':
      return 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800';
    default:
      return 'px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800';
  }
};

export default function ProjectsPage() {
  const { projects, deleteProject, loading, error } = useProjects();
  const { getRFIs } = useRFIs();
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Load RFI statistics for all projects
  useEffect(() => {
    const loadProjectStats = async () => {
      if (projects.length === 0) return;
      
      setLoadingStats(true);
      const stats: Record<string, ProjectStats> = {};
      
      try {
        // For each project, get its RFI statistics
        await Promise.all(
          projects.map(async (project) => {
            try {
              const rfis = await getRFIs(project.id);
              const openRFIs = rfis.filter(rfi => ['draft', 'pending', 'under_review'].includes(rfi.status)).length;
              const closedRFIs = rfis.filter(rfi => ['resolved', 'closed'].includes(rfi.status)).length;
              const overdueRFIs = rfis.filter(rfi => {
                if (!rfi.due_date) return false;
                return new Date(rfi.due_date) < new Date() && !['resolved', 'closed'].includes(rfi.status);
              }).length;

              stats[project.id] = {
                totalRFIs: rfis.length,
                openRFIs,
                closedRFIs,
                overdueRFIs,
              };
            } catch (err) {
              console.error(`Failed to load stats for project ${project.id}:`, err);
              stats[project.id] = { totalRFIs: 0, openRFIs: 0, closedRFIs: 0, overdueRFIs: 0 };
            }
          })
        );
        
        setProjectStats(stats);
      } catch (err) {
        console.error('Failed to load project statistics:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadProjectStats();
  }, [projects, getRFIs]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const response = await deleteProject(id);
      if (!response.error) {
        // Projects will be automatically updated by the hook
      }
    }
  };

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
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your construction projects and track RFI activities</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          {projects.length > 0 && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                Table
              </button>
            </div>
          )}
          
          <Link href="/projects/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Overview Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total RFIs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(projectStats).reduce((sum, stats) => sum + stats.totalRFIs, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open RFIs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(projectStats).reduce((sum, stats) => sum + stats.openRFIs, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue RFIs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(projectStats).reduce((sum, stats) => sum + stats.overdueRFIs, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first project</p>
          <Link href="/projects/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </Link>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const stats = projectStats[project.id] || { totalRFIs: 0, openRFIs: 0, closedRFIs: 0, overdueRFIs: 0 };
            
            return (
              <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.project_name}</h3>
                    <p className="text-sm text-gray-600">{project.client_company_name}</p>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <div>Contractor Job: #{project.contractor_job_number}</div>
                      <div>Client Contract: #{project.job_contract_number}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/projects/${project.id}/edit`}>
                      <Button variant="outline" size="sm" title="Edit Project">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-3 mb-4">
                  {/* Client Information */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Client Information</h5>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <span className="font-medium">{project.client_company_name}</span>
                      </div>
                      {project.project_manager_contact && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{project.project_manager_contact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Project Timeline</h5>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {project.start_date 
                          ? `Started ${new Date(project.start_date).toLocaleDateString()}`
                          : 'Start date not set'
                        }
                      </span>
                    </div>
                    {project.expected_completion && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Due {new Date(project.expected_completion).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {project.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide mr-2">Location:</span>
                      <span>{project.location}</span>
                    </div>
                  )}
                </div>

                {/* RFI Statistics */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">RFI Activity</h4>
                  {loadingStats ? (
                    <div className="text-center py-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{stats.totalRFIs}</p>
                        <p className="text-xs text-gray-600">Total RFIs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{stats.openRFIs}</p>
                        <p className="text-xs text-gray-600">Open</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{stats.closedRFIs}</p>
                        <p className="text-xs text-gray-600">Closed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">{stats.overdueRFIs}</p>
                        <p className="text-xs text-gray-600">Overdue</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex space-x-2">
                    <Link href={`/projects/${project.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" title="View Project Details">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/rfis/create?project=${project.id}`} className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700" title="Create New RFI for this Project">
                        <Plus className="w-4 h-4 mr-2" />
                        New RFI
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFI Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => {
                  const stats = projectStats[project.id] || { totalRFIs: 0, openRFIs: 0, closedRFIs: 0, overdueRFIs: 0 };
                  
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                            <div className="text-xs text-gray-500">
                              <div>Contractor Job: #{project.contractor_job_number}</div>
                              <div>Client Contract: #{project.job_contract_number}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Status: <span className={getStatusColor(getProjectStatus(project))}>
                                {getProjectStatus(project)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.client_company_name}</div>
                          {project.project_manager_contact && (
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <Users className="w-4 h-4 mr-1" />
                              {project.project_manager_contact}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {project.start_date 
                            ? new Date(project.start_date).toLocaleDateString()
                            : 'Not set'
                          }
                        </div>
                        {project.expected_completion && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            Due: {new Date(project.expected_completion).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.location || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {loadingStats ? (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <div className="flex space-x-4">
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900">{stats.totalRFIs}</div>
                              <div className="text-xs text-gray-600">Total</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-blue-600">{stats.openRFIs}</div>
                              <div className="text-xs text-gray-600">Open</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-green-600">{stats.closedRFIs}</div>
                              <div className="text-xs text-gray-600">Closed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-red-600">{stats.overdueRFIs}</div>
                              <div className="text-xs text-gray-600">Overdue</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/projects/${project.id}`}>
                            <Button variant="outline" size="sm" title="View Project Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/projects/${project.id}/edit`}>
                            <Button variant="outline" size="sm" title="Edit Project">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/rfis/create?project=${project.id}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" title="Create New RFI for this Project">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(project.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 
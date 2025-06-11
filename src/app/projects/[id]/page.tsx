"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Plus, FileText, Calendar, MapPin, DollarSign, Users, Clock, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';
import { PermissionButton } from '@/components/PermissionButton';

// Project statistics interface
interface ProjectStats {
  totalRFIs: number;
  openRFIs: number;
  closedRFIs: number;
  overdueRFIs: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getProject } = useProjects();
  const { getRFIs } = useRFIs();
  const [project, setProject] = useState<Project | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats>({ totalRFIs: 0, openRFIs: 0, closedRFIs: 0, overdueRFIs: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load project details
        const result = await getProject(projectId);
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setProject(result.data);
          
          // Load RFI statistics
          const rfis = await getRFIs(projectId);
          const openRFIs = rfis.filter(rfi => ['draft', 'pending', 'under_review'].includes(rfi.status)).length;
          const closedRFIs = rfis.filter(rfi => ['resolved', 'closed'].includes(rfi.status)).length;
          const overdueRFIs = rfis.filter(rfi => {
            if (!rfi.due_date) return false;
            return new Date(rfi.due_date) < new Date() && !['resolved', 'closed'].includes(rfi.status);
          }).length;

          setProjectStats({
            totalRFIs: rfis.length,
            openRFIs,
            closedRFIs,
            overdueRFIs,
          });
        }
      } catch (err) {
        setError('Failed to load project details');
        console.error('Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, getProject, getRFIs]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <Link href="/projects">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="text-gray-600">{project.client_company_name}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <PermissionButton 
            permission="create_rfi"
            onClick={() => window.location.href = `/rfis/create?project=${project.id}`}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            title="Create a new RFI for this project"
          >
            <Plus className="w-4 h-4 mr-2" />
            New RFI
          </PermissionButton>
          <PermissionButton 
            permission="edit_project"
            onClick={() => window.location.href = `/projects/${project.id}/edit`}
            variant="outline"
            title="Edit project details"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Project
          </PermissionButton>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total RFIs</p>
              <p className="text-2xl font-semibold text-gray-900">{projectStats.totalRFIs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open RFIs</p>
              <p className="text-2xl font-semibold text-gray-900">{projectStats.openRFIs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed RFIs</p>
              <p className="text-2xl font-semibold text-gray-900">{projectStats.closedRFIs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue RFIs</p>
              <p className="text-2xl font-semibold text-gray-900">{projectStats.overdueRFIs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">Basic Information</h3>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Project Name</label>
              <p className="text-gray-900 font-medium">{project.project_name}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Client Company</label>
              <p className="text-gray-900">{project.client_company_name}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Contractor Job #</label>
              <p className="text-gray-900">{project.contractor_job_number || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Client Contract #</label>
              <p className="text-gray-900">{project.job_contract_number}</p>
            </div>

            {project.project_type && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Project Type</label>
                <p className="text-gray-900 capitalize">{project.project_type?.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          {/* Location & Financial */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">Location & Financial</h3>
            
            {project.location ? (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Location</label>
                <p className="text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  {project.location}
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Location</label>
                <p className="text-gray-400 italic">Not specified</p>
              </div>
            )}

            {project.contract_value ? (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Contract Value</label>
                <p className="text-gray-900 flex items-center font-medium">
                  <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                  {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(project.contract_value)}
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Contract Value</label>
                <p className="text-gray-400 italic">Not specified</p>
              </div>
            )}

            {project.start_date && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Start Date</label>
                <p className="text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {new Date(project.start_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {project.expected_completion && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Expected Completion</label>
                <p className="text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  {new Date(project.expected_completion).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Contacts & RFI Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">Contacts & RFI Settings</h3>
            
            {project.project_manager_contact && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Client Project Manager</label>
                <p className="text-gray-900 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-500" />
                  <a href={`mailto:${project.project_manager_contact}`} className="text-blue-600 hover:text-blue-800">
                    {project.project_manager_contact}
                  </a>
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Default RFI Urgency</label>
              <p className="text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.default_urgency === 'urgent' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {project.default_urgency?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </p>
            </div>

            {project.standard_recipients && project.standard_recipients.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Standard Recipients</label>
                <div className="space-y-1">
                  {project.standard_recipients.map((recipient, index) => (
                    <p key={index} className="text-sm text-gray-900">
                      <a href={`mailto:${recipient}`} className="text-blue-600 hover:text-blue-800">
                        {recipient}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Description */}
      {project.project_description && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{project.project_description}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href={`/rfis?project=${project.id}`}>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View All RFIs
            </Button>
          </Link>
          <PermissionButton 
            permission="create_rfi"
            onClick={() => window.location.href = `/rfis/create?project=${project.id}`}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            title="Create a new RFI for this project"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New RFI
          </PermissionButton>
          <PermissionButton 
            permission="edit_project"
            onClick={() => window.location.href = `/projects/${project.id}/edit`}
            variant="outline"
            title="Edit project details"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Project
          </PermissionButton>
        </div>
      </div>
    </div>
  );
} 
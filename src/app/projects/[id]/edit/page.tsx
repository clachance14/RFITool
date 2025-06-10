"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { ProjectFormWithLogos } from '@/components/project/ProjectFormWithLogos';
import { CreateProjectInput, Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { getProject, updateProject } = useProjects();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await getProject(projectId);
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setProject(result.data);
        }
      } catch (err) {
        setError('Failed to load project');
        console.error('Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, getProject]);

  const handleUpdateProject = async (data: CreateProjectInput): Promise<void> => {
    if (!projectId) return;
    
    const result = await updateProject(projectId, data);
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Navigate back to projects page after successful update
    router.push('/projects');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
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
        <div className="mt-4">
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
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

  // Convert project data to form format
  const initialData: Partial<CreateProjectInput> = {
    project_name: project.project_name,
    contractor_job_number: project.contractor_job_number || '',
    job_contract_number: project.job_contract_number,
    client_company_name: project.client_company_name,
    project_manager_contact: project.project_manager_contact || '',
    location: project.location || '',
    project_type: project.project_type,
    contract_value: project.contract_value,
    start_date: project.start_date || '',
    expected_completion: project.expected_completion || '',
    project_description: project.project_description || '',
    client_logo_url: project.client_logo_url || '',
    default_urgency: project.default_urgency || 'non-urgent',
    standard_recipients: project.standard_recipients || [''],
    project_disciplines: project.project_disciplines || [],
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/projects">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-600">Update project details and settings</p>
        </div>
      </div>
      
      <ProjectFormWithLogos 
        initialData={initialData}
        onSubmit={handleUpdateProject} 
        submitLabel="Update Project"
      />
    </div>
  );
} 
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Project, ProjectFormData } from '@/lib/types';
import { CreateProjectInput } from '@/lib/validations';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Mock data for development/testing
const mockProjects: Project[] = [
  {
    id: '1',
    project_name: 'Downtown Office Building',
    job_contract_number: 'JOB-2024-001',
    client_company_name: 'ABC Development Corp',
    project_manager_contact: 'john.smith@abcdev.com',
    standard_recipients: ['engineer@structural.com', 'architect@design.com'],
    project_disciplines: ['Structural', 'Architectural', 'Mechanical'],
    default_urgency: 'non-urgent' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    project_name: 'Residential Complex Phase 2',
    job_contract_number: 'JOB-2024-002',
    client_company_name: 'Metro Housing LLC',
    project_manager_contact: 'sarah.johnson@metrohousing.com',
    standard_recipients: ['contractor@builds.com', 'inspector@city.gov'],
    project_disciplines: ['Civil', 'Electrical', 'Plumbing'],
    default_urgency: 'urgent' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    project_name: 'Shopping Center Renovation',
    job_contract_number: 'JOB-2024-003',
    client_company_name: 'Retail Properties Inc',
    project_manager_contact: 'mike.brown@retailprops.com',
    standard_recipients: ['electrical@contractor.com', 'plumbing@services.com'],
    project_disciplines: ['Electrical', 'HVAC', 'Fire Safety'],
    default_urgency: 'non-urgent' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 500));

  const getProjects = useCallback(async (): Promise<ApiResponse<Project[]>> => {
    setLoading(true);
    setError(null);
    try {
      await simulateDelay();
      return { data: projects, error: undefined };
    } catch (err) {
      const errorMessage = 'Failed to fetch projects';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [projects]);

  const getProject = useCallback(async (id: string): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(null);
    try {
      await simulateDelay();
      const project = projects.find(p => p.id === id);
      if (!project) {
        throw new Error('Project not found');
      }
      return { data: project, error: undefined };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [projects]);

  const createProject = useCallback(async (projectData: CreateProjectInput): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(null);
    try {
      await simulateDelay();
      
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        project_name: projectData.project_name,
        job_contract_number: projectData.job_contract_number,
        client_company_name: projectData.client_company_name,
        project_manager_contact: projectData.project_manager_contact || '',
        standard_recipients: projectData.standard_recipients || [],
        project_disciplines: projectData.project_disciplines || [],
        default_urgency: projectData.default_urgency || 'non-urgent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setProjects(prev => [...prev, newProject]);
      return { data: newProject, error: undefined };
    } catch (err) {
      const errorMessage = 'Failed to create project';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id: string, projectData: Partial<ProjectFormData>): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(null);
    try {
      await simulateDelay();
      
      const projectIndex = projects.findIndex(p => p.id === id);
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      const updatedProject: Project = {
        ...projects[projectIndex],
        ...projectData,
        updated_at: new Date().toISOString(),
      };

      setProjects(prev => prev.map(project =>
        project.id === id ? updatedProject : project
      ));
      
      return { data: updatedProject, error: undefined };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [projects]);

  const deleteProject = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    setLoading(true);
    setError(null);
    try {
      await simulateDelay();
      setProjects(prev => prev.filter(project => project.id !== id));
      return { data: undefined, error: undefined };
    } catch (err) {
      const errorMessage = 'Failed to delete project';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects on mount (simulate initial fetch)
  useEffect(() => {
    getProjects();
  }, [getProjects]);

  return {
    projects,
    loading,
    error,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    refetch: getProjects
  };
} 
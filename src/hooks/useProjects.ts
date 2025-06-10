"use client";

import { useState, useCallback, useEffect } from 'react';
import { Project, ProjectFormData } from '@/lib/types';
import { CreateProjectInput } from '@/lib/validations';
import { supabase, handleSupabaseError } from '@/lib/supabase';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjects = useCallback(async (): Promise<ApiResponse<Project[]>> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*');

      if (error) {
        throw error;
      }

      setProjects(data || []);
      return { data, error: undefined };

    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getProject = useCallback(async (id: string): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Project not found');
      }
      
      return { data: data as Project, error: undefined };
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: CreateProjectInput): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(null);
    try {
      // Get the currently authenticated user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Get the user's company_id from the company_users table
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      if (companyUserError || !companyUserData) {
        throw new Error('Unable to find user company association');
      }
      
      const newProjectData = {
        project_name: projectData.project_name,
        job_contract_number: projectData.job_contract_number,
        client_company_name: projectData.client_company_name,
        company_id: companyUserData.company_id, // Use the retrieved company_id
        project_manager_contact: projectData.project_manager_contact || '',
        location: projectData.location,
        project_type: projectData.project_type,
        contract_value: projectData.contract_value,
        start_date: projectData.start_date,
        expected_completion: projectData.expected_completion,
        project_description: projectData.project_description,
        client_logo_url: projectData.client_logo_url,
        standard_recipients: projectData.standard_recipients || [],
        project_disciplines: projectData.project_disciplines || [],
        default_urgency: projectData.default_urgency || 'non-urgent',
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert(newProjectData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      const newProject = data as Project;
      setProjects(prev => [...prev, newProject]);
      return { data: newProject, error: undefined };
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
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
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...projectData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Project not found');
      }
      
      const updatedProject = data as Project;
      setProjects(prev => prev.map(project =>
        project.id === id ? updatedProject : project
      ));
      
      return { data: updatedProject, error: undefined };
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setProjects(prev => prev.filter(project => project.id !== id));
      return { data: undefined, error: undefined };
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects on mount
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
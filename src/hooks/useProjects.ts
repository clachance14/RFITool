"use client";

import { useState, useCallback, useEffect } from 'react';
import { Project, ProjectFormData } from '@/lib/types';
import axios from 'axios';
import { CreateProjectInput } from '@/lib/validations';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponseType<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.error || err.message;
    }
    return err instanceof Error ? err.message : 'An unknown error occurred';
  };

  const getProjects = useCallback(async (): Promise<ApiResponse<Project[]>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<ApiResponseType<Project[]>>(`${API_BASE_URL}/projects`);
      if (response.data.success) {
        setProjects(response.data.data);
        return { data: response.data.data, error: undefined };
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
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
      const response = await axios.get<ApiResponseType<Project>>(`${API_BASE_URL}/projects/${id}`);
      if (response.data.success) {
        return { data: response.data.data, error: undefined };
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
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
      console.log('📡 useProjects: Creating project with data:', projectData);
      console.log('📡 useProjects: Making API call to:', `${API_BASE_URL}/projects`);
      
      const response = await axios.post<ApiResponseType<Project>>(`${API_BASE_URL}/projects`, projectData);
      console.log('📡 useProjects: API Response:', response.data);
      
      if ('success' in response.data && response.data.success && 'data' in response.data) {
        console.log('✅ useProjects: Project created successfully');
        setProjects(prev => [...prev, response.data.data]);
        return { data: response.data.data, error: undefined };
      } else if ('error' in response.data) {
        console.error('❌ useProjects: API returned error:', response.data.error);
        throw new Error(response.data.error);
      } else {
        console.error('❌ useProjects: Invalid response format');
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('❌ useProjects: Error creating project:', err);
      const errorMessage = handleApiError(err);
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
      const response = await axios.patch<ApiResponseType<Project>>(`${API_BASE_URL}/projects/${id}`, projectData);
      if (response.data.success) {
        setProjects(prev => prev.map(project =>
          project.id === id ? response.data.data : project
        ));
        return { data: response.data.data, error: undefined };
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
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
      await axios.delete(`${API_BASE_URL}/projects/${id}`);
      setProjects(prev => prev.filter(project => project.id !== id));
      return { data: undefined, error: undefined };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

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
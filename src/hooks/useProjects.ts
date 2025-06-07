"use client";

import { useState, useCallback } from 'react';
import { Project, ProjectFormData } from '@/lib/types';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  data: T | undefined;
  error: string | undefined;
}

export function useProjects() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleApiError = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.message || err.message;
    }
    return err instanceof Error ? err.message : 'An unexpected error occurred';
  };

  const getProjects = useCallback(async (): Promise<ApiResponse<Project[]>> => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await axios.get<Project[]>(`${API_BASE_URL}/projects`);
      return { data: response.data, error: undefined };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { data: undefined, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getProject = useCallback(async (id: string): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await axios.get<Project>(`${API_BASE_URL}/projects/${id}`);
      return { data: response.data, error: undefined };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { data: undefined, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: ProjectFormData): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await axios.post<Project>(`${API_BASE_URL}/projects`, projectData);
      return { data: response.data, error: undefined };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { data: undefined, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id: string, projectData: Partial<ProjectFormData>): Promise<ApiResponse<Project>> => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await axios.patch<Project>(`${API_BASE_URL}/projects/${id}`, projectData);
      return { data: response.data, error: undefined };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { data: undefined, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    setLoading(true);
    setError(undefined);
    try {
      await axios.delete(`${API_BASE_URL}/projects/${id}`);
      return { data: undefined, error: undefined };
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return { data: undefined, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
  };
} 
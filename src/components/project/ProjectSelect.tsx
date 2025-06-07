"use client";

import { useEffect, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/lib/types';
import {
  SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  'data-testid'?: string;
}

export default function ProjectSelect({
  value,
  onChange,
  label = 'Project',
  required = false,
  'data-testid': testId,
}: ProjectSelectProps) {
  const { getProjects } = useProjects();
  const [projectsState, setProjectsState] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getProjects();
      if (response.data) {
        setProjectsState(response.data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [getProjects]);

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid={testId}>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        <div className="text-sm text-gray-500">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2" data-testid={testId}>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        <div className="text-sm text-red-600">{error}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true);
            setError(null);
            fetchProjects();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!projectsState || projectsState.length === 0) {
    return (
      <div className="space-y-2" data-testid={testId}>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        <div className="text-sm text-gray-500">No projects available</div>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid={testId}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <SelectComponent
        value={value}
        onValueChange={onChange}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projectsState.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectComponent>
    </div>
  );
} 
"use client";

import { useEffect, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/lib/types';
import {
  SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  'data-testid'?: string;
  error?: string;
}

export default function ProjectSelect({
  value,
  onChange,
  label = 'Project',
  required = false,
  'data-testid': testId,
  error,
}: ProjectSelectProps) {
  const { projects, loading: isLoading, error: errorMessage } = useProjects();

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

  if (errorMessage) {
    return (
      <div className="space-y-2" data-testid={testId}>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        <div className="text-sm text-red-600">{errorMessage}</div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
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
      <SelectComponent value={value} onValueChange={onChange} required>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id} data-testid={`select-item-${project.id}`}>
              {project.project_name} - {project.job_contract_number}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectComponent>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
} 
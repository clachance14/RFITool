"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';

export interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  'data-testid'?: string;
  error?: string;
  disabled?: boolean;
}

export default function ProjectSelect({
  value,
  onChange,
  label = 'Project',
  required = false,
  'data-testid': testId,
  error,
  disabled = false,
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
      <Select value={value} onValueChange={onChange} required disabled={disabled}>
        <SelectTrigger data-testid="select-trigger" disabled={disabled}>
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id} data-testid={`select-item-${project.id}`}>
              {project.project_name} - {project.job_contract_number}
            </SelectItem>
          ))}
          <SelectSeparator />
          <PermissionGate permission="create_project">
            <Link href="/projects/create" className="block">
              <div className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Plus className="h-4 w-4" />
                </span>
                <span>Add New Project</span>
              </div>
            </Link>
          </PermissionGate>
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
} 
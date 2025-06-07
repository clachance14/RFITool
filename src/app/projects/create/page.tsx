"use client";

import { useProjects } from '@/hooks/useProjects';
import { ProjectForm } from '@/components/project/ProjectForm';

export default function CreateProjectPage() {
  const { createProject } = useProjects();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h1>
      <ProjectForm onSubmit={createProject} />
    </div>
  );
} 
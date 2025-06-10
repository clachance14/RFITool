"use client";

import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { ProjectFormWithLogos } from '@/components/project/ProjectFormWithLogos';
import { CreateProjectInput } from '@/lib/types';

export default function CreateProjectPage() {
  const router = useRouter();
  const { createProject } = useProjects();

  const handleCreateProject = async (data: CreateProjectInput): Promise<void> => {
    const result = await createProject(data);
    if (result.error) {
      throw new Error(result.error);
    }
    // Navigate to projects page after successful creation
    router.push('/projects');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h1>
      <ProjectFormWithLogos onSubmit={handleCreateProject} />
    </div>
  );
} 
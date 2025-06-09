"use client";

import { ProjectFormNew } from '@/components/project/ProjectFormNew';

export default function CreateProjectNewPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
      <ProjectFormNew />
    </div>
  );
} 
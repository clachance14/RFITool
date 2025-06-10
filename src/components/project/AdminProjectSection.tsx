"use client";

import { useState } from 'react';
import { ProjectFormWithLogos } from './ProjectFormWithLogos';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Settings } from 'lucide-react';
import { CreateProjectInput } from '@/lib/types';

export function AdminProjectSection() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { createProject } = useProjects();

  const handleCreateProject = async (data: CreateProjectInput): Promise<void> => {
    const result = await createProject(data);
    if (result.error) {
      throw new Error(result.error);
    }
    
    // After successful creation, hide the form
    setShowCreateForm(false);
    
    alert('Project created successfully!');
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(false)}
          >
            Back to Projects
          </Button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg">
          <ProjectFormWithLogos
            onSubmit={handleCreateProject}
            submitLabel="Create Project"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Project Management</h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {/* Project Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Create Project</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Set up a new project with all necessary details including client information, timeline, and settings.
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Create New Project
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Project Templates</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Create and manage project templates for faster project setup with pre-configured settings.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Default Settings</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Configure default project settings, RFI workflows, and standard recipients.
          </p>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent projects to display</p>
          <p className="text-sm text-gray-500 mt-2">
            Projects created through this admin panel will appear here
          </p>
        </div>
      </div>
    </div>
  );
} 
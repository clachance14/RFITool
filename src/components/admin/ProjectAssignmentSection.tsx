"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, X, Check, Eye, Edit, Trash2, Search, Filter, UserPlus, UserMinus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useProjectAssignments, type ProjectAssignment, type AssignmentUser } from '@/hooks/useProjectAssignments';
import { Project } from '@/lib/types';

interface ProjectAssignmentSectionProps {
  onClose?: () => void;
}

export function ProjectAssignmentSection({ onClose }: ProjectAssignmentSectionProps) {
  const { projects, refetch } = useProjects();
  const {
    loading,
    error,
    getProjectAssignments,
    getAssignableUsers,
    assignUserToProject,
    removeUserFromProject
  } = useProjectAssignments();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignmentUser[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssigned, setFilterAssigned] = useState<'all' | 'assigned' | 'unassigned'>('all');

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjectData = async (projectId: string) => {
    const [assignmentsData, usersData] = await Promise.all([
      getProjectAssignments(projectId),
      getAssignableUsers(projectId)
    ]);
    
    setAssignments(assignmentsData);
    setAssignableUsers(usersData);
  };

  const handleAssignUser = async (userId: string, role: 'viewer' | 'collaborator' | 'editor' = 'viewer') => {
    if (!selectedProject) return;

    const success = await assignUserToProject(selectedProject.id, userId, role);
    if (success) {
      await loadProjectData(selectedProject.id);
      setShowAssignModal(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedProject) return;

    const success = await removeUserFromProject(selectedProject.id, userId);
    if (success) {
      await loadProjectData(selectedProject.id);
    }
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
  };

  const filteredUsers = assignableUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesFilter = filterAssigned === 'all' ? true :
                         filterAssigned === 'assigned' ? user.is_assigned :
                         !user.is_assigned;
    
    return matchesSearch && matchesFilter;
  });

  const unassignedUsers = filteredUsers.filter(user => !user.is_assigned);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        <h3 className="font-medium mb-2">Error Loading Project Assignments</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Project Assignments</h2>
            <p className="text-sm text-gray-600">Assign client users to specific projects</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Project Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Project</h3>
        
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No projects available</p>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedProject?.id === project.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.project_name}</h4>
                    <p className="text-sm text-gray-600">{project.client_company_name}</p>
                  </div>
                  {selectedProject?.id === project.id && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project Assignments */}
      {selectedProject && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Assignments for {selectedProject.project_name}
            </h3>
            <Button onClick={handleOpenAssignModal} className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Assign Users</span>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading assignments...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No users assigned to this project</p>
                  <p className="text-sm">Click "Assign Users" to get started</p>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.user_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {assignment.user_name || assignment.user_email}
                        </h4>
                        <p className="text-sm text-gray-600">{assignment.user_email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {assignment.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            Assigned on {new Date(assignment.assigned_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(assignment.user_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Assign Users to {selectedProject.project_name}
              </h3>
              <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={filterAssigned === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterAssigned('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterAssigned === 'assigned' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterAssigned('assigned')}
                >
                  Assigned
                </Button>
                <Button
                  variant={filterAssigned === 'unassigned' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterAssigned('unassigned')}
                >
                  Unassigned
                </Button>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No users found matching your search' : 'No client users available'}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {user.full_name || user.email}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Client
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.is_assigned ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserMinus className="w-4 h-4" />
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAssignUser(user.id, 'viewer')}
                          className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Assign All */}
            {unassignedUsers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    unassignedUsers.forEach(user => {
                      if (!user.is_assigned) {
                        handleAssignUser(user.id, 'viewer');
                      }
                    });
                  }}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign All Unassigned Users ({unassignedUsers.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
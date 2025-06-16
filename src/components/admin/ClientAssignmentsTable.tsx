"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, X, Check, Search, UserPlus, UserMinus, FolderOpen, Mail, RefreshCw } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useProjectAssignments, type ProjectAssignment, type AssignmentUser } from '@/hooks/useProjectAssignments';
import { Project } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface ClientAssignmentWithProject extends ProjectAssignment {
  project_name?: string;
}

export function ClientAssignmentsTable() {
  const { projects, refetch } = useProjects();
  const {
    loading,
    error,
    getProjectAssignments,
    getAssignableUsers,
    assignUserToProject,
    removeUserFromProject
  } = useProjectAssignments();

  const [allAssignments, setAllAssignments] = useState<ClientAssignmentWithProject[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignmentUser[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Send reset password link function
  const sendResetPasswordLink = async (userEmail: string, userName: string) => {
    setSendingInvite(userEmail);
    
    try {
      const response = await fetch('/api/admin/resend-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ email: userEmail.trim() }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Reset password link sent successfully to ${userName} (${userEmail})!`);
      } else {
        alert(`Failed to send reset password link: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending reset password link:', error);
      alert('Error sending reset password link. Check console for details.');
    } finally {
      setSendingInvite(null);
    }
  };

  // Load all client assignments across all projects
  const loadAllClientAssignments = async () => {
    if (projects.length === 0) return;
    
    setIsLoading(true);
    try {
      const allAssignmentsPromises = projects.map(async (project) => {
        const assignments = await getProjectAssignments(project.id);
        return assignments.map(assignment => ({
          ...assignment,
          project_name: project.project_name
        }));
      });

      const allAssignmentsArrays = await Promise.all(allAssignmentsPromises);
      const flattenedAssignments = allAssignmentsArrays.flat();
      
      setAllAssignments(flattenedAssignments);
    } catch (error) {
      console.error('Error loading all client assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load assignable users (all clients from all companies)
  const loadAssignableUsers = async () => {
    if (projects.length === 0) return;
    
    try {
      // Get assignable users from the first project (they're global anyway)
      const users = await getAssignableUsers(projects[0].id);
      setAssignableUsers(users);
    } catch (error) {
      console.error('Error loading assignable users:', error);
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        await refetch();
        console.log('Projects loaded successfully');
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, [refetch]);

  useEffect(() => {
    if (projects.length > 0) {
      loadAllClientAssignments();
      loadAssignableUsers();
    }
  }, [projects]);

  const handleAssignUser = async (userId: string, projectId: string, role: 'viewer' | 'collaborator' | 'editor' = 'viewer') => {
    const success = await assignUserToProject(projectId, userId, role);
    if (success) {
      await loadAllClientAssignments();
      setShowAssignModal(false);
    }
  };

  const handleRemoveUser = async (userId: string, projectId: string) => {
    const success = await removeUserFromProject(projectId, userId);
    if (success) {
      await loadAllClientAssignments();
    }
  };

  const filteredAssignments = allAssignments.filter(assignment => 
    assignment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clientUsers = assignableUsers.filter(user => user.role_id === 5); // Only client_collaborator role

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        <h3 className="font-medium mb-2">Error Loading Client Assignments</h3>
        <p>{error}</p>
        <div className="mt-3 text-sm">
          <p><strong>Debugging Info:</strong></p>
          <p>• Check browser console for detailed errors</p>
          <p>• Verify the project_users table exists in Supabase</p>
          <p>• Try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Client Project Assignments</h3>
          <p className="text-sm text-gray-600">View and manage all client assignments across projects</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAssignModal(true)} size="sm">
            <UserPlus className="w-4 h-4 mr-1" />
            Assign Clients
          </Button>
          <Button 
            onClick={async () => {
              const email = prompt("Enter user email to resend invitation:");
              if (email) {
                try {
                  const response = await fetch('/api/admin/resend-invitation', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    },
                    body: JSON.stringify({ email: email.trim() }),
                  });
                  
                  const result = await response.json();
                  
                  if (response.ok) {
                    alert('Invitation resent successfully! Check email for new invitation link.');
                  } else {
                    alert('Failed to resend invitation: ' + result.error);
                  }
                } catch (error) {
                  console.error('Error resending invitation:', error);
                  alert('Error resending invitation. Check console for details.');
                }
              }
            }}
            size="sm" 
            variant="secondary"
            className="flex items-center space-x-1"
          >
            <Mail className="w-4 h-4" />
            <span>Resend Invite</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients, projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Client Assignments Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900">
            All Client Assignments ({filteredAssignments.length})
          </h4>
        </div>
        
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading client assignments...</span>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>
              {searchTerm 
                ? 'No client assignments found matching your search'
                : 'No clients assigned to any projects'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment, index) => (
                  <tr key={`${assignment.user_id}-${assignment.project_id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="font-medium text-gray-900">
                          {assignment.user_name || 'Unknown User'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {assignment.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{assignment.project_name || 'Unknown Project'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {assignment.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendResetPasswordLink(assignment.user_email || '', assignment.user_name || assignment.user_email || 'Unknown User')}
                          disabled={sendingInvite === assignment.user_email}
                          className="flex items-center space-x-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          {sendingInvite === assignment.user_email ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          <span>Reset Password</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveUser(assignment.user_id, assignment.project_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Assign Clients to Projects
              </h3>
              <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Available Clients */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Available Clients</h4>
              {clientUsers.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No client users found. Add clients using the user management section above.
                </p>
              ) : (
                <div className="space-y-3">
                  {clientUsers.map((user) => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.full_name || user.email}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.company_name && (
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                                {user.company_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Project assignment options */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">Assign to Projects:</div>
                        <div className="grid grid-cols-1 gap-2">
                          {projects.map((project) => {
                            const isAssigned = allAssignments.some(
                              assignment => assignment.user_id === user.id && assignment.project_id === project.id
                            );
                            
                            return (
                              <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="text-sm">
                                  <div className="font-medium">{project.project_name}</div>
                                  <div className="text-xs text-gray-500">{project.client_company_name}</div>
                                </div>
                                {isAssigned ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    Already Assigned
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAssignUser(user.id, project.id, 'viewer')}
                                    className="bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    <UserPlus className="w-3 h-3 mr-1" />
                                    Assign
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
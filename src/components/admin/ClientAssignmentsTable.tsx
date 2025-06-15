"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, X, Check, Search, UserPlus, UserMinus, FolderOpen, Mail } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useProjectAssignments, type ProjectAssignment, type AssignmentUser } from '@/hooks/useProjectAssignments';
import { Project } from '@/lib/types';
import { supabase } from '@/lib/supabase';

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



  // Test database connectivity
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      
      // Test 1: Check if project_users table exists
      const { data: tableTest, error: tableError } = await supabase
        .from('project_users')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('Table test failed:', tableError);
        setTestError(`Database table error: ${tableError.message}`);
        return;
      }
      
      console.log('✅ project_users table exists');
      
      // Test 2: Check if functions exist
      const { data: functionTest, error: functionError } = await supabase
        .rpc('assign_user_to_project', {
          p_project_id: 'test',
          p_user_id: 'test',
          p_role: 'viewer'
        });
      
      if (functionError && !functionError.message.includes('invalid input')) {
        console.error('Function test failed:', functionError);
        setTestError(`Database function error: ${functionError.message}`);
        return;
      }
      
      console.log('✅ Database functions accessible');
      
      // Test 3: Check for Joe Smith user (by exact email)
      const { data: joeSmithData, error: joeError } = await supabase
        .from('users')
        .select('id, email, full_name, status')
        .eq('email', 'clachance1424@gmail.com');
      
      if (joeError) {
        console.error('Error checking for Joe Smith:', joeError);
      } else {
        console.log('Joe Smith users found:', joeSmithData);
        setTestError(`Database OK. Joe Smith users found: ${joeSmithData?.length || 0}`);
      }
      
    } catch (err) {
      console.error('Database test failed:', err);
      setTestError(`Connection test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignmentUser[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [testError, setTestError] = useState<string | null>(null);

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

  const filteredUsers = assignableUsers.filter(user => 
    !user.is_assigned && (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )
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
          <div className="mt-2 space-x-2">
            <Button onClick={testDatabaseConnection} size="sm" variant="outline">
              Test Database Connection
            </Button>
            <Button 
              onClick={async () => {
                const email = prompt("Enter Joe Smith's email to resend invitation:");
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
                      alert('Invitation resent successfully!');
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
            >
              Resend Invitation Email
            </Button>
            {testError && (
              <div className="mt-2 text-red-600 text-xs">{testError}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Client Project Assignments</h3>
          <p className="text-sm text-gray-600">Assign client users to specific projects</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowProjectSelector(!showProjectSelector)}
            className="flex items-center space-x-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>{selectedProject ? selectedProject.project_name : 'Select Project'}</span>
          </Button>
          {selectedProject && (
            <Button onClick={() => setShowAssignModal(true)} size="sm">
              <UserPlus className="w-4 h-4 mr-1" />
              Assign Clients
            </Button>
          )}
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
          <Button 
            onClick={async () => {
              try {
                console.log('=== DEBUGGING CLIENT ASSIGNMENTS ===');
                
                // Check all users in company
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('No authenticated user');
                
                const { data: companyUser } = await supabase
                  .from('company_users')
                  .select('company_id')
                  .eq('user_id', user.id)
                  .single();
                
                console.log('Current user company:', companyUser?.company_id);
                
                // Check ALL company_users entries (not filtered by company)
                const { data: allCompanyUsers } = await supabase
                  .from('company_users')
                  .select('user_id, company_id, role_id');
                
                console.log('ALL company_users entries:', allCompanyUsers);
                
                // Check specifically for role_id = 5
                const { data: clientsRoleCheck } = await supabase
                  .from('company_users')
                  .select('user_id, company_id, role_id')
                  .eq('role_id', 5);
                
                console.log('Users with role_id = 5:', clientsRoleCheck);
                
                // Check Joe Smith specifically by email
                const { data: joeSmithUser } = await supabase
                  .from('users')
                  .select('id')
                  .eq('email', 'clachance1424@gmail.com')
                  .single();
                
                const { data: joeSmithCheck } = await supabase
                  .from('company_users')
                  .select('user_id, company_id, role_id')
                  .eq('user_id', joeSmithUser?.id);
                
                console.log('Joe Smith in company_users:', joeSmithCheck);
                
                // Filter only clients from debug data
                const clientUsers = allCompanyUsers?.filter(cu => cu.role_id === 5);
                console.log('Client users from ALL entries:', clientUsers);
                
                alert(`Debug complete! Check console for details. 
                  - Total company_users entries: ${allCompanyUsers?.length || 0}
                  - Users with role_id=5: ${clientsRoleCheck?.length || 0}
                  - Joe Smith found: ${joeSmithCheck?.length || 0}`);
              } catch (error) {
                console.error('Debug error:', error);
                alert('Debug failed. Check console.');
              }
            }}
            size="sm" 
            variant="outline"
            className="flex items-center space-x-1"
          >
            <Search className="w-4 h-4" />
            <span>Debug Clients</span>
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      {showProjectSelector && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Select a Project</h4>
          <div className="grid gap-2 max-h-40 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setShowProjectSelector(false);
                }}
                className={`text-left p-3 rounded border transition-colors ${
                  selectedProject?.id === project.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
              >
                <div className="font-medium text-gray-900">{project.project_name}</div>
                <div className="text-sm text-gray-600">{project.client_company_name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Assignments */}
      {selectedProject && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="font-medium text-gray-900">
              Assignments for {selectedProject.project_name}
            </h4>
          </div>
          
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No clients assigned to this project</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <div key={assignment.user_id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {assignment.user_name || assignment.user_email}
                      </div>
                      <div className="text-sm text-gray-500">{assignment.user_email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {assignment.role}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(assignment.user_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Assign Clients to {selectedProject.project_name}
              </h3>
              <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Available Clients */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Available Clients ({filteredUsers.length})</h4>
              {filteredUsers.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  {clientUsers.length === 0 
                    ? 'No client users found. Add clients using the "Add Client" button above.'
                    : searchTerm 
                    ? 'No clients found matching your search'
                    : 'All clients are already assigned to this project'
                  }
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-orange-600" />
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
                    <Button
                      size="sm"
                      onClick={() => handleAssignUser(user.id, 'viewer')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Assign All */}
            {filteredUsers.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    filteredUsers.forEach(user => {
                      handleAssignUser(user.id, 'viewer');
                    });
                  }}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign All ({filteredUsers.length}) Clients
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProjectAssignment {
  project_id: string;
  user_id: string;
  role: 'viewer' | 'collaborator' | 'editor';
  assigned_by: string;
  assigned_at: string;
  // Joined data
  user_name?: string;
  user_email?: string;
  project_name?: string;
}

export interface AssignmentUser {
  id: string;
  email: string;
  full_name?: string;
  role_id: number;
  is_assigned: boolean;
  company_name?: string;
}

export function useProjectAssignments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all assignments for a project
  const getProjectAssignments = useCallback(async (projectId: string): Promise<ProjectAssignment[]> => {
    try {
      setLoading(true);
      setError(null);

      // First check if the project_users table exists
      const { data, error } = await supabase
        .from('project_users')
        .select(`
          project_id,
          user_id,
          role,
          assigned_by,
          assigned_at,
          users!user_id(
            id,
            email,
            full_name
          ),
          projects!project_id(
            id,
            project_name
          )
        `)
        .eq('project_id', projectId);

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.message.includes('relation "project_users" does not exist')) {
          throw new Error('Project assignments table not found. Please run the database setup script.');
        }
        throw error;
      }

      return (data || []).map((assignment: any) => ({
        project_id: assignment.project_id,
        user_id: assignment.user_id,
        role: assignment.role,
        assigned_by: assignment.assigned_by,
        assigned_at: assignment.assigned_at,
        user_name: assignment.users?.full_name || assignment.users?.email,
        user_email: assignment.users?.email,
        project_name: assignment.projects?.project_name
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project assignments';
      setError(errorMessage);
      console.error('Error fetching project assignments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all users in the company with their assignment status for a project
  const getAssignableUsers = useCallback(async (projectId: string): Promise<AssignmentUser[]> => {
    try {
      setLoading(true);
      setError(null);

      // Get ALL client users from ANY company (not restricted to current user's company)
      // First get company_users with role_id = 5 (clients)
      const { data: clientCompanyUsers, error: usersError } = await supabase
        .from('company_users')
        .select('user_id, company_id, role_id')
        .eq('role_id', 5);

      if (usersError) {
        console.error('Error fetching client company users:', usersError);
        throw usersError;
      }

      console.log('Client company users:', clientCompanyUsers);

      if (!clientCompanyUsers || clientCompanyUsers.length === 0) {
        console.log('No client users found in company_users table');
        return [];
      }

      // Get user details
      const userIds = clientCompanyUsers.map(cu => cu.user_id);
      const { data: users, error: userDetailsError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds);

      if (userDetailsError) {
        console.error('Error fetching user details:', userDetailsError);
        throw userDetailsError;
      }

      // Get company names
      const companyIds = [...new Set(clientCompanyUsers.map(cu => cu.company_id))];
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
      }

      // Combine the data
      const companyUsers = clientCompanyUsers.map(cu => {
        const user = users?.find(u => u.id === cu.user_id);
        const company = companies?.find(c => c.id === cu.company_id);
        return {
          user_id: cu.user_id,
          role_id: 5,
          users: user,
          companies: company
        };
             });

      console.log('Combined company users data:', companyUsers);

      // Get current assignments for this project
      const { data: assignments, error: assignmentsError } = await supabase
        .from('project_users')
        .select('user_id')
        .eq('project_id', projectId);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      const assignedUserIds = new Set(assignments?.map(a => a.user_id) || []);

      return (companyUsers || []).map((cu: any) => ({
        id: cu.users?.id,
        email: cu.users?.email,
        full_name: cu.users?.full_name,
        role_id: cu.role_id,
        is_assigned: assignedUserIds.has(cu.users?.id),
        company_name: cu.companies?.name
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignable users';
      setError(errorMessage);
      console.error('Error fetching assignable users:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign a user to a project
  const assignUserToProject = useCallback(async (
    projectId: string, 
    userId: string, 
    role: 'viewer' | 'collaborator' | 'editor' = 'viewer'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.rpc('assign_user_to_project', {
        p_project_id: projectId,
        p_user_id: userId,
        p_role: role
      });

      if (error) throw error;

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign user to project';
      setError(errorMessage);
      console.error('Error assigning user to project:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove a user from a project
  const removeUserFromProject = useCallback(async (projectId: string, userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.rpc('remove_user_from_project', {
        p_project_id: projectId,
        p_user_id: userId
      });

      if (error) throw error;

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove user from project';
      setError(errorMessage);
      console.error('Error removing user from project:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get projects assigned to the current user (for client users)
  const getUserAssignedProjects = useCallback(async (): Promise<string[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).map(assignment => assignment.project_id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user assigned projects';
      setError(errorMessage);
      console.error('Error fetching user assigned projects:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getProjectAssignments,
    getAssignableUsers,
    assignUserToProject,
    removeUserFromProject,
    getUserAssignedProjects
  };
} 
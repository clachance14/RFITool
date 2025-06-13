"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface DebugInfo {
  userId?: string;
  userEmail?: string;
  companyUser?: any;
  company?: any;
  projects?: any[];
  rfis?: any[];
  rfisRaw?: any[];
  error?: string;
}

export default function DebugRFIsPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const runDiagnostics = async () => {
    setLoading(true);
    const info: DebugInfo = {};

    try {
      // 1. Check current user
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError) {
        info.error = `Auth Error: ${authError.message}`;
        setDebugInfo(info);
        setLoading(false);
        return;
      }

      info.userId = authUser.user?.id;
      info.userEmail = authUser.user?.email;

      // 2. Check company_users association
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select('*, role_id')
        .eq('user_id', authUser.user!.id);

      if (companyUserError) {
        info.error = `Company User Error: ${companyUserError.message}`;
      } else {
        info.companyUser = companyUserData;
      }

      // 3. If we have company association, get company details
      if (companyUserData && companyUserData.length > 0) {
        const companyId = companyUserData[0].company_id;
        
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError) {
          info.error = `Company Error: ${companyError.message}`;
        } else {
          info.company = companyData;
        }

        // 4. Check projects for this company
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('company_id', companyId);

        if (projectsError) {
          info.error = `Projects Error: ${projectsError.message}`;
        } else {
          info.projects = projectsData;
        }

        // 5. Check RFIs with company filtering (the way the app does it)
        const { data: rfisData, error: rfisError } = await supabase
          .from('rfis')
          .select(`
            *,
            projects!inner(company_id, project_name)
          `)
          .eq('projects.company_id', companyId);

        if (rfisError) {
          info.error = `RFIs Error: ${rfisError.message}`;
        } else {
          info.rfis = rfisData;
        }

        // 6. Also check raw RFIs without filtering
        const { data: rfisRawData, error: rfisRawError } = await supabase
          .from('rfis')
          .select('*');

        if (!rfisRawError) {
          info.rfisRaw = rfisRawData;
        }
      }

    } catch (err) {
      info.error = `Unexpected Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  const createTestRFI = async () => {
    if (!debugInfo.projects || debugInfo.projects.length === 0) {
      alert('No projects found. Create a project first.');
      return;
    }

    try {
      const projectId = debugInfo.projects[0].id;
      const testRFI = {
        rfi_number: `TEST-${Date.now()}`,
        project_id: projectId,
        subject: 'Test RFI for Debugging',
        contractor_question: 'This is a test RFI created for debugging purposes.',
        status: 'draft',
        created_by: debugInfo.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('rfis')
        .insert([testRFI])
        .select()
        .single();

      if (error) {
        alert(`Error creating test RFI: ${error.message}`);
      } else {
        alert('Test RFI created successfully!');
        runDiagnostics(); // Refresh data
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const createTestProject = async () => {
    if (!debugInfo.companyUser || debugInfo.companyUser.length === 0) {
      alert('No company association found. Cannot create project.');
      return;
    }

    try {
      const companyId = debugInfo.companyUser[0].company_id;
      const testProject = {
        project_name: `Test Project ${Date.now()}`,
        client_company_name: 'Test Client Company',
        contractor_job_number: `JOB-${Date.now()}`,
        company_id: companyId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([testProject])
        .select()
        .single();

      if (error) {
        alert(`Error creating test project: ${error.message}`);
      } else {
        alert('Test project created successfully! Now you can create RFIs.');
        runDiagnostics(); // Refresh data
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const accessExistingRFIs = async () => {
    try {
      // First, get the companies that have RFIs
      const { data: rfisWithProjects, error: rfisError } = await supabase
        .from('rfis')
        .select(`
          id,
          projects!inner(company_id, project_name)
        `)
        .limit(1);

      if (rfisError || !rfisWithProjects || rfisWithProjects.length === 0) {
        alert('No RFIs with projects found');
        return;
      }

      const targetCompanyId = (rfisWithProjects[0].projects as any).company_id;
      
      // Update the user's company association to match the existing RFIs
      const { error: updateError } = await supabase
        .from('company_users')
        .update({ company_id: targetCompanyId })
        .eq('user_id', debugInfo.userId);

      if (updateError) {
        alert(`Error updating company association: ${updateError.message}`);
        return;
      }

      alert('Company association updated! You can now view existing RFIs. Refresh the page.');
      runDiagnostics(); // Refresh data
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!user) {
    return <div className="p-6">Please log in to run diagnostics.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">RFI Debug Information</h1>
        <div className="space-x-2">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Refresh Diagnostics'}
          </button>
          <button
            onClick={createTestProject}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
          >
            Create Test Project
          </button>
          <button
            onClick={createTestRFI}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Test RFI
          </button>
          <button
            onClick={accessExistingRFIs}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Access Existing RFIs
          </button>
        </div>
      </div>

      {debugInfo.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {debugInfo.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-2 text-sm">
            <div><strong>User ID:</strong> {debugInfo.userId || 'Not found'}</div>
            <div><strong>Email:</strong> {debugInfo.userEmail || 'Not found'}</div>
          </div>
        </div>

        {/* Company Association */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Company Association & Role</h2>
          <div className="text-sm">
            {debugInfo.companyUser && debugInfo.companyUser.length > 0 ? (
              <div className="space-y-2">
                <div><strong>Company ID:</strong> {debugInfo.companyUser[0].company_id}</div>
                <div><strong>Role ID:</strong> {debugInfo.companyUser[0].role_id}</div>
                <div><strong>Role:</strong> {
                  debugInfo.companyUser[0].role_id === 0 ? '🔑 App Owner (All Access)' :
                  debugInfo.companyUser[0].role_id === 1 ? '👑 Super Admin' :
                  debugInfo.companyUser[0].role_id === 2 ? '👥 Admin' :
                  debugInfo.companyUser[0].role_id === 3 ? '📝 RFI User' :
                  debugInfo.companyUser[0].role_id === 4 ? '👁️ View Only' :
                  debugInfo.companyUser[0].role_id === 5 ? '🤝 Client Collaborator' :
                  `Unknown (${debugInfo.companyUser[0].role_id})`
                }</div>
                <div><strong>Status:</strong> {debugInfo.companyUser[0].status}</div>
                {debugInfo.companyUser[0].role_id === 0 && (
                  <div className="text-green-600 font-medium">✅ As App Owner, you should see ALL projects and RFIs</div>
                )}
              </div>
            ) : (
              <div className="text-red-600">❌ No company association found</div>
            )}
          </div>
        </div>

        {/* Company Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Company Details</h2>
          <div className="text-sm">
            {debugInfo.company ? (
              <div className="space-y-2">
                <div><strong>Name:</strong> {debugInfo.company.company_name}</div>
                <div><strong>Type:</strong> {debugInfo.company.company_type}</div>
                <div><strong>Created:</strong> {new Date(debugInfo.company.created_at).toLocaleDateString()}</div>
              </div>
            ) : (
              <div className="text-gray-600">No company details</div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Projects ({debugInfo.projects?.length || 0})</h2>
          <div className="text-sm max-h-40 overflow-y-auto">
            {debugInfo.projects && debugInfo.projects.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.projects.map((project, index) => (
                  <div key={project.id} className="border-b pb-2">
                    <div><strong>#{index + 1}:</strong> {project.project_name}</div>
                    <div className="text-gray-600">ID: {project.id}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-600">❌ No projects found</div>
            )}
          </div>
        </div>

        {/* Filtered RFIs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">RFIs (Company Filtered) ({debugInfo.rfis?.length || 0})</h2>
          <div className="text-sm max-h-40 overflow-y-auto">
            {debugInfo.rfis && debugInfo.rfis.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.rfis.map((rfi, index) => (
                  <div key={rfi.id} className="border-b pb-2">
                    <div><strong>#{index + 1}:</strong> {rfi.rfi_number}</div>
                    <div>{rfi.subject}</div>
                    <div className="text-gray-600">Status: {rfi.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-orange-600">⚠️ No RFIs found with company filtering</div>
            )}
          </div>
        </div>

        {/* Raw RFIs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">All RFIs (No Filter) ({debugInfo.rfisRaw?.length || 0})</h2>
          <div className="text-sm max-h-40 overflow-y-auto">
            {debugInfo.rfisRaw && debugInfo.rfisRaw.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.rfisRaw.map((rfi, index) => (
                  <div key={rfi.id} className="border-b pb-2">
                    <div><strong>#{index + 1}:</strong> {rfi.rfi_number}</div>
                    <div>{rfi.subject}</div>
                    <div className="text-gray-600">Project: {rfi.project_id}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-600">❌ No RFIs found at all</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-yellow-700 text-sm">
          <li>If no company association: Run the admin isolation migration script</li>
          <li>If no projects: Create a project first</li>
          <li>If no RFIs: Use the "Create Test RFI" button above</li>
          <li>If RFIs exist but aren't filtered: Check RLS policies</li>
          <li>Check browser console for additional errors</li>
        </ol>
      </div>
    </div>
  );
} 
'use client';

import { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/contexts/RFIContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export function Dashboard() {
  const { projects } = useProjects();
  const { rfis } = useRFIs();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const projectRFIs = useMemo(() => rfis.filter(rfi => rfi.project_id === selectedProjectId), [rfis, selectedProjectId]);

  // Date range for current week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekRange = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  // Weekly stats
  const totalRFIs = projectRFIs.length;
  const openRFIs = projectRFIs.filter(rfi => rfi.status === 'draft' || rfi.status === 'sent').length;
  const overdueRFIs = projectRFIs.filter(rfi => rfi.status === 'overdue').length;
  const newRFIsThisWeek = projectRFIs.filter(rfi => {
    const created = new Date(rfi.created_at);
    return created >= weekStart && created <= weekEnd;
  }).length;
  const respondedRFIsThisWeek = projectRFIs.filter(rfi => {
    if (!rfi.response_date) return false;
    const responded = new Date(rfi.response_date);
    return responded >= weekStart && responded <= weekEnd;
  }).length;

  // Overdue RFIs
  const overdueRFIsList = projectRFIs.filter(rfi => rfi.status === 'overdue');
  // Recent RFI History (last 10)
  const recentRFIs = [...projectRFIs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  return (
    <div className="bg-white p-8 rounded-lg shadow max-w-5xl mx-auto print:bg-white print:shadow-none print:p-4">
      {/* Project Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="project-select" className="font-semibold text-gray-700">Select Project:</label>
        <select
          id="project-select"
          className="border border-gray-300 rounded px-3 py-2"
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
        >
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.project_name}</option>
          ))}
        </select>
      </div>

      {/* Report Header */}
      <div className="flex items-center justify-between mb-8 print:mb-4">
        {/* Contractor Logo */}
        <div className="w-32 h-16 flex items-center justify-center rounded print:border print:border-gray-400">
          {(() => {
            const contractorLogo = localStorage.getItem('contractor_logo');
            return contractorLogo ? (
              <img
                src={contractorLogo}
                alt="Contractor Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="bg-gray-200 w-full h-full flex items-center justify-center rounded">
                <span className="text-xs text-gray-500">No Logo</span>
              </div>
            );
          })()}
        </div>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-1">RFI Status Report</h1>
          <div className="text-lg font-semibold text-blue-700 mb-1">{selectedProject?.project_name || 'Select a project'}</div>
          <div className="text-gray-600 text-sm">Week: {weekRange}</div>
        </div>
        {/* Client Logo */}
        <div className="w-32 h-16 flex items-center justify-center rounded print:border print:border-gray-400">
          {(() => {
            const clientLogo = localStorage.getItem('client_logo');
            return clientLogo ? (
              <img
                src={clientLogo}
                alt="Client Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="bg-gray-200 w-full h-full flex items-center justify-center rounded">
                <span className="text-xs text-gray-500">No Logo</span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Project Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:mb-4">
        <div className="bg-gray-50 rounded p-4 border print:border-gray-300">
          <div className="text-xs text-gray-500">Client</div>
          <div className="font-semibold">{selectedProject?.client_company_name || '-'}</div>
        </div>
        <div className="bg-gray-50 rounded p-4 border print:border-gray-300">
          <div className="text-xs text-gray-500">Contract #</div>
          <div className="font-semibold">{selectedProject?.job_contract_number || '-'}</div>
        </div>
        <div className="bg-gray-50 rounded p-4 border print:border-gray-300">
          <div className="text-xs text-gray-500">Project Manager</div>
          <div className="font-semibold">{selectedProject?.project_manager_contact || '-'}</div>
        </div>
      </div>

      {/* Weekly Summary Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 print:mb-4">
        <SummaryCard label="Total RFIs" value={totalRFIs} />
        <SummaryCard label="Open RFIs" value={openRFIs} />
        <SummaryCard label="Overdue RFIs" value={overdueRFIs} />
        <SummaryCard label="New RFIs This Week" value={newRFIsThisWeek} />
        <SummaryCard label="Responded RFIs This Week" value={respondedRFIsThisWeek} />
      </div>

      {/* Detailed Status Section */}
      <div className="mb-8 print:mb-4">
        <h2 className="text-lg font-bold mb-2">Overdue RFIs</h2>
        <RfiTable rfis={overdueRFIsList} emptyMessage="No overdue RFIs." />
      </div>
      <div className="mb-8 print:mb-4">
        <h2 className="text-lg font-bold mb-2">Recent RFI History (Last 10)</h2>
        <RfiTable rfis={recentRFIs} emptyMessage="No recent RFIs." />
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
        <div className="bg-gray-50 rounded p-4 border flex flex-col items-center print:border-gray-300">
          <h3 className="font-semibold mb-2">Open RFIs by Status</h3>
          <div className="w-40 h-40 flex items-center justify-center bg-gray-200 rounded-full">
            <span className="text-gray-500 text-xs">[Pie Chart Placeholder]</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded p-4 border flex flex-col items-center print:border-gray-300">
          <h3 className="font-semibold mb-2">RFI Activity This Week</h3>
          <div className="w-full h-40 flex items-center justify-center bg-gray-200 rounded">
            <span className="text-gray-500 text-xs">[Bar Chart Placeholder]</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 flex flex-col items-center print:border-gray-300">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-blue-700">{value}</div>
    </div>
  );
}

function RfiTable({ rfis, emptyMessage }: { rfis: any[]; emptyMessage: string }) {
  if (!rfis || rfis.length === 0) {
    return <div className="text-gray-400 text-sm italic p-4">{emptyMessage}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">RFI #</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Subject</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Created</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Due</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Attachments</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Response</th>
          </tr>
        </thead>
        <tbody>
          {rfis.map(rfi => (
            <tr key={rfi.id} className="border-t">
              <td className="px-3 py-2 text-sm">{rfi.rfi_number}</td>
              <td className="px-3 py-2 text-sm">{rfi.subject}</td>
              <td className="px-3 py-2 text-sm capitalize">{rfi.status}</td>
              <td className="px-3 py-2 text-sm">{rfi.created_at ? format(new Date(rfi.created_at), 'MMM d, yyyy') : '-'}</td>
              <td className="px-3 py-2 text-sm">{rfi.due_date ? format(new Date(rfi.due_date), 'MMM d, yyyy') : '-'}</td>
              <td className="px-3 py-2 text-sm">
                {rfi.attachment_files && rfi.attachment_files.length > 0 ? (
                  <span className="text-blue-600 font-medium">{rfi.attachment_files.length}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="px-3 py-2 text-sm">{rfi.response ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
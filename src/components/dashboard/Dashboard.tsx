'use client';

import { useState, useMemo, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { RFI } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Component to display contractor logo from database or localStorage fallback
function ContractorLogoDisplay() {
  const { session } = useAuth();
  const [contractorLogo, setContractorLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadContractorLogo = async () => {
      if (typeof window !== 'undefined' && session?.user?.id) {
        try {
          // Try to load from database first
          const { data: userCompany } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', session.user.id)
            .single();
            
          if (userCompany) {
            const { data: company } = await supabase
              .from('companies')
              .select('logo_url')
              .eq('id', userCompany.company_id)
              .single();
              
            const logoUrl = company?.logo_url || localStorage.getItem('contractor_logo') || null;
            setContractorLogo(logoUrl);
          }
        } catch (error) {
          // Fallback to localStorage if database query fails
          const fallbackLogo = localStorage.getItem('contractor_logo') || null;
          setContractorLogo(fallbackLogo);
        }
      }
    };

    loadContractorLogo();
  }, [session?.user?.id]);

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
}

export function Dashboard() {
  const { projects } = useProjects();
  const { rfis, getRFIs, loading } = useRFIs();
  const { session } = useAuth();

  // Fetch RFIs when component mounts
  useEffect(() => {
    getRFIs();
  }, [getRFIs]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [contractorLogo, setContractorLogo] = useState<string | null>(null);

  // Load contractor logo
  useEffect(() => {
    const loadContractorLogo = async () => {
      if (typeof window !== 'undefined' && session?.user?.id) {
        try {
          // Try to load from database first
          const { data: userCompany } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', session.user.id)
            .single();
            
          if (userCompany) {
            const { data: company } = await supabase
              .from('companies')
              .select('logo_url')
              .eq('id', userCompany.company_id)
              .single();
              
            const logoUrl = company?.logo_url || localStorage.getItem('contractor_logo') || null;
            setContractorLogo(logoUrl);
          }
        } catch (error) {
          // Fallback to localStorage if database query fails
          const fallbackLogo = localStorage.getItem('contractor_logo') || null;
          setContractorLogo(fallbackLogo);
        }
      }
    };

    loadContractorLogo();
  }, [session?.user?.id]);


  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const projectRFIs = useMemo(() => rfis.filter(rfi => rfi.project_id === selectedProjectId), [rfis, selectedProjectId]);

  // Date range for current week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekRange = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  // Weekly stats
  const totalRFIs = projectRFIs.length;
  const openRFIs = projectRFIs.filter(rfi => 
    rfi.status === 'draft' || 
    rfi.status === 'active'
  ).length;

  // Business day calculation for 5-day overdue rule
  const addBusinessDays = (startDate: Date, businessDays: number): Date => {
    const result = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }
    
    return result;
  };

  const isRfiOverdue = (rfi: RFI): boolean => {
    if (!rfi.created_at) return false;
    
    const createdDate = new Date(rfi.created_at);
    const dueDate = addBusinessDays(createdDate, 5);
    const today = new Date();
    
    // Only consider open RFIs as potentially overdue
    const openStages = ['submitted', 'in_review', 'pending_response', 'field_work_in_progress'];
    if (!rfi.stage || !openStages.includes(rfi.stage)) return false;
    
    return today > dueDate;
  };

  const overdueRFIs = projectRFIs.filter(rfi => isRfiOverdue(rfi)).length;

  const newRFIsThisWeek = projectRFIs.filter(rfi => {
    if (!rfi.created_at) return false;
    const created = new Date(rfi.created_at);
    return created >= weekStart && created <= weekEnd;
  }).length;
  
  const respondedRFIsThisWeek = projectRFIs.filter(rfi => {
    if (!rfi.response_date) return false;
    const responded = new Date(rfi.response_date);
    return responded >= weekStart && responded <= weekEnd;
  }).length;

  // Calculate actual cost for an RFI
  const calculateActualCost = (rfi: RFI): number => {
    // First try timesheet summary if available (most accurate actual costs)
    if (rfi.timesheet_summary?.total_cost) {
      return rfi.timesheet_summary.total_cost;
    }
    
    // Fall back to individual actual cost fields if populated
    const actualLaborCost = rfi.actual_labor_cost || 0;
    const actualMaterialCost = rfi.actual_material_cost || 0;
    const actualEquipmentCost = rfi.actual_equipment_cost || 0;
    const actualTotalCost = rfi.actual_total_cost || 0;
    
    // Use actual_total_cost if available, otherwise sum individual components
    return actualTotalCost || (actualLaborCost + actualMaterialCost + actualEquipmentCost);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Function to determine field work status
  const getFieldWorkStatus = (rfi: RFI): string => {
    // First check: Does this RFI require field work?
    const requiresFieldWork = rfi.requires_field_work || 
                             (rfi.field_work_description && rfi.field_work_description.trim().length > 0);
    
    // If no field work is required, show "None Required"
    if (!requiresFieldWork) {
      return 'None Required';
    }
    
    // Field work IS required - check progress status
    if (rfi.work_completed_date) {
      return 'Completed';
    }
    if (rfi.stage === 'field_work_in_progress' || 
        (rfi.work_started_date && !rfi.work_completed_date)) {
      return 'In Progress';
    }
    
    // Required but not started yet
    return 'Not Started';
  };

  // Recent RFI History (last 10)
  const recentRFIs = [...projectRFIs].sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate;
  }).slice(0, 10);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow max-w-5xl mx-auto print:bg-white print:shadow-none print:p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading RFI data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow max-w-5xl mx-auto print:bg-white print:shadow-none print:p-4">
      {/* Project Selector and PDF Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label htmlFor="project-select" className="font-semibold text-gray-700">Select Project:</label>
          <select
            id="project-select"
            className="border border-gray-300 rounded px-3 py-2"
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.project_name}</option>
            ))}
          </select>
        </div>
        
        {/* PDF Generation Button - Only show when project is selected */}
        {selectedProjectId && (
          <button
            className="print:hidden flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            onClick={async () => {
              try {
                setGeneratingPDF(true);
                
                // Prepare data for PDF generation with all RFI details
                const enhancedRFIs = recentRFIs.map(rfi => ({
                  ...rfi,
                  actualCost: calculateActualCost(rfi),
                  formattedCost: formatCurrency(calculateActualCost(rfi)),
                  fieldWorkStatus: getFieldWorkStatus(rfi),
                  isOverdue: isRfiOverdue(rfi),
                  formattedCreatedDate: rfi.created_at ? format(new Date(rfi.created_at), 'MMM d, yyyy') : '-',
                  hasResponse: rfi.response_date ? 'Yes' : 'No'
                }));

                const reportData = {
                  project: selectedProject,
                  rfis: enhancedRFIs,
                  stats: {
                    totalRFIs,
                    openRFIs,
                    overdueRFIs,
                    newRFIsThisWeek,
                    respondedRFIsThisWeek,
                    weekRange
                  },
                  logos: {
                    contractorLogo: contractorLogo,
                    clientLogo: selectedProject?.client_logo_url || null
                  }
                };

                const response = await fetch('/api/download-report', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(reportData)
                });

                if (!response.ok) {
                  throw new Error('Failed to generate PDF');
                }

                // Create download link
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rfi-report-${selectedProject?.project_name || 'report'}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF report. Please try again.');
              } finally {
                setGeneratingPDF(false);
              }
            }}
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Report Header */}
      <div className="flex items-center justify-between mb-8 print:mb-4 print:break-inside-avoid">
        {/* Contractor Logo */}
        <div className="w-32 h-16 flex items-center justify-center rounded print:border print:border-gray-400">
          <ContractorLogoDisplay />
        </div>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-1">RFI Status Report</h1>
          <div className="text-lg font-semibold text-blue-700 mb-1">{selectedProject?.project_name || 'Select a project'}</div>
          <div className="text-gray-600 text-sm">Week: {weekRange}</div>
        </div>
        {/* Client Logo */}
        <div className="w-32 h-16 flex items-center justify-center rounded print:border print:border-gray-400">
          {selectedProject?.client_logo_url ? (
            <img
              src={selectedProject.client_logo_url}
              alt="Client Logo"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="bg-gray-200 w-full h-full flex items-center justify-center rounded">
              <span className="text-xs text-gray-500">No Logo</span>
            </div>
          )}
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
          <div className="font-semibold">{selectedProject?.client_contact_name || '-'}</div>
        </div>
      </div>

      {!selectedProjectId ? (
        /* No Project Selected Message */
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h6m-6 4h6m-6 4h6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Please Select a Project</h3>
            <p className="text-gray-600 mb-4">
              Choose a project from the dropdown above to view RFI status reports, statistics, and project details.
            </p>
            <p className="text-sm text-gray-500">
              RFI data will appear here once you make a selection.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Weekly Summary Section */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 print:mb-4 print:break-inside-avoid">
            <SummaryCard label="Total RFIs" value={totalRFIs} />
            <SummaryCard label="Open RFIs" value={openRFIs} />
            <SummaryCard label="Overdue RFIs" value={overdueRFIs} />
            <SummaryCard label="New RFIs This Week" value={newRFIsThisWeek} />
            <SummaryCard label="Responded RFIs This Week" value={respondedRFIsThisWeek} />
          </div>

          {/* Detailed Status Section */}
          <div className="mb-8 print:mb-4">
            <h2 className="text-lg font-bold mb-2 print:text-black">Recent RFI History (Last 10)</h2>
            <RfiTable 
              rfis={recentRFIs} 
              emptyMessage="No recent RFIs." 
              calculateActualCost={calculateActualCost}
              formatCurrency={formatCurrency}
              getFieldWorkStatus={getFieldWorkStatus}
              isRfiOverdue={isRfiOverdue}
            />
          </div>
        </>
      )}
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

interface RfiTableProps {
  rfis: any[];
  emptyMessage: string;
  calculateActualCost: (rfi: RFI) => number;
  formatCurrency: (amount: number) => string;
  getFieldWorkStatus: (rfi: RFI) => string;
  isRfiOverdue: (rfi: RFI) => boolean;
}

function RfiTable({ rfis, emptyMessage, calculateActualCost, formatCurrency, getFieldWorkStatus, isRfiOverdue }: RfiTableProps) {
  if (!rfis || rfis.length === 0) {
    return <div className="text-gray-400 text-sm italic p-4">{emptyMessage}</div>;
  }

  const getFieldWorkStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'None Required':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="min-w-full border border-gray-200 rounded print:border-black">
        <thead className="bg-gray-100 print:bg-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 print:text-black border-b print:border-black">RFI #</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 print:text-black border-b print:border-black">Subject</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 print:text-black border-b print:border-black">Status</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 print:text-black border-b print:border-black">Field Work</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 print:text-black border-b print:border-black">Created</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 print:text-black border-b print:border-black">Actual Cost</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 print:text-black border-b print:border-black">Response</th>
          </tr>
        </thead>
        <tbody>
          {rfis.map((rfi, index) => (
            <tr key={rfi.id || index} className="border-b border-gray-200 hover:bg-gray-50 print:border-black print:hover:bg-transparent">
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>{rfi.rfi_number || 'N/A'}</span>
                  {isRfiOverdue(rfi) && (
                    <span className="text-yellow-600" title="This RFI is overdue (>5 business days)">
                      ⚠️
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm">{rfi.subject || '-'}</td>
              <td className="px-4 py-3 text-sm">{rfi.status}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFieldWorkStatusColor(getFieldWorkStatus(rfi))}`}>
                  {getFieldWorkStatus(rfi)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{rfi.created_at ? format(new Date(rfi.created_at), 'MMM d, yyyy') : '-'}</td>
              <td className="px-4 py-3 text-sm">
                <span className="text-green-600 font-medium">
                  {formatCurrency(calculateActualCost(rfi))}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{rfi.response ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
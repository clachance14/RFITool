"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Package, 
  Settings, 
  CheckSquare, 
  Square,
  Calendar,
  Filter,
  Users,
  Archive,
  Eye,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { 
  exportService, 
  AVAILABLE_EXPORT_FIELDS, 
  DEFAULT_EXPORT_FIELDS, 
  ExportOptions,
  ExportField 
} from '@/services/exportService';
import { format } from 'date-fns';
import { RfiDetailView } from '@/components/rfi/RfiDetailView';

interface ExportSectionProps {
  className?: string;
}

interface RFISelection {
  [key: string]: boolean;
}

export function ExportSection({ className = "" }: ExportSectionProps) {
  const { session } = useAuth();
  const { projects } = useProjects();
  const [isLoading, setIsLoading] = useState(false);
  const [rfis, setRfis] = useState<any[]>([]);
  const [filteredRfis, setFilteredRfis] = useState<any[]>([]);
  const [selectedRfis, setSelectedRfis] = useState<RFISelection>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    selectedFields: DEFAULT_EXPORT_FIELDS.map(f => f.key),
    includeAttachments: true,
    exportFormat: 'excel',
  });
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Field selection by category
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['basic']));
  
  // PDF generation
  const [generatingPDFs, setGeneratingPDFs] = useState(false);
  const pdfElementRef = useRef<HTMLDivElement>(null);
  const [currentPDFRfi, setCurrentPDFRfi] = useState<any>(null);

  // Fetch RFIs
  useEffect(() => {
    fetchRFIs();
  }, [session?.user?.id]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [rfis, selectedProject, statusFilter, dateRange]);

  const fetchRFIs = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      
      // Simple approach: Fetch all RFIs first (similar to how useRFIs.getRFIs works)
      const { data: rfiData, error } = await supabase
        .from('rfis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching RFIs:', error);
        return;
      }

      console.log('Fetched RFIs:', rfiData);
      console.log('Session user:', session?.user?.id);

      // For each RFI, fetch attachments and project info
      const enrichedRfis = await Promise.all(
        (rfiData || []).map(async (rfi) => {
          // Fetch attachments
          const { data: attachments } = await supabase
            .from('rfi_attachments')
            .select('*')
            .eq('rfi_id', rfi.id);

          // Fetch project info
          const { data: project } = await supabase
            .from('projects')
            .select('project_name')
            .eq('id', rfi.project_id)
            .single();

          return {
            ...rfi,
            created_by_name: rfi.requested_by || 'Unknown',
            assigned_to_name: rfi.reviewed_by || 'Unassigned',
            response_by_name: rfi.client_response_submitted_by || 'No response',
            project_name: project?.project_name || 'Unknown Project',
            attachment_files: attachments || []
          };
        })
      );

      console.log('Enriched RFIs:', enrichedRfis);
      setRfis(enrichedRfis);
    } catch (error) {
      console.error('Error fetching RFIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rfis];

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(rfi => rfi.project_id === selectedProject);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rfi => rfi.status === statusFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(rfi => 
        new Date(rfi.created_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(rfi => 
        new Date(rfi.created_at) <= new Date(dateRange.end)
      );
    }

    setFilteredRfis(filtered);
    
    // Reset selection when filters change
    setSelectedRfis({});
  };

  const toggleRFISelection = (rfiId: string) => {
    setSelectedRfis(prev => ({
      ...prev,
      [rfiId]: !prev[rfiId]
    }));
  };

  const toggleAllRFIs = () => {
    const allSelected = filteredRfis.every(rfi => selectedRfis[rfi.id]);
    const newSelection: RFISelection = {};
    
    if (!allSelected) {
      filteredRfis.forEach(rfi => {
        newSelection[rfi.id] = true;
      });
    }
    
    setSelectedRfis(newSelection);
  };

  const getSelectedRFIsData = () => {
    return filteredRfis.filter(rfi => selectedRfis[rfi.id]);
  };

  const toggleFieldSelection = (fieldKey: string) => {
    setExportOptions(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldKey)
        ? prev.selectedFields.filter(f => f !== fieldKey)
        : [...prev.selectedFields, fieldKey]
    }));
  };

  const toggleCategoryFields = (category: string) => {
    const categoryFields = AVAILABLE_EXPORT_FIELDS
      .filter(f => f.category === category)
      .map(f => f.key);
    
    const allSelected = categoryFields.every(field => 
      exportOptions.selectedFields.includes(field)
    );
    
    setExportOptions(prev => ({
      ...prev,
      selectedFields: allSelected
        ? prev.selectedFields.filter(f => !categoryFields.includes(f))
        : [...new Set([...prev.selectedFields, ...categoryFields])]
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const categoriesArray = Array.from(prev);
      if (prev.has(category)) {
        return new Set(categoriesArray.filter(c => c !== category));
      } else {
        return new Set([...categoriesArray, category]);
      }
    });
  };

  const generatePDFForRFI = async (rfi: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      setCurrentPDFRfi(rfi);
      
      // Wait for render, then capture
      setTimeout(async () => {
        try {
          if (pdfElementRef.current) {
            const blob = await exportService.exportRFIToPDF(rfi, pdfElementRef.current);
            resolve(blob);
          } else {
            reject(new Error('PDF element not found'));
          }
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  };

  const handleExport = async () => {
    const selectedData = getSelectedRFIsData();
    if (selectedData.length === 0) {
      alert('Please select at least one RFI to export');
      return;
    }

    try {
      setGeneratingPDFs(true);
      
      const projectName = selectedProject !== 'all' 
        ? projects.find(p => p.id === selectedProject)?.project_name 
        : undefined;

      const options: ExportOptions = {
        ...exportOptions,
        projectName
      };

      await exportService.exportSelectedRFIs(selectedData, options, generatePDFForRFI);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setGeneratingPDFs(false);
      setCurrentPDFRfi(null);
    }
  };

  const quickExport = async (format: 'excel' | 'csv' | 'pdf') => {
    const selectedData = getSelectedRFIsData();
    if (selectedData.length === 0) {
      alert('Please select at least one RFI to export');
      return;
    }

    try {
      setGeneratingPDFs(format === 'pdf');
      
      const options: ExportOptions = {
        selectedFields: DEFAULT_EXPORT_FIELDS.map(f => f.key),
        includeAttachments: true,
        exportFormat: format,
        projectName: selectedProject !== 'all' 
          ? projects.find(p => p.id === selectedProject)?.project_name 
          : undefined
      };

      await exportService.exportSelectedRFIs(selectedData, options, generatePDFForRFI);
    } catch (error) {
      console.error('Quick export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setGeneratingPDFs(false);
      setCurrentPDFRfi(null);
    }
  };

  const groupedFields = AVAILABLE_EXPORT_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ExportField[]>);

  const categoryLabels = {
    basic: 'Basic Information',
    details: 'Details',
    dates: 'Dates',
    files: 'Files & Attachments',
    response: 'Response Information',
    financial: 'Financial Impact'
  };

  const selectedCount = Object.values(selectedRfis).filter(Boolean).length;
  const totalCount = filteredRfis.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Export RFIs</h2>
          <p className="text-gray-600">Export RFI data to Excel, PDF, or package with attachments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => quickExport('excel')}
            disabled={selectedCount === 0 || isLoading}
            variant="outline"
            className="bg-green-50 border-green-200 hover:bg-green-100"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Quick Excel Export
          </Button>
          <Button
            onClick={() => quickExport('csv')}
            disabled={selectedCount === 0 || isLoading}
            variant="outline"
            className="bg-blue-50 border-blue-200 hover:bg-blue-100"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" />
            Quick CSV Export
          </Button>
          <Button
            onClick={() => setShowExportModal(true)}
            disabled={selectedCount === 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            Export Options
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-blue-800">
              <strong>{selectedCount}</strong> of <strong>{totalCount}</strong> RFIs selected
            </div>
            {totalCount > 0 && (
              <Button
                onClick={toggleAllRFIs}
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                {selectedCount === totalCount ? (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Select All ({totalCount})
                  </>
                )}
              </Button>
            )}
          </div>
          
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => quickExport('pdf')}
                disabled={generatingPDFs}
                variant="outline"
                size="sm"
                className="bg-red-50 border-red-200 hover:bg-red-100"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                {generatingPDFs ? 'Generating PDFs...' : 'Quick PDF Package'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* RFI List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading RFIs...</div>
        ) : filteredRfis.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No RFIs found matching your filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={totalCount > 0 && selectedCount === totalCount}
                      onChange={toggleAllRFIs}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">RFI #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Attachments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRfis.map((rfi) => (
                  <tr 
                    key={rfi.id} 
                    className={`hover:bg-gray-50 ${selectedRfis[rfi.id] ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRfis[rfi.id] || false}
                        onChange={() => toggleRFISelection(rfi.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {rfi.rfi_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {rfi.subject}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        rfi.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        rfi.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rfi.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {rfi.project_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(rfi.created_at), 'MM/dd/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Archive className="w-4 h-4" />
                        <span>{rfi.attachment_files?.length || 0}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
                <p className="text-sm text-gray-600">
                  {exportService.getExportSummary(getSelectedRFIsData(), exportOptions)}
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Format */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Export Format</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet },
                      { value: 'csv', label: 'CSV Spreadsheet', icon: FileSpreadsheet },
                      { value: 'pdf', label: 'PDF Package with Attachments', icon: FileText },
                      { value: 'both', label: 'Both Excel and PDF', icon: Package }
                    ].map(option => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="exportFormat"
                          value={option.value}
                          checked={exportOptions.exportFormat === option.value}
                          onChange={(e) => setExportOptions(prev => ({ 
                            ...prev, 
                            exportFormat: e.target.value as any 
                          }))}
                          className="text-blue-600"
                        />
                        <option.icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeAttachments}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeAttachments: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Include attachments in PDF package</span>
                    </label>
                  </div>
                </div>

                {/* Field Selection */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Select Fields to Export</h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto border rounded-md p-3">
                    {Object.entries(groupedFields).map(([category, fields]) => (
                      <div key={category}>
                        <div 
                          className="flex items-center justify-between cursor-pointer py-1"
                          onClick={() => toggleCategory(category)}
                        >
                          <h5 className="font-medium text-sm text-gray-800">
                            {categoryLabels[category as keyof typeof categoryLabels]}
                          </h5>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategoryFields(category);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              {fields.every(f => exportOptions.selectedFields.includes(f.key)) 
                                ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-xs text-gray-500">
                              ({fields.filter(f => exportOptions.selectedFields.includes(f.key)).length}/{fields.length})
                            </span>
                          </div>
                        </div>
                        
                        {expandedCategories.has(category) && (
                          <div className="ml-4 space-y-1">
                            {fields.map(field => (
                              <label key={field.key} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={exportOptions.selectedFields.includes(field.key)}
                                  onChange={() => toggleFieldSelection(field.key)}
                                  className="rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Selected: {exportOptions.selectedFields.length} fields
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowExportModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={exportOptions.selectedFields.length === 0 || generatingPDFs}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {generatingPDFs ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Generation Element */}
      {currentPDFRfi && (
        <div className="fixed -top-[9999px] left-0 w-[210mm] bg-white">
          <div ref={pdfElementRef}>
            <RfiDetailView rfi={currentPDFRfi} />
          </div>
        </div>
      )}
    </div>
  );
} 
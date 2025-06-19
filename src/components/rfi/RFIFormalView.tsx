'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import type { RFI, RFIAttachment } from '@/lib/types';
import { PermissionButton } from '@/components/PermissionButton';
import { ClientResponseForm } from '@/components/client/ClientResponseForm';
import { TimesheetTracker } from '@/components/rfi/TimesheetTracker';

interface RFIFormalViewProps {
  rfi: RFI;
  includeAttachmentsInPDF?: boolean;
  isReadOnly?: boolean;
  isClientView?: boolean;
  clientToken?: string;
  clientName?: string;
  clientEmail?: string;
  onResponseSubmit?: (response: string, attachments: any[]) => void;
  projectData?: any; // For client views where projects hook doesn't work
}

interface AttachmentPreviewModalProps {
  attachment: RFIAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

function AttachmentPreviewModal({ attachment, isOpen, onClose }: AttachmentPreviewModalProps) {
  if (!isOpen || !attachment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-4xl max-h-full overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{attachment.file_name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {attachment.file_type?.includes('image') && attachment.public_url ? (
            <img
              src={attachment.public_url}
              alt={attachment.file_name}
              className="max-w-full h-auto"
            />
          ) : (
            <p>Preview not available for this file type.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function RFIFormalView({ rfi: initialRfi, includeAttachmentsInPDF = false, isReadOnly = false, isClientView = false, clientToken, clientName, clientEmail, onResponseSubmit, projectData }: RFIFormalViewProps) {
  const { projects } = useProjects();
  const { submitResponse } = useRFIs();
  const [rfi, setRfi] = useState<RFI>(initialRfi);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseText, setResponseText] = useState(rfi.response || '');
  const [submittedBy, setSubmittedBy] = useState('');
  const [cmApproval, setCmApproval] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<RFIAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Use projectData prop for client views, otherwise use projects hook
  const project = isClientView && projectData ? projectData : projects.find(p => p.id === rfi.project_id);

  const openPreview = (attachment: RFIAttachment) => {
    setPreviewAttachment(attachment);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewAttachment(null);
  };

  const handlePrintRFI = () => {
    window.print();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await submitResponse(rfi.id, responseText);
      setRfi(prev => ({ ...prev, response: responseText, stage: 'response_received' }));
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResponseSubmitted = rfi.response && rfi.stage === 'response_received';

  return (
    <>
      <AttachmentPreviewModal 
        attachment={previewAttachment} 
        isOpen={isPreviewOpen} 
        onClose={closePreview} 
      />

      <style jsx>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .rfi-print-container { max-width: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50 py-8 print:py-0">
        <div className="max-w-4xl mx-auto px-4 print:px-0 print:max-w-none rfi-print-container">
          
          {/* Print Button - Only visible on screen */}
          {!isReadOnly && (
            <div className="mb-4 print:hidden">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => window.history.back()}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                <button
                  onClick={handlePrintRFI}
                  className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Container - Document Style */}
          <div className="bg-white border border-gray-300 print:border-none">
            
            {/* Header Section with Logos */}
            <div className="px-8 py-6 space-y-4 relative">
              {/* Logo Container - Ensures perfect alignment */}
              <div className="absolute top-6 left-0 right-0 flex justify-between items-start px-8">
                {/* Contractor Logo - Left */}
                <div className="w-20 h-20 flex-shrink-0">
                  {project?.companies?.logo_url || project?.company?.logo_url ? (
                    <img 
                      src={project.companies?.logo_url || project.company?.logo_url} 
                      alt="Contractor Logo"
                      className="w-full h-full object-contain border border-gray-300 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center ${project?.companies?.logo_url || project?.company?.logo_url ? 'hidden' : ''}`}>
                    <span className="text-xs text-gray-500 text-center">Contractor<br/>Logo</span>
                  </div>
                </div>
                
                {/* Client Logo - Right */}
                <div className="w-20 h-20 flex-shrink-0">
                  {project?.client_logo_url ? (
                    <img 
                      src={project.client_logo_url} 
                      alt="Client Logo"
                      className="w-full h-full object-contain border border-gray-300 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center ${project?.client_logo_url ? 'hidden' : ''}`}>
                    <span className="text-xs text-gray-500 text-center">Client<br/>Logo</span>
                  </div>
                </div>
              </div>
              
              {/* Main Title - Centered (original position) */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">REQUEST FOR INFORMATION</h1>
              </div>
              
              {/* Project Name - Centered */}
              <div className="text-center">
                <h2 className="text-lg text-gray-900 font-medium">{project?.project_name || 'Unknown Project'}</h2>
              </div>
              
              {/* Date and RFI Number Row */}
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <span className="text-sm text-gray-600">Date: </span>
                  <span className="text-sm text-gray-900 font-medium">{format(new Date(rfi.created_at), 'MM/dd/yyyy')}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600">RFI#: </span>
                  <span className="text-sm text-gray-900 font-medium">{rfi.rfi_number}</span>
                </div>
              </div>
            </div>

            {/* Metadata Block - Two-Column Grid */}
            <div className="border-t border-gray-300 px-8 py-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Job:</span>
                    <span className="text-gray-900 text-sm font-medium">{project?.contractor_job_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Reason for RFI:</span>
                    <span className="text-gray-900 text-sm font-medium">{rfi.reason_for_rfi || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Company:</span>
                    <span className="text-gray-900 text-sm font-medium">{project?.client_company_name || 'Client Company'}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Contract#:</span>
                    <span className="text-gray-900 text-sm font-medium">{project?.job_contract_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">To:</span>
                    <span className="text-gray-900 text-sm font-medium">{project?.project_manager_contact || 'Project Manager'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Discipline:</span>
                    <span className="text-gray-900 text-sm font-medium">{rfi.discipline || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Line */}
            <div className="border-t border-gray-300 px-8 py-4">
              <div className="flex items-start">
                <span className="text-gray-600 text-sm w-20">Subject:</span>
                <span className="text-gray-900 text-sm font-medium flex-1">{rfi.subject}</span>
              </div>
            </div>

            {/* Impact Analysis Section - Show work, cost, and schedule impact from initial RFI */}
            {(rfi.work_impact || rfi.cost_impact || rfi.schedule_impact) && (
              <div className="border-t border-gray-300 px-8 py-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Impact Analysis</h3>
                
                <div className="space-y-4">
                  {/* Work Impact */}
                  {rfi.work_impact && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Work Impact:</h4>
                      <div className="border border-gray-200 p-3 bg-gray-50 rounded">
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{rfi.work_impact}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Cost Impact */}
                  {rfi.cost_impact && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Cost Impact:</h4>
                      <div className="border border-gray-200 p-3 bg-gray-50 rounded">
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">
                          {typeof rfi.cost_impact === 'number' 
                            ? `$${rfi.cost_impact.toLocaleString()}` 
                            : rfi.cost_impact}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Schedule Impact */}
                  {rfi.schedule_impact && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Schedule Impact:</h4>
                      <div className="border border-gray-200 p-3 bg-gray-50 rounded">
                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{rfi.schedule_impact}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost Impact Section - Only show if there are costs */}
            {(((rfi.cost_items && rfi.cost_items.length > 0) || 
               (rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0)) && (
              <div className="border-t border-gray-300 px-8 py-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Cost Impact Breakdown</h3>
                
                {rfi.cost_items && rfi.cost_items.length > 0 ? (
                  <div className="border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {rfi.cost_items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{item.cost_type}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">{item.quantity.toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{item.unit}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">${item.unit_cost.toLocaleString()}</td>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">${(item.quantity * item.unit_cost).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 bg-gray-50">
                          <td colSpan={5} className="px-3 py-2 text-right font-semibold text-gray-900">Total Cost:</td>
                          <td className="px-3 py-2 text-right font-bold text-lg text-gray-900">
                            ${rfi.cost_items.reduce((total, item) => total + (item.quantity * item.unit_cost), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="border border-gray-200 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      {(rfi.manhours || 0) > 0 && (
                        <div>
                          <div className="font-medium text-gray-900">{rfi.manhours}</div>
                          <div className="text-xs text-gray-600">Manhours</div>
                        </div>
                      )}
                      {(rfi.labor_costs || 0) > 0 && (
                        <div>
                          <div className="font-medium text-gray-900">${(rfi.labor_costs || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Labor</div>
                        </div>
                      )}
                      {(rfi.material_costs || 0) > 0 && (
                        <div>
                          <div className="font-medium text-gray-900">${(rfi.material_costs || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Materials</div>
                        </div>
                      )}
                      {(rfi.equipment_costs || 0) > 0 && (
                        <div>
                          <div className="font-medium text-gray-900">${(rfi.equipment_costs || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Equipment</div>
                        </div>
                      )}
                      {(rfi.subcontractor_costs || 0) > 0 && (
                        <div>
                          <div className="font-medium text-gray-900">${(rfi.subcontractor_costs || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Subcontractor</div>
                        </div>
                      )}
                      <div className="bg-gray-100 border border-gray-300 px-2 py-1">
                        <div className="font-semibold text-gray-900">
                          ${((rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0)).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timesheet Cost Tracking Section - Hidden in formal view, available in detail view */}
            {false && !isClientView && rfi.status !== 'draft' && (
              <div className="border-t border-gray-300 px-8 py-6 print:hidden">
                <TimesheetTracker rfiId={rfi.id} isReadOnly={isReadOnly || rfi.status === 'closed'} />
              </div>
            )}

            {/* Contractor Submission Section */}
            <div className="border-t border-gray-300 px-8 py-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Contractor Submission</h2>
              
              {/* Contractor Question */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Contractor Question:</h3>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {rfi.description || 'No question provided.'}
                  </p>
                </div>
              </div>

              {/* Contractor Proposed Solution */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Proposed Solution:</h3>
                <div className="border border-gray-300 p-4 bg-gray-50">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {rfi.proposed_solution || 'No proposed solution provided.'}
                  </p>
                </div>
              </div>

              {/* Associated Reference Documents */}
              {rfi.attachment_files && rfi.attachment_files.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Associated Reference Documents:</h3>
                  <div className="border border-gray-300">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {rfi.attachment_files.map((attachment, index) => (
                          <tr key={attachment.id || index}>
                            <td className="px-4 py-2 text-gray-900">
                              <div className="flex items-center space-x-2">
                                {attachment.file_type?.includes('pdf') ? (
                                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                ) : attachment.file_type?.includes('image') ? (
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className="text-sm">{attachment.file_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-700 text-sm uppercase">
                              {attachment.file_type?.replace('application/', '').replace('image/', '') || 'Unknown'}
                            </td>
                            <td className="px-4 py-2 text-gray-700 text-sm">
                              {attachment.file_size ? formatFileSize(attachment.file_size) : 'Unknown'}
                            </td>
                            <td className="px-4 py-2 text-sm print:hidden">
                              <div className="flex space-x-2">
                                {attachment.public_url && (
                                  <>
                                    <a
                                      href={attachment.public_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      View
                                    </a>
                                    <a
                                      href={attachment.public_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      Download
                                    </a>
                                  </>
                                )}
                                {attachment.file_type?.includes('image') && (
                                  <button
                                    onClick={() => openPreview(attachment)}
                                    className="text-purple-600 hover:text-purple-800"
                                  >
                                    Preview
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>



            {/* Client's Response Section - Only show if not read-only or if response exists */}
            {(!isReadOnly || rfi.response) && (
              <div className="border-t border-gray-300 px-8 py-6 print:hidden">
                {/* Use ClientResponseForm for client view, otherwise use the traditional response form */}
                {isClientView && clientToken ? (
                  <ClientResponseForm
                    rfi={rfi}
                    clientToken={clientToken}
                    clientName={clientName}
                    clientEmail={clientEmail}
                    onResponseSubmit={(response, attachments) => {
                      setRfi(prev => ({ ...prev, response: response, stage: 'response_received' }));
                      onResponseSubmit?.(response, attachments);
                    }}
                  />
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Client's Response</h2>
                    
                    {/* Response Textarea */}
                    <div className="mb-4">
                      <label htmlFor="response" className="block text-sm font-semibold text-gray-700 mb-2">
                        Response:
                      </label>
                      {isResponseSubmitted ? (
                        <div className="border border-gray-300 p-4 bg-gray-50">
                          <p className="text-gray-900 whitespace-pre-wrap">{responseText}</p>
                        </div>
                      ) : (
                        <textarea
                          id="response"
                          rows={6}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your response to this RFI..."
                          disabled={isReadOnly}
                        />
                      )}
                    </div>

                    {/* Input Fields Row */}
                    {!isResponseSubmitted && !isReadOnly && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="submittedBy" className="block text-sm font-semibold text-gray-700 mb-2">
                            Submitted By:
                          </label>
                          <input
                            type="text"
                            id="submittedBy"
                            value={submittedBy}
                            onChange={(e) => setSubmittedBy(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label htmlFor="cmApproval" className="block text-sm font-semibold text-gray-700 mb-2">
                            CM Approval:
                          </label>
                          <input
                            type="text"
                            id="cmApproval"
                            value={cmApproval}
                            onChange={(e) => setCmApproval(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="CM approval status"
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Response Button */}
                    {!isResponseSubmitted && !isReadOnly && (
                      <div className="flex justify-end">
                        <PermissionButton
                          permission="respond_to_rfi"
                          onClick={handleSubmitResponse}
                          disabled={!responseText.trim() || isSubmitting}
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                          title="Submit response to this RFI"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            'Submit Response'
                          )}
                        </PermissionButton>
                      </div>
                    )}

                    {/* Show existing response if available */}
                    {isResponseSubmitted && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Response Submitted</h4>
                        <p className="text-green-700 text-sm">
                          This RFI was responded to on {rfi.response_date ? format(new Date(rfi.response_date), 'PPP') : 'unknown date'}.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 
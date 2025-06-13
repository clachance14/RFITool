'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import type { RFI, RFIAttachment } from '@/lib/types';
import { PermissionButton } from '@/components/PermissionButton';
import { ClientResponseForm } from '@/components/client/ClientResponseForm';

interface RFIFormalViewProps {
  rfi: RFI;
  includeAttachmentsInPDF?: boolean;
  isReadOnly?: boolean;
  isClientView?: boolean;
  clientToken?: string;
  clientName?: string;
  clientEmail?: string;
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
      <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-y-auto">
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

export function RFIFormalView({ rfi: initialRfi, includeAttachmentsInPDF = false, isReadOnly = false, isClientView = false, clientToken, clientName, clientEmail }: RFIFormalViewProps) {
  const { projects } = useProjects();
  const { submitResponse } = useRFIs();
  const [rfi, setRfi] = useState<RFI>(initialRfi);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseText, setResponseText] = useState(rfi.response || '');
  const [submittedBy, setSubmittedBy] = useState('');
  const [cmApproval, setCmApproval] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<RFIAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const project = projects.find(p => p.id === rfi.project_id);

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
      
      <div className="min-h-screen bg-gray-100 py-8 print:py-0">
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Container - Printable Page */}
          <div className="bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden print:shadow-none print:border-none">
            
            {/* Header Section */}
            <div className="bg-white border-b-2 border-gray-300">
              {/* Main Header: Logo, Project/Subject (centered), RFI Number */}
              <div className="relative px-8 py-4 bg-gray-50 border-b border-gray-200">
                {/* Logo - Top Left */}
                <div className="absolute left-8 top-4">
                  {(() => {
                    const contractorLogo = localStorage.getItem('contractor_logo');
                    return contractorLogo ? (
                      <img
                        src={contractorLogo}
                        alt="Contractor Logo"
                        className="h-12 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500 text-center font-medium">NO<br/>LOGO</span>
                      </div>
                    );
                  })()}
                </div>

                {/* RFI Title, Project, Contract, and Subject - Centered */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">Request for Information</h1>
                  <div className="text-lg text-gray-700 mt-1">{project?.project_name || 'Unknown Project'}</div>
                  <div className="text-lg text-gray-700 mt-1">{project?.job_contract_number || 'N/A'}</div>
                  <h2 className="text-lg text-gray-700 mt-1">{rfi.subject}</h2>
                </div>

                {/* RFI Number and Client Logo - Top Right */}
                <div className="absolute right-8 top-4 text-right flex items-start space-x-4">
                  {(() => {
                    const clientLogo = localStorage.getItem('client_logo');
                    return clientLogo ? (
                      <img
                        src={clientLogo}
                        alt="Client Logo"
                        className="h-12 object-contain"
                      />
                    ) : null;
                  })()}
                  <div>
                    <div className="text-lg font-bold text-gray-900">{rfi.rfi_number}</div>
                    <div className="text-sm text-gray-700 mt-1">{format(new Date(rfi.created_at), 'MM/dd/yyyy')}</div>
                  </div>
                </div>
              </div>

              {/* Project Details - Compact Grid */}
              <div className="px-8 py-4">
                <div className="grid grid-cols-5 gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Job:</span>
                    <div className="font-semibold text-gray-900">{project?.job_contract_number || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Contract#:</span>
                    <div className="font-semibold text-gray-900">{project?.job_contract_number || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Date:</span>
                    <div className="font-semibold text-gray-900">{format(new Date(rfi.created_at), 'MM/dd/yyyy')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">To:</span>
                    <div className="font-semibold text-gray-900">{rfi.assigned_to || 'Project Manager'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Company:</span>
                    <div className="font-semibold text-gray-900">{project?.client_company_name || 'Client Company'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact & Classification Section */}
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                Impact & Classification
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="font-semibold text-gray-700">Work Impact:</label>
                  <p className="text-gray-900">Medium</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Discipline:</label>
                  <p className="text-gray-900">Structural</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Cost Impact:</label>
                  <p className={`font-medium ${
                    (rfi.cost_items && rfi.cost_items.length > 0) ? 
                      (rfi.cost_items.reduce((total, item) => total + (item.quantity * item.unit_cost), 0) > 0 ? 'text-red-600' : 'text-green-600') :
                      ((rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0 ? 'text-red-600' : 'text-green-600')
                  }`}>
                    {(rfi.cost_items && rfi.cost_items.length > 0) ? 
                      (rfi.cost_items.reduce((total, item) => total + (item.quantity * item.unit_cost), 0) > 0 ? 
                        `$${rfi.cost_items.reduce((total, item) => total + (item.quantity * item.unit_cost), 0).toLocaleString()}` : 
                        'No Cost Impact'
                      ) :
                      ((rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0 ? 
                        `$${((rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0)).toLocaleString()}` : 
                        'No Cost Impact'
                      )
                    }
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">System:</label>
                  <p className="text-gray-900">Building Frame</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Schedule Impact:</label>
                  <p className="text-gray-900">None</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700">Priority:</label>
                  <p className="text-gray-900 capitalize">{rfi.priority}</p>
                </div>
              </div>
            </div>

            {/* Cost Breakdown Section - Only show if there are costs */}
            {(((rfi.cost_items && rfi.cost_items.length > 0) || 
               (rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0)) && (
              <div className="px-8 py-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Cost Impact Breakdown</h3>
                
                {rfi.cost_items && rfi.cost_items.length > 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-xs text-gray-600 uppercase tracking-wider">
                            <th className="px-3 py-2 text-left">Description</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-right">Quantity</th>
                            <th className="px-3 py-2 text-left">Unit</th>
                            <th className="px-3 py-2 text-right">Unit Cost</th>
                            <th className="px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rfi.cost_items.map((item, index) => (
                            <tr key={index} className="border-t border-gray-200">
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
                          <tr className="border-t-2 border-gray-300">
                            <td colSpan={5} className="px-3 py-2 text-right font-semibold text-gray-900">Total Cost:</td>
                            <td className="px-3 py-2 text-right font-bold text-lg text-gray-900">
                              ${rfi.cost_items.reduce((total, item) => total + (item.quantity * item.unit_cost), 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
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
                      <div className="bg-white border border-gray-300 rounded px-2 py-1">
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

            {/* RFI Content Section */}
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                RFI Content
              </h2>
              
              {/* Contractor Question */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Contractor Question:</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {rfi.description || 'No question provided.'}
                  </p>
                </div>
              </div>

              {/* Contractor Proposed Solution */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Contractor Proposed Solution:</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {rfi.proposed_solution || 'No proposed solution provided.'}
                  </p>
                </div>
              </div>

              {/* Associated Reference Documents */}
              {rfi.attachment_files && rfi.attachment_files.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Associated Reference Documents:</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-xs text-gray-600 uppercase tracking-wider">
                          <th className="px-4 py-2 text-left">Document Name</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Size</th>
                          <th className="px-4 py-2 text-left print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rfi.attachment_files.map((attachment, index) => (
                          <tr key={attachment.id || index} className="border-b">
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
                              {attachment.file_type?.includes('image') ? (
                                <button
                                  onClick={() => openPreview(attachment)}
                                  className="text-blue-600 hover:text-blue-800 mr-2"
                                >
                                  Preview
                                </button>
                              ) : null}
                              {attachment.public_url && (
                                <a
                                  href={attachment.public_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Download
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments for PDF - Only when printing */}
            {includeAttachmentsInPDF && rfi.attachment_files && rfi.attachment_files.length > 0 && (
              <div className="px-8 py-6 border-b border-gray-300">
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                  Attachments
                </h2>
                
                <div className="space-y-6">
                  {rfi.attachment_files.map((attachment, index) => (
                    <div key={attachment.id || index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        {attachment.file_type?.includes('pdf') ? (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        ) : attachment.file_type?.includes('image') ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <h3 className="font-semibold text-gray-900">{attachment.file_name}</h3>
                        <span className="text-sm text-gray-500">
                          ({attachment.file_size ? formatFileSize(attachment.file_size) : 'Unknown size'})
                        </span>
                      </div>

                      {attachment.file_type?.includes('image') && attachment.public_url ? (
                        <div className="mt-3">
                          <img
                            src={attachment.public_url}
                            alt={attachment.file_name}
                            className="max-w-full h-auto rounded border border-gray-300"
                            style={{ maxHeight: '500px' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : attachment.file_type?.includes('pdf') && attachment.public_url ? (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-sm text-gray-700">
                            📄 PDF document attached. File can be accessed separately.
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            URL: {attachment.public_url}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                          <p className="text-sm text-gray-700">
                            📎 File attached. Download required to view contents.
                          </p>
                          {attachment.public_url && (
                            <p className="text-xs text-gray-500 mt-1">
                              URL: {attachment.public_url}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Response Section - Only show if not read-only or if response exists */}
            {(!isReadOnly || rfi.response) && (
              <div className="px-8 py-6 print:hidden">
                {/* Use ClientResponseForm for client view, otherwise use the traditional response form */}
                {isClientView && clientToken ? (
                  <ClientResponseForm
                    rfi={rfi}
                    clientToken={clientToken}
                    clientName={clientName}
                    clientEmail={clientEmail}
                    onResponseSubmit={(response, attachments) => {
                      setRfi(prev => ({ ...prev, response: response, stage: 'response_received' }));
                    }}
                  />
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      Client's Response
                    </h2>
                    
                    {/* Response Textarea */}
                    <div className="mb-4">
                      <label htmlFor="response" className="block text-sm font-semibold text-gray-700 mb-2">
                        Response:
                      </label>
                      <textarea
                        id="response"
                        rows={6}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your response to this RFI..."
                        disabled={isResponseSubmitted || isReadOnly}
                      />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="bg-blue-600 hover:bg-blue-700 text-white"
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
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
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
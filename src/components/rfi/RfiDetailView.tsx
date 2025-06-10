'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/contexts/RFIContext';
import type { RFI, RFIAttachment } from '@/lib/types';

interface RfiDetailViewProps {
  rfi: RFI;
}

interface AttachmentPreviewModalProps {
  attachment: RFIAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

function AttachmentPreviewModal({ attachment, isOpen, onClose }: AttachmentPreviewModalProps) {
  if (!isOpen || !attachment || !attachment.public_url) return null;

  const isImage = (fileType: string) => {
    return fileType?.startsWith('image/') || fileType?.includes('image');
  };

  const isPDF = (fileType: string) => {
    return fileType === 'application/pdf' || fileType?.includes('pdf');
  };

  const handleDownload = () => {
    if (attachment.public_url) {
      const a = document.createElement('a');
      a.href = attachment.public_url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl max-h-[95vh] w-full h-full sm:h-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{attachment.file_name}</h3>
            <span className="text-sm text-gray-500">
              ({attachment.file_size_bytes ? (attachment.file_size_bytes / 1024 / 1024).toFixed(2) : '0'} MB)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-2">
          {isImage(attachment.file_type || '') ? (
            <div className="flex justify-center h-full">
              <img
                src={attachment.public_url}
                alt={attachment.file_name}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          ) : isPDF(attachment.file_type || '') ? (
            <div className="w-full h-full">
              <iframe
                src={attachment.public_url}
                className="w-full h-full border-0"
                title={attachment.file_name}
                style={{ minHeight: 'calc(95vh - 80px)' }}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h4>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed. You can download it to view the contents.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RfiDetailView({ rfi }: RfiDetailViewProps) {
  const { projects } = useProjects();
  const { submitResponse } = useRFIs();
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

  const handlePrintWithAttachments = () => {
    // First print the RFI
    window.print();
    
    // Then open each attachment in a new tab for printing
    setTimeout(() => {
      if (rfi.attachment_files && rfi.attachment_files.length > 0) {
        rfi.attachment_files.forEach((attachment, index) => {
          if (attachment.public_url) {
            setTimeout(() => {
              const printWindow = window.open(attachment.public_url, '_blank');
              if (printWindow) {
                printWindow.addEventListener('load', () => {
                  setTimeout(() => {
                    printWindow.print();
                  }, 500);
                });
              }
            }, index * 1000); // Stagger opening to avoid browser blocking
          }
        });
      }
    }, 1000);
  };

  // Helper function to format file size
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
      // You might want to add a success toast here
    } catch (error) {
      console.error('Failed to submit response:', error);
      // You might want to add an error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @page {
          margin: 0.25in !important;
          size: letter;
        }
        
        @media print {
          /* Reset everything for print */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
          }
          
          /* Hide everything except our print container */
          body * {
            visibility: hidden;
          }
          
          /* Show only the RFI print container and its contents */
          .rfi-print-container, 
          .rfi-print-container * {
            visibility: visible;
          }
          
          /* Position the print container to fill the available page space */
          .rfi-print-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            transform: scale(0.75) !important;
            transform-origin: top left !important;
            page-break-after: avoid !important;
          }
          
          /* Clean up the container styling */
          .rfi-print-container .bg-gray-100 { 
            background-color: white !important; 
            padding: 0 !important;
          }
          .rfi-print-container .shadow-lg { box-shadow: none !important; }
          .rfi-print-container .border { border: 1px solid #000 !important; }
          .rfi-print-container .rounded-lg { border-radius: 0 !important; }
          .rfi-print-container .bg-gray-50 { background-color: #f9f9f9 !important; }
          
          /* Hide interactive elements */
          .print\\:hidden { display: none !important; }
          
          /* Text contrast for print */
          .rfi-print-container .text-gray-600 { color: #374151 !important; }
          .rfi-print-container .text-gray-700 { color: #374151 !important; }
          .rfi-print-container .text-gray-900 { color: #000 !important; }
          
          /* Compact spacing for print */
          .rfi-print-container .px-8 { padding-left: 12px !important; padding-right: 12px !important; }
          .rfi-print-container .py-6 { padding-top: 8px !important; padding-bottom: 8px !important; }
          .rfi-print-container .py-4 { padding-top: 6px !important; padding-bottom: 6px !important; }
          .rfi-print-container .py-3 { padding-top: 4px !important; padding-bottom: 4px !important; }
          .rfi-print-container .py-2 { padding-top: 3px !important; padding-bottom: 3px !important; }
          .rfi-print-container .mb-4 { margin-bottom: 8px !important; }
          .rfi-print-container .mb-6 { margin-bottom: 10px !important; }
          .rfi-print-container .mt-1 { margin-top: 2px !important; }
          
          /* Compact fonts and spacing */
          .rfi-print-container h1 { 
            font-size: 18px !important; 
            line-height: 1.2 !important;
            margin: 0 !important;
          }
          .rfi-print-container h2 { 
            font-size: 14px !important; 
            line-height: 1.2 !important;
            margin-bottom: 6px !important;
            padding-bottom: 2px !important;
          }
          .rfi-print-container h3 { 
            font-size: 12px !important; 
            line-height: 1.2 !important;
            margin-bottom: 4px !important;
          }
          .rfi-print-container .text-lg { font-size: 13px !important; }
          .rfi-print-container .text-sm { font-size: 10px !important; }
          .rfi-print-container .text-xs { font-size: 9px !important; }
          
          /* Grid adjustments */
          .rfi-print-container .grid {
            gap: 8px !important;
          }
          .rfi-print-container .gap-4 { gap: 6px !important; }
          .rfi-print-container .gap-x-6 { column-gap: 8px !important; }
          
          /* Table optimizations */
          .rfi-print-container table {
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
          .rfi-print-container .px-4.py-2 { 
            padding: 3px 6px !important; 
          }
          .rfi-print-container .px-3.py-2 { 
            padding: 2px 4px !important; 
          }
          
          /* Attachment table specific */
          .attachment-table { 
            page-break-inside: avoid !important;
            margin-top: 8px !important;
          }
          
          /* Background areas more compact */
          .rfi-print-container .bg-gray-50.p-4 {
            padding: 6px !important;
          }
          
          /* Make the RFI content fill efficiently */
          .rfi-print-container .max-w-4xl { 
            max-width: none !important; 
            width: 100% !important;
          }
          .rfi-print-container .mx-auto { margin: 0 !important; }
          .rfi-print-container .px-4 { padding: 0 !important; }
          .rfi-print-container .py-8 { padding: 0 !important; }
          .rfi-print-container .min-h-screen { 
            min-height: auto !important; 
          }
          
          /* Main container optimized for single page */
          .rfi-print-container .bg-white.border {
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: 2px solid #000 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          
          /* Prevent page breaks */
          .rfi-print-container * {
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    
    <div className="min-h-screen bg-gray-100 py-8 print:py-0">
      <div className="max-w-4xl mx-auto px-4 print:px-0 print:max-w-none rfi-print-container">
        {/* Main Container - Printable Page */}
        <div className="bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden">
          
          {/* Header Section */}
          {/* RFI Header */}
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

              {/* Client Logo and RFI Info - Top Right */}
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
            <div className="px-8 py-3">
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
          {(rfi.cost_items && rfi.cost_items.length > 0) || ((rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0 || (rfi.manhours || 0) > 0) && (
            <div className="px-8 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Cost Impact Breakdown</h3>
              
              {rfi.cost_items && rfi.cost_items.length > 0 ? (
                /* New cost items table */
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
                      <tbody className="divide-y divide-gray-200">
                        {rfi.cost_items.map((item, index) => (
                          <tr key={index} className="text-sm">
                            <td className="px-3 py-2 text-gray-900">{item.description}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.cost_type === 'labor' ? 'bg-blue-100 text-blue-800' :
                                item.cost_type === 'material' ? 'bg-green-100 text-green-800' :
                                item.cost_type === 'equipment' ? 'bg-purple-100 text-purple-800' :
                                item.cost_type === 'subcontractor' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.cost_type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-900">{item.quantity.toLocaleString()}</td>
                            <td className="px-3 py-2 text-gray-600">{item.unit}</td>
                            <td className="px-3 py-2 text-right text-gray-900">${item.unit_cost.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">
                              ${(item.quantity * item.unit_cost).toLocaleString()}
                            </td>
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
                /* Legacy cost display */
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
                  {/* This would come from form data - using placeholder for now */}
                  No proposed solution provided.
                </p>
              </div>
            </div>

            {/* Associated Reference Documents */}
            <div className="attachment-table print:break-inside-avoid">
              <h3 className="font-semibold text-gray-700 mb-2">Associated Reference Documents:</h3>
              <div className="border rounded print:rounded-none">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Document Name</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Type</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Size</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Date Added</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfi.attachment_files && rfi.attachment_files.length > 0 ? (
                      rfi.attachment_files.map((attachment, index) => (
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
                              ) : attachment.file_type?.includes('word') || attachment.file_type?.includes('document') ? (
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>{attachment.file_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {attachment.file_type || 'Document'}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {attachment.file_size_bytes ? formatFileSize(attachment.file_size_bytes) : 'Unknown'}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {format(new Date(attachment.created_at || rfi.created_at), 'MM/dd/yyyy')}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center space-x-2">
                              {attachment.public_url ? (
                                <>
                                  <button
                                    onClick={() => openPreview(attachment)}
                                    className="inline-flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium hover:bg-green-50 px-2 py-1 rounded transition-colors print:hidden"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>View</span>
                                  </button>
                                  <a
                                    href={attachment.public_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors print:hidden"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Download</span>
                                  </a>
                                  <span className="hidden print:inline text-sm text-gray-700">Attachment</span>
                                </>
                              ) : (
                                <span className="text-gray-400 text-sm print:text-gray-700">No link</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-gray-500 text-center">No documents attached</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Client Response Section */}
          <div className="px-8 py-6 print:hidden">
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
                disabled={!!rfi.response && rfi.status === 'responded'}
              />
            </div>

            {/* Input Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  disabled={!!rfi.response && rfi.status === 'responded'}
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
                  disabled={!!rfi.response && rfi.status === 'responded'}
                />
              </div>
            </div>

            {/* Submit Response Button */}
            {(!rfi.response || rfi.status !== 'responded') && (
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                </button>
              </div>
            )}

            {/* Show existing response if available */}
            {rfi.response && rfi.status === 'responded' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-semibold text-green-800 mb-2">Response Submitted</h4>
                <p className="text-green-700 text-sm">
                  This RFI was responded to on {rfi.response_date ? format(new Date(rfi.response_date), 'PPP') : 'unknown date'}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4 print:hidden">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to RFIs
          </button>
          
          <button
            onClick={handlePrintRFI}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print RFI
          </button>
          
          {rfi.attachment_files && rfi.attachment_files.length > 0 && (
            <button
              onClick={handlePrintWithAttachments}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Package ({rfi.attachment_files.length} files)
            </button>
          )}
        </div>
      </div>

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal 
        attachment={previewAttachment}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </div>
    </>
  );
} 
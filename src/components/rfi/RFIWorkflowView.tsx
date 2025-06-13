'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import type { RFI, RFIAttachment } from '@/lib/types';
import { RFIWorkflowControls } from '@/components/rfi/RFIWorkflowControls';
import { RFIStatusDisplay, RFIProgress } from '@/components/rfi/RFIStatusBadge';
import { PermissionButton } from '@/components/PermissionButton';

interface RFIWorkflowViewProps {
  rfi: RFI;
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

export function RFIWorkflowView({ rfi: initialRfi }: RFIWorkflowViewProps) {
  const { projects } = useProjects();
  const { updateRFI } = useRFIs();
  const [rfi, setRfi] = useState<RFI>(initialRfi);
  const [previewAttachment, setPreviewAttachment] = useState<RFIAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRfi, setEditedRfi] = useState<RFI>(initialRfi);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [secureLinkData, setSecureLinkData] = useState<any>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const project = projects.find(p => p.id === rfi.project_id);

  const handleStatusChange = (newStatus: any, updatedRFI: RFI) => {
    setRfi(updatedRFI);
  };

  const openPreview = (attachment: RFIAttachment) => {
    setPreviewAttachment(attachment);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewAttachment(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSaveEdit = async () => {
    try {
      await updateRFI(editedRfi.id, editedRfi);
      setRfi(editedRfi);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update RFI:', error);
    }
  };

  const calculateTotalCost = (): number => {
    if (rfi.cost_items && rfi.cost_items.length > 0) {
      return rfi.cost_items.reduce((total, item) => total + (item.quantity * item.unit_cost), 0);
    }
    return (rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0);
  };

  const calculateActualTotalCost = (): number => {
    return (rfi.actual_labor_cost || 0) + (rfi.actual_material_cost || 0) + (rfi.actual_equipment_cost || 0);
  };

  // Generate secure link for client access
  const handleGenerateSecureLink = async () => {
    try {
      setGeneratingLink(true);
      const response = await fetch(`/api/rfis/${rfi.id}/generate-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expirationDays: 30,
          allowMultipleResponses: false
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        alert(result.error || 'Failed to generate secure link');
        return;
      }

      setSecureLinkData(result.data);
      setShowLinkModal(true);
    } catch (error) {
      alert('Failed to generate secure link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (secureLinkData?.secure_link) {
      navigator.clipboard.writeText(secureLinkData.secure_link).then(() => {
        alert('Link copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy link');
      });
    }
  };

  return (
    <>
      <AttachmentPreviewModal 
        attachment={previewAttachment} 
        isOpen={isPreviewOpen} 
        onClose={closePreview} 
      />

      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <button
                  onClick={() => window.history.back()}
                  className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 mb-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to RFI Log</span>
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{rfi.rfi_number}</h1>
                <h2 className="text-xl text-gray-700 mt-1">{rfi.subject}</h2>
                <p className="text-gray-600 mt-1">{project?.project_name || 'Unknown Project'}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <RFIStatusDisplay status={rfi.status} stage={rfi.stage} layout="vertical" showDescription />
                </div>
                <div className="flex space-x-2">
                  <PermissionButton
                    permission="edit_rfi"
                    onClick={() => setIsEditing(!isEditing)}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:border-gray-400"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit RFI'}
                  </PermissionButton>
                  <PermissionButton
                    permission="generate_client_link"
                    onClick={handleGenerateSecureLink}
                    disabled={generatingLink}
                    variant="default"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    title="Generate a secure link for client access"
                  >
                    {generatingLink ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Generate Client Link
                      </>
                    )}
                  </PermissionButton>
                  <PermissionButton
                    permission="generate_rfi_links"
                    onClick={() => window.open(`/rfis/${rfi.id}/formal`, '_blank')}
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Formal Document
                  </PermissionButton>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFI Number</label>
                    <p className="text-gray-900 font-mono">{rfi.rfi_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                    <p className="text-gray-900">{format(new Date(rfi.created_at), 'PPP')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <p className="text-gray-900 capitalize">{rfi.priority}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    <p className="text-gray-900">{rfi.assigned_to || 'Unassigned'}</p>
                  </div>
                </div>
              </div>

              {/* Workflow Progress */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Progress</h3>
                <RFIProgress status={rfi.status} stage={rfi.stage} />
              </div>

              {/* RFI Content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">RFI Content</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <p className="text-gray-900 p-3 bg-gray-50 rounded border">{rfi.subject}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <div className="text-gray-900 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                      {rfi.description || 'No description provided.'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Solution</label>
                    <div className="text-gray-900 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                      {rfi.proposed_solution || 'No proposed solution provided.'}
                    </div>
                  </div>

                  {rfi.response && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Response
                        {rfi.response_date && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({format(new Date(rfi.response_date), 'PPP')})
                          </span>
                        )}
                      </label>
                      <div className="text-gray-900 p-3 bg-green-50 border border-green-200 rounded whitespace-pre-wrap">
                        {rfi.response}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {rfi.attachment_files && rfi.attachment_files.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                  <div className="space-y-3">
                    {rfi.attachment_files.map((attachment, index) => (
                      <div key={attachment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex items-center space-x-3">
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {attachment.file_type?.replace('application/', '').replace('image/', '').toUpperCase() || 'Unknown'} • {attachment.file_size ? formatFileSize(attachment.file_size) : 'Unknown size'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {attachment.file_type?.includes('image') && (
                            <button
                              onClick={() => openPreview(attachment)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Preview
                            </button>
                          )}
                          {attachment.public_url && (
                            <a
                              href={attachment.public_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
                
                {/* Estimated vs Actual Costs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Estimated Costs</h4>
                    <div className="space-y-2 text-sm">
                      {rfi.cost_items && rfi.cost_items.length > 0 ? (
                        <div>
                          <p className="text-blue-700">Based on detailed cost items</p>
                          <p className="text-2xl font-bold text-blue-900">${calculateTotalCost().toLocaleString()}</p>
                        </div>
                      ) : (
                        <>
                          {(rfi.labor_costs || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Labor:</span>
                              <span className="font-medium text-blue-900">${(rfi.labor_costs || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {(rfi.material_costs || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Material:</span>
                              <span className="font-medium text-blue-900">${(rfi.material_costs || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {(rfi.equipment_costs || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Equipment:</span>
                              <span className="font-medium text-blue-900">${(rfi.equipment_costs || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {(rfi.subcontractor_costs || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-700">Subcontractor:</span>
                              <span className="font-medium text-blue-900">${(rfi.subcontractor_costs || 0).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="border-t border-blue-300 pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-blue-900">Total:</span>
                              <span className="text-blue-900">${calculateTotalCost().toLocaleString()}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">Actual Costs</h4>
                    <div className="space-y-2 text-sm">
                      {(rfi.actual_labor_cost || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Labor:</span>
                          <span className="font-medium text-green-900">${(rfi.actual_labor_cost || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {(rfi.actual_material_cost || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Material:</span>
                          <span className="font-medium text-green-900">${(rfi.actual_material_cost || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {(rfi.actual_equipment_cost || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Equipment:</span>
                          <span className="font-medium text-green-900">${(rfi.actual_equipment_cost || 0).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-green-300 pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-green-900">Total:</span>
                          <span className="text-green-900">${calculateActualTotalCost().toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {calculateActualTotalCost() === 0 && (
                        <p className="text-green-600 text-center italic">No actual costs recorded yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cost Variance */}
                {calculateTotalCost() > 0 && calculateActualTotalCost() > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">Cost Variance</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-700">
                        {calculateActualTotalCost() > calculateTotalCost() ? 'Over Budget:' : 'Under Budget:'}
                      </span>
                      <span className={`font-bold text-lg ${
                        calculateActualTotalCost() > calculateTotalCost() ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${Math.abs(calculateActualTotalCost() - calculateTotalCost()).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-yellow-600 mt-1">
                      {((calculateActualTotalCost() - calculateTotalCost()) / calculateTotalCost() * 100).toFixed(1)}% variance
                    </div>
                  </div>
                )}
              </div>

              {/* Field Work Tracking */}
              {(rfi.stage === 'field_work_in_progress' || rfi.work_started_date || rfi.work_completed_date) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Work Tracking</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Started</label>
                      <p className="text-gray-900">
                        {rfi.work_started_date ? format(new Date(rfi.work_started_date), 'PPP') : 'Not started'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Completed</label>
                      <p className="text-gray-900">
                        {rfi.work_completed_date ? format(new Date(rfi.work_completed_date), 'PPP') : 'Not completed'}
                      </p>
                    </div>
                    {rfi.actual_labor_hours && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Labor Hours</label>
                        <p className="text-gray-900">{rfi.actual_labor_hours} hours</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Workflow Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Controls</h3>
                <RFIWorkflowControls rfi={rfi} onStatusChange={handleStatusChange} />
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days since created:</span>
                    <span className="font-medium">
                      {Math.floor((new Date().getTime() - new Date(rfi.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                  {rfi.response_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response time:</span>
                      <span className="font-medium">
                        {Math.floor((new Date(rfi.response_date).getTime() - new Date(rfi.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attachments:</span>
                    <span className="font-medium">{rfi.attachment_files?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated cost:</span>
                    <span className="font-medium">${calculateTotalCost().toLocaleString()}</span>
                  </div>
                  {calculateActualTotalCost() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual cost:</span>
                      <span className="font-medium">${calculateActualTotalCost().toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Project:</span>
                    <p className="font-medium">{project?.project_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Job Number:</span>
                    <p className="font-medium">{project?.job_contract_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Client:</span>
                    <p className="font-medium">{project?.client_company_name || 'Unknown'}</p>
                  </div>
                  {project?.location && (
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium">{project.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secure Link Modal */}
      {showLinkModal && secureLinkData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Secure Client Link Generated</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Share this secure link with your client to allow them to view and respond to this RFI. 
                  The link will expire on {new Date(secureLinkData.expires_at).toLocaleDateString()}.
                </p>
                
                <div className="bg-gray-50 p-3 rounded-md border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Secure Link</label>
                      <input
                        type="text"
                        value={secureLinkData.secure_link}
                        readOnly
                        className="w-full px-2 py-1 text-sm bg-white border border-gray-300 rounded"
                      />
                    </div>
                    <button
                      onClick={copyLinkToClipboard}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002 2h-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">
                    <h4 className="font-medium text-yellow-800">Important Security Notes</h4>
                    <ul className="mt-1 text-yellow-700 list-disc list-inside space-y-1">
                      <li>This link is unique and secure - do not share publicly</li>
                      <li>The link expires automatically after 30 days</li>
                      <li>Only send this link to authorized client personnel</li>
                      <li>The client can respond once using this link</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    copyLinkToClipboard();
                    setShowLinkModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Copy & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
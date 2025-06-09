'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/contexts/RFIContext';
import type { RFI } from '@/lib/types';

interface RfiDetailViewProps {
  rfi: RFI;
}

export function RfiDetailView({ rfi }: RfiDetailViewProps) {
  const { projects } = useProjects();
  const { submitResponse } = useRFIs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseText, setResponseText] = useState(rfi.response || '');
  const [submittedBy, setSubmittedBy] = useState('');
  const [cmApproval, setCmApproval] = useState('');
  
  const project = projects.find(p => p.id === rfi.project_id);

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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
                  (rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {(rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0 
                    ? `$${((rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0)).toLocaleString()}` 
                    : 'No Cost Impact'
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
          {((rfi.labor_costs || 0) + (rfi.material_costs || 0) + (rfi.equipment_costs || 0) + (rfi.subcontractor_costs || 0) > 0 || (rfi.manhours || 0) > 0) && (
            <div className="px-8 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Cost Impact Breakdown</h3>
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
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Associated Reference Documents:</h3>
              <div className="border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Document Name</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Type</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 border-b">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfi.attachments && rfi.attachments.length > 0 ? (
                      rfi.attachments.map((attachment, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2 text-gray-900">{attachment}</td>
                          <td className="px-4 py-2 text-gray-600">Document</td>
                          <td className="px-4 py-2 text-gray-600">{format(new Date(rfi.created_at), 'MM/dd/yyyy')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-gray-500 text-center">No documents attached</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Client Response Section */}
          <div className="px-8 py-6">
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

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to RFIs
          </button>
        </div>
      </div>
    </div>
  );
} 
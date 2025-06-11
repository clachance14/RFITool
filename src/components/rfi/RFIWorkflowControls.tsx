"use client";

import React, { useState, useRef, useEffect } from 'react';
import { RFI, RFIStatus } from '@/lib/types';
import { 
  RFIWorkflowService, 
  RFI_WORKFLOW_STATES, 
  RFIWorkflowTransition 
} from '@/services/rfiWorkflow';
import { useUserRole } from '@/hooks/useUserRole';

interface RFIWorkflowControlsProps {
  rfi: RFI;
  onStatusChange?: (newStatus: RFIStatus, updatedRFI: RFI) => void;
}

interface WorkflowActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transition: RFIWorkflowTransition;
  rfi: RFI;
  onConfirm: (additionalData?: Record<string, any>) => void;
  isLoading: boolean;
}

function WorkflowActionModal({ 
  isOpen, 
  onClose, 
  transition, 
  rfi, 
  onConfirm, 
  isLoading 
}: WorkflowActionModalProps) {
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [response, setResponse] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const additionalData: Record<string, any> = {};
    
    if (transition.to === 'sent') {
      if (dueDate) additionalData.due_date = dueDate;
      if (assignedTo) additionalData.assigned_to = assignedTo;
    }
    
    if (transition.to === 'responded' && response) {
      additionalData.response = response;
    }
    
    onConfirm(additionalData);
  };

  const getModalContent = () => {
    switch (transition.to) {
      case 'active':
        return (
          <div>
            <p className="text-gray-600 mb-4">
              This will activate the RFI and make it ready to send to the client. 
              Please ensure all required information is complete.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h5 className="font-medium text-blue-800 mb-2">Required Fields Check:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${rfi.subject ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  Subject: {rfi.subject ? '✓' : 'Missing'}
                </li>
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${rfi.description ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  Description: {rfi.description ? '✓' : 'Missing'}
                </li>
              </ul>
            </div>
          </div>
        );
      
      case 'sent':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Send this RFI to the client. You can optionally set a due date and assign it to someone.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To (Optional)
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Enter assignee name or email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      
      case 'responded':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Mark this RFI as responded. You can optionally add the client's response.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Response (Optional)
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter the client's response..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      
      default:
        return (
          <p className="text-gray-600">
            {transition.description}
          </p>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {transition.label}
          </h3>
        </div>
        
        <div className="px-6 py-4">
          {getModalContent()}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${transition.color}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              transition.label
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RFIWorkflowControls({ rfi, onStatusChange }: RFIWorkflowControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<RFIWorkflowTransition | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { hasPermission } = useUserRole();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentWorkflowState = RFI_WORKFLOW_STATES[rfi.status];
  const availableTransitions = RFIWorkflowService.getAvailableTransitions(rfi.status);

  const handleTransitionClick = (transition: RFIWorkflowTransition) => {
    // Check if user has permission for this workflow action
    const permissionMap: Record<string, string> = {
      'sent': 'submit_rfi',
      'responded': 'respond_to_rfi', 
      'closed': 'close_rfi',
      'active': 'edit_rfi',
      'draft': 'edit_rfi'
    };
    
    const requiredPermission = permissionMap[transition.to] || 'edit_rfi';
    if (!hasPermission(requiredPermission)) {
      return; // Don't proceed if user doesn't have permission
    }

    setSelectedTransition(transition);
    setShowModal(true);
    setShowDropdown(false);
    setError(null);
  };

  const handleConfirmTransition = async (additionalData?: Record<string, any>) => {
    if (!selectedTransition) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rfis/${rfi.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedTransition.to,
          additionalData
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Convert the database result back to RFI format
        const updatedRFI: RFI = {
          ...rfi,
          status: result.data.status,
          updated_at: result.data.updated_at,
          due_date: result.data.due_date || rfi.due_date,
          assigned_to: result.data.assigned_to || rfi.assigned_to,
          response: result.data.client_response || rfi.response,
          response_date: result.data.date_responded || rfi.response_date
        };

        onStatusChange?.(selectedTransition.to, updatedRFI);
        setShowModal(false);
        setSelectedTransition(null);
      } else {
        setError(result.error || 'Failed to update RFI status');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setShowModal(false);
      setSelectedTransition(null);
      setError(null);
    }
  };

  const getStatusIcon = (iconName: string) => {
    const iconClasses = "w-5 h-5";
    
    switch (iconName) {
      case 'pencil':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
      case 'check-circle':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'paper-airplane':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
      case 'chat-bubble-left-right':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
      case 'archive-box':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
      case 'exclamation-triangle':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.664-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>;
      case 'arrow-left':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
      case 'arrow-path':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
      case 'x-circle':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'document-duplicate':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
      case 'arrow-uturn-left':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>;
      case 'hand-raised':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
      case 'arrow-right-circle':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'arrow-right':
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
      default:
        return <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">RFI Workflow</h3>
        
        {/* Current Status Badge */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentWorkflowState.bgColor} ${currentWorkflowState.color}`}>
          <span className="mr-2">
            {getStatusIcon(currentWorkflowState.icon)}
          </span>
          {currentWorkflowState.label}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {currentWorkflowState.description}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Available Actions Dropdown */}
      {availableTransitions.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Available Actions:</h4>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Choose Action
              </span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {availableTransitions.map((transition: RFIWorkflowTransition) => {
                  // Check permissions for each transition
                  const permissionMap: Record<string, string> = {
                    'sent': 'submit_rfi',
                    'responded': 'respond_to_rfi', 
                    'closed': 'close_rfi',
                    'active': 'edit_rfi',
                    'draft': 'edit_rfi'
                  };
                  
                  const requiredPermission = permissionMap[transition.to] || 'edit_rfi';
                  const hasActionPermission = hasPermission(requiredPermission);
                  
                  return (
                    <div key={`${transition.from}-${transition.to}`} className="relative group">
                      <button
                        onClick={() => hasActionPermission ? handleTransitionClick(transition) : undefined}
                        disabled={isLoading || !hasActionPermission}
                        className={`w-full flex items-center px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 focus:outline-none transition-colors ${
                          hasActionPermission 
                            ? 'text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer' 
                            : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                        } ${isLoading ? 'opacity-50' : ''}`}
                      >
                        <span className="flex items-center mr-3">
                          {getStatusIcon(transition.icon)}
                        </span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{transition.label}</div>
                          <div className="text-xs text-gray-500">{transition.description}</div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ml-2 ${hasActionPermission ? '' : 'opacity-50'}`} style={{
                          backgroundColor: transition.color.includes('blue') ? '#3B82F6' :
                                         transition.color.includes('green') ? '#10B981' :
                                         transition.color.includes('red') ? '#EF4444' :
                                         transition.color.includes('yellow') ? '#F59E0B' :
                                         transition.color.includes('purple') ? '#8B5CF6' :
                                         transition.color.includes('indigo') ? '#6366F1' :
                                         transition.color.includes('orange') ? '#F97316' :
                                         '#6B7280'
                        }}></div>
                      </button>
                      
                      {/* Tooltip for disabled actions */}
                      {!hasActionPermission && (
                        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                          Read-only access: Cannot modify RFI workflow
                          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No workflow actions available for this status.</p>
        </div>
      )}

      {/* Workflow Action Modal */}
      {selectedTransition && (
        <WorkflowActionModal
          isOpen={showModal}
          onClose={handleCloseModal}
          transition={selectedTransition}
          rfi={rfi}
          onConfirm={handleConfirmTransition}
          isLoading={isLoading}
        />
      )}
    </div>
  );
} 
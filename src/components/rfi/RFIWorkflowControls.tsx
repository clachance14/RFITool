"use client";

import React, { useState } from 'react';
import type { RFI, RFIStatus, RFIStage } from '@/lib/types';
import { useRFIs } from '@/hooks/useRFIs';
import { PermissionButton } from '@/components/PermissionButton';

interface RFIWorkflowControlsProps {
  rfi: RFI;
  onStatusChange?: (newStatus: RFIStatus, updatedRFI: RFI) => void;
}

export function RFIWorkflowControls({ rfi, onStatusChange }: RFIWorkflowControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateRFI } = useRFIs();

  const handleStatusChange = async (newStatus: RFIStatus, newStage?: RFIStage) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updateData: any = { status: newStatus };
      if (newStage) {
        updateData.stage = newStage;
      }
      
      // Set appropriate dates based on status/stage
      const now = new Date().toISOString();
      if (newStatus === 'active' && rfi.status === 'draft') {
        updateData.date_activated = now;
      } else if (newStage === 'sent_to_client') {
        updateData.date_sent = now;
      } else if (newStage === 'response_received') {
        updateData.date_responded = now;
      } else if (newStatus === 'closed') {
        updateData.date_closed = now;
      } else if (newStage === 'field_work_in_progress') {
        updateData.work_started_date = now;
      } else if (newStage === 'work_completed') {
        updateData.work_completed_date = now;
      }

      const updatedRFI = await updateRFI(rfi.id, updateData);
      onStatusChange?.(newStatus, updatedRFI);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableActions = () => {
    const actions: Array<{ label: string; status: RFIStatus; stage?: RFIStage; color: string; permission: string }> = [];

    switch (rfi.status) {
      case 'draft':
        actions.push({
          label: 'Activate RFI',
          status: 'active',
          stage: 'sent_to_client',
          color: 'bg-blue-600 hover:bg-blue-700',
          permission: 'edit_rfi'
        });
        break;
        
      case 'active':
        if (rfi.stage === 'sent_to_client' || rfi.stage === 'awaiting_response') {
          actions.push({
            label: 'Mark Response Received',
            status: 'active',
            stage: 'response_received',
            color: 'bg-green-600 hover:bg-green-700',
            permission: 'respond_to_rfi'
          });
          actions.push({
            label: 'Mark Late/Overdue',
            status: 'active',
            stage: 'late_overdue',
            color: 'bg-red-600 hover:bg-red-700',
            permission: 'edit_rfi'
          });
        }
        
        if (rfi.stage === 'response_received') {
          actions.push({
            label: 'Start Field Work',
            status: 'active',
            stage: 'field_work_in_progress',
            color: 'bg-purple-600 hover:bg-purple-700',
            permission: 'edit_rfi'
          });
          actions.push({
            label: 'Close RFI',
            status: 'closed',
            color: 'bg-gray-600 hover:bg-gray-700',
            permission: 'close_rfi'
          });
        }
        
        if (rfi.stage === 'field_work_in_progress') {
          actions.push({
            label: 'Mark Work Completed',
            status: 'active',
            stage: 'work_completed',
            color: 'bg-green-600 hover:bg-green-700',
            permission: 'edit_rfi'
          });
        }
        
        if (rfi.stage === 'work_completed') {
          actions.push({
            label: 'Close RFI',
            status: 'closed',
            color: 'bg-gray-600 hover:bg-gray-700',
            permission: 'close_rfi'
          });
        }
        break;
        
      case 'closed':
        actions.push({
          label: 'Reopen RFI',
          status: 'active',
          stage: 'response_received',
          color: 'bg-yellow-600 hover:bg-yellow-700',
          permission: 'edit_rfi'
        });
        break;
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Available Actions</h4>
        <div className="space-y-2">
          {availableActions.map((action, index) => (
            <PermissionButton
              key={index}
              permission={action.permission}
              onClick={() => handleStatusChange(action.status, action.stage)}
              disabled={isLoading}
              className={`w-full text-white text-sm px-3 py-2 rounded-md ${action.color} disabled:opacity-50`}
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
                action.label
              )}
            </PermissionButton>
          ))}
        </div>
      </div>
    </div>
  );
} 
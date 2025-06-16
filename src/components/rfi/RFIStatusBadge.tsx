'use client';

import React from 'react';
import { RFIStatus, RFIStage, getStatusDisplay, getStageDisplay } from '@/lib/types';

interface RFIStatusBadgeProps {
  status: RFIStatus;
  stage?: RFIStage | null;
  showIcons?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RFIStatusBadge({ status, stage, showIcons = true, size = 'md' }: RFIStatusBadgeProps) {
  const statusConfig = getStatusDisplay(status);
  const stageConfig = stage ? getStageDisplay(stage) : null;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Status Badge */}
      <div className={`inline-flex items-center rounded-full font-medium ${statusConfig.color} ${statusConfig.bgColor} ${sizeClasses[size]}`}>
        {showIcons && <span className="mr-1">{statusConfig.icon}</span>}
        <span>{statusConfig.label}</span>
      </div>
      
      {/* Stage Badge (if exists) */}
      {stage && stageConfig && (
        <div className={`inline-flex items-center rounded-full font-medium ${stageConfig.color} ${stageConfig.bgColor} ${sizeClasses[size]}`}>
          <span>{stageConfig.label}</span>
        </div>
      )}
    </div>
  );
}

interface RFIStatusDisplayProps {
  status: RFIStatus;
  stage?: RFIStage | null;
  showDescription?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function RFIStatusDisplay({ status, stage, showDescription = false, layout = 'vertical' }: RFIStatusDisplayProps) {
  const statusConfig = getStatusDisplay(status);
  const stageConfig = stage ? getStageDisplay(stage) : null;
  
  const containerClass = layout === 'horizontal' 
    ? 'flex items-center gap-3' 
    : 'flex flex-col gap-2';

  return (
    <div className={containerClass}>
      {/* Status */}
      <div className="flex items-center gap-2">
        <div>
          <div className="font-semibold text-gray-900">{statusConfig.label}</div>
          {showDescription && (
            <div className="text-sm text-gray-600">High-level status</div>
          )}
        </div>
      </div>
      
      {/* Stage */}
      {stage && stageConfig && (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-semibold text-gray-900">{stageConfig.label}</div>
            {showDescription && (
              <div className="text-sm text-gray-600">{stageConfig.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Progress indicator showing stages
interface RFIProgressProps {
  status: RFIStatus;
  stage?: RFIStage | null;
}

export function RFIProgress({ status, stage }: RFIProgressProps) {
  // Define the typical workflow stages with labels
  const workflowStages: Array<{ stage: RFIStage | null; label: string }> = [
    { stage: null, label: 'Draft' },
    { stage: 'sent_to_client', label: 'Sent to Client' },
    { stage: 'awaiting_response', label: 'Awaiting Response' },
    { stage: 'response_received', label: 'Response Received' },
    { stage: 'field_work_in_progress', label: 'Field Work' },
    { stage: 'work_completed', label: 'Completed' }
  ];

  const getCurrentStageIndex = (): number => {
    if (status === 'draft') return 0;
    
    // If RFI is closed, show as completed (last stage)
    if (status === 'closed') {
      // If it was closed after response received (no field work), show as completed
      if (stage === 'response_received') {
        return workflowStages.length - 1; // Show as "Completed"
      }
      // If it went through field work, also show as completed
      if (stage === 'work_completed' || stage === 'field_work_in_progress') {
        return workflowStages.length - 1; // Show as "Completed"
      }
    }
    
    if (!stage) return 0;
    const index = workflowStages.findIndex(ws => ws.stage === stage);
    return index === -1 ? 0 : index;
  };

  const currentStageIndex = getCurrentStageIndex();
  const isClosedRFI = status === 'closed';

  return (
    <div className="space-y-3">
      {/* Progress circles with connecting lines */}
      <div className="flex items-center justify-between">
        {workflowStages.map((workflowStage, index) => {
          const isActive = index === currentStageIndex && !isClosedRFI;
          const isCompleted = index < currentStageIndex || (isClosedRFI && index <= currentStageIndex);
          
          return (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isCompleted || (isClosedRFI && index <= currentStageIndex) ? '✓' : index + 1}
              </div>
              {index < workflowStages.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    isCompleted || (isClosedRFI && index < currentStageIndex) ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Stage labels aligned with circles */}
      <div className="flex items-center justify-between">
        {workflowStages.map((workflowStage, index) => {
          const isActive = index === currentStageIndex && !isClosedRFI;
          const isCompleted = index < currentStageIndex || (isClosedRFI && index <= currentStageIndex);
          
          return (
            <div key={index} className="flex-1 flex items-center">
              <div className="w-8 text-center">
                <span
                  className={`text-xs font-medium block ${
                    isActive
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {workflowStage.label}
                </span>
              </div>
              {index < workflowStages.length - 1 && (
                <div className="flex-1 mx-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 
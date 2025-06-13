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
        <span className="text-lg">{statusConfig.icon}</span>
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
          <span className="text-lg">📍</span>
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
  // Define the typical workflow stages
  const workflowStages: (RFIStage | null)[] = [
    null, // Draft
    'sent_to_client',
    'awaiting_response',
    'response_received',
    'field_work_in_progress',
    'work_completed'
  ];

  const getCurrentStageIndex = (): number => {
    if (status === 'draft') return 0;
    if (!stage) return 0;
    const index = workflowStages.indexOf(stage);
    return index === -1 ? 0 : index;
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="flex items-center space-x-2">
      {workflowStages.map((workflowStage, index) => {
        const isActive = index === currentStageIndex;
        const isCompleted = index < currentStageIndex;
        const stageConfig = workflowStage ? getStageDisplay(workflowStage) : { label: 'Draft' };
        
        return (
          <React.Fragment key={index}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isCompleted ? '✓' : index + 1}
            </div>
            {index < workflowStages.length - 1 && (
              <div
                className={`w-8 h-1 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
} 
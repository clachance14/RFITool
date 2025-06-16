"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { RFIFormalView } from '@/components/rfi/RFIFormalView';
import type { RFI } from '@/lib/types';

interface RFIData {
  id: string;
  rfi_number: string;
  subject: string;
  reason_for_rfi: string;
  urgency: 'urgent' | 'non-urgent';
  date_created: string;
  to_recipient: string;
  company: string;
  contractor_proposed_solution?: string;
  work_impact?: string;
  cost_impact?: string;
  schedule_impact?: string;
  status: string;
  stage?: string;
  // Cost related fields
  actual_labor_cost?: number;
  actual_material_cost?: number;
  actual_equipment_cost?: number;
  actual_labor_hours?: number;
  exclude_from_cost_tracking?: boolean;
  // Field work approval
  requires_field_work?: boolean;
  field_work_description?: string;
  projects: {
    project_name: string;
    client_company_name: string;
    contractor_job_number: string;
  };
  attachments: Array<{
    id: string;
    file_name: string;
    file_size_bytes: number;
    file_type: string;
    public_url: string;
  }>;
  client_response?: string;
  response?: string;
  response_status?: string;
  date_responded?: string;
  field_work_approved?: boolean;
}

export default function ClientRFIPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [rfiData, setRfiData] = useState<RFIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRFIData();
  }, [token]);

  const fetchRFIData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client/rfi/${token}`);
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to load RFI');
        return;
      }
      
      setRfiData(data.data);
    } catch (err) {
      setError('Failed to load RFI data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RFI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              This link may have expired or been revoked. Please contact the sender for a new link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!rfiData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No RFI data found</p>
        </div>
      </div>
    );
  }

    // Helper function to ensure valid date
  const ensureValidDate = (dateString: string | null | undefined): string => {
    if (!dateString) return new Date().toISOString();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  // Transform the data to match the RFI interface expected by RFIFormalView
  const rfiForFormalView: RFI = {
    id: rfiData.id,
    rfi_number: rfiData.rfi_number,
    subject: rfiData.subject,
    description: rfiData.reason_for_rfi,
    proposed_solution: rfiData.contractor_proposed_solution || '',
    priority: rfiData.urgency === 'urgent' ? 'high' : 'medium',
    created_at: ensureValidDate(rfiData.date_created),
    updated_at: ensureValidDate(rfiData.date_created),
    assigned_to: rfiData.to_recipient,
    status: rfiData.status === 'responded' ? 'closed' : 'active',
    stage: (rfiData.stage as any) || 'awaiting_response',
    project_id: rfiData.projects.project_name, // Using project name as ID for display
    // Cost fields - use actual values from response
    actual_labor_cost: rfiData.actual_labor_cost || undefined,
    actual_material_cost: rfiData.actual_material_cost || undefined,
    actual_equipment_cost: rfiData.actual_equipment_cost || undefined,
    actual_labor_hours: rfiData.actual_labor_hours || undefined,
    // Legacy cost fields for compatibility
    labor_costs: rfiData.actual_labor_cost || undefined,
    material_costs: rfiData.actual_material_cost || undefined,
    equipment_costs: rfiData.actual_equipment_cost || undefined,
    manhours: rfiData.actual_labor_hours || undefined,
    subcontractor_costs: undefined,
    // Attachments
    attachment_files: rfiData.attachments?.map(att => ({
      id: att.id,
      rfi_id: rfiData.id,
      file_name: att.file_name,
      file_path: '',
      file_size: att.file_size_bytes,
      file_type: att.file_type,
      created_at: ensureValidDate(rfiData.date_created),
      uploaded_by: 'system',
      public_url: att.public_url
    })) || [],
    attachments: rfiData.attachments?.map(att => att.file_name) || [],
    // Response data
    response: rfiData.response || null,
    response_date: rfiData.date_responded ? ensureValidDate(rfiData.date_responded) : null,
    // Required fields
    created_by: '',
    due_date: null,
    cost_items: []
  };

  return (
    <RFIFormalView 
      rfi={rfiForFormalView}
      isClientView={true}
      clientToken={token}
      isReadOnly={false}
      includeAttachmentsInPDF={true}
      clientName={rfiData.projects?.client_company_name || 'Client User'}
      clientEmail=""
      onResponseSubmit={() => {
        // Delay refresh to allow user to see success toast
        setTimeout(() => {
          fetchRFIData();
        }, 2000); // 2 second delay to show success message
      }}
    />
  );
} 
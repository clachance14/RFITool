"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RFI, CreateRFIInput, UpdateRFIInput, RFIStatus } from '@/lib/types';
import { createRFISchema, updateRFISchema } from '@/lib/validations';

// Mock data for development/testing
const mockRFIs: RFI[] = [
  {
    id: 'rfi-001',
    rfi_number: 'RFI-001',
    project_id: '1',
    subject: 'Structural beam clarification',
    description: 'Need clarification on beam size for floor 3',
    status: 'active',
    stage: 'sent_to_client',
    priority: 'high',
    assigned_to: 'John Smith',
    due_date: '2024-02-15T00:00:00Z',
    created_by: 'user1',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    response: null,
    response_date: null,
    attachments: [],
    manhours: 16.5,
    labor_costs: 1650,
    material_costs: 2500,
    equipment_costs: 800,
    subcontractor_costs: 0,
  },
  {
    id: 'rfi-002',
    rfi_number: 'RFI-002',
    project_id: '2',
    subject: 'HVAC system specifications',
    description: 'Clarification needed on HVAC system specifications for residential units',
    status: 'active',
    stage: 'response_received',
    priority: 'medium',
    assigned_to: 'Sarah Johnson',
    due_date: '2024-02-20T00:00:00Z',
    created_by: 'user2',
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-18T09:15:00Z',
    response: 'Use standard HVAC units as specified in drawing set B-100.',
    response_date: '2024-01-18T09:15:00Z',
    attachments: ['hvac-specs.pdf'],
    manhours: 24,
    labor_costs: 2400,
    material_costs: 8500,
    equipment_costs: 1200,
    subcontractor_costs: 15000,
  },
  {
    id: 'rfi-003',
    rfi_number: 'RFI-002',
    project_id: '1',
    subject: 'Electrical panel location',
    description: 'Need clarification on electrical panel placement in basement',
    status: 'active',
    stage: 'sent_to_client',
    priority: 'medium',
    assigned_to: 'Mike Wilson',
    due_date: '2024-02-18T00:00:00Z',
    created_by: 'user1',
    created_at: '2024-01-16T14:20:00Z',
    updated_at: '2024-01-16T14:20:00Z',
    response: null,
    response_date: null,
    attachments: [],
    manhours: 8,
    labor_costs: 800,
    material_costs: 1200,
    equipment_costs: 0,
    subcontractor_costs: 2500,
  },
  {
    id: 'rfi-004',
    rfi_number: 'RFI-001',
    project_id: '3',
    subject: 'Retail space configuration',
    description: 'Clarification needed on retail space layout and fixtures',
    status: 'draft',
    priority: 'low',
    assigned_to: null,
    due_date: null,
    created_by: 'user3',
    created_at: '2024-01-18T09:30:00Z',
    updated_at: '2024-01-18T09:30:00Z',
    response: null,
    response_date: null,
    attachments: [],
    manhours: 0,
    labor_costs: 0,
    material_costs: 0,
    equipment_costs: 0,
    subcontractor_costs: 0,
  },
  {
    id: 'rfi-005',
    rfi_number: 'RFI-003',
    project_id: '1',
    subject: 'Foundation waterproofing details',
    description: 'Need details on waterproofing membrane installation',
    status: 'active',
    stage: 'late_overdue',
    priority: 'high',
    assigned_to: 'John Smith',
    due_date: '2024-01-20T00:00:00Z',
    created_by: 'user1',
    created_at: '2024-01-12T08:15:00Z',
    updated_at: '2024-01-12T08:15:00Z',
    response: null,
    response_date: null,
    attachments: ['foundation-plans.pdf', 'waterproofing-spec.pdf'],
    manhours: 32,
    labor_costs: 3200,
    material_costs: 4500,
    equipment_costs: 2000,
    subcontractor_costs: 12000,
  },
];

interface RFIContextType {
  // State
  rfis: RFI[];
  loading: boolean;
  error: string | null;
  currentRFI: RFI | null;
  
  // CRUD Operations
  createRFI: (data: CreateRFIInput) => Promise<RFI>;
  getRFIs: (projectId?: string) => Promise<RFI[]>;
  getRFIById: (id: string) => Promise<RFI>;
  updateRFI: (id: string, data: UpdateRFIInput) => Promise<RFI>;
  deleteRFI: (id: string) => Promise<void>;
  
  // Status Management
  updateRFIStatus: (id: string, status: RFIStatus) => Promise<RFI>;
  markAsOverdue: (id: string) => Promise<RFI>;
  submitResponse: (id: string, response: string) => Promise<RFI>;
  
  // Utility Functions
  getNextRFINumber: (projectId?: string) => Promise<string>;
  filterRFIsByStatus: (status: RFIStatus) => RFI[];
  getRFIsByProject: (projectId: string) => RFI[];
  getOverdueRFIs: () => RFI[];
}

const RFIContext = createContext<RFIContextType | undefined>(undefined);

export function RFIProvider({ children }: { children: React.ReactNode }) {
  const [rfis, setRFIs] = useState<RFI[]>(mockRFIs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRFI, setCurrentRFI] = useState<RFI | null>(null);

  // RFI Numbering Logic
  const generateRFINumber = useCallback((projectId?: string): string => {
    // Filter RFIs by project if projectId is provided
    const projectRFIs = projectId 
      ? rfis.filter(rfi => rfi.project_id === projectId)
      : rfis;
    
    const lastRFI = [...projectRFIs].sort((a, b) => 
      parseInt(b.rfi_number.split('-')[1]) - parseInt(a.rfi_number.split('-')[1])
    )[0];
    
    const lastNumber = lastRFI ? parseInt(lastRFI.rfi_number.split('-')[1]) : 0;
    const nextNumber = lastNumber + 1;
    return `RFI-${nextNumber.toString().padStart(3, '0')}`;
  }, [rfis]);

  const getNextRFINumber = useCallback(async (projectId?: string): Promise<string> => {
    return generateRFINumber(projectId);
  }, [generateRFINumber]);

  // CRUD Operations
  const createRFI = useCallback(async (data: CreateRFIInput): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Validate input data
      const validatedData = createRFISchema.parse(data);
      
      // Generate RFI number for the specific project
      const rfiNumber = await getNextRFINumber(validatedData.project_id);
      
      // Create new RFI
      const newRFI: RFI = {
        id: Math.random().toString(36).substr(2, 9), // Mock ID generation
        rfi_number: rfiNumber,
        project_id: validatedData.project_id,
        subject: validatedData.subject,
        description: validatedData.reason_for_rfi,
        status: validatedData.status,
        priority: validatedData.urgency === 'urgent' ? 'high' : 'low',
        assigned_to: null,
        due_date: null,
        created_by: 'user1', // Mock user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        response: null,
        response_date: null,
        attachments: [],
        manhours: data.manhours || 0,
        labor_costs: data.labor_costs || 0,
        material_costs: data.material_costs || 0,
        equipment_costs: data.equipment_costs || 0,
        subcontractor_costs: data.subcontractor_costs || 0,
      };

      setRFIs(prev => [...prev, newRFI]);
      setCurrentRFI(newRFI);
      return newRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [getNextRFINumber]);

  const getRFIs = useCallback(async (projectId?: string): Promise<RFI[]> => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filteredRFIs = projectId 
        ? rfis.filter(rfi => rfi.project_id === projectId)
        : rfis;
      
      return filteredRFIs;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch RFIs';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [rfis]);

  const getRFIById = useCallback(async (id: string): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const rfi = rfis.find(r => r.id === id);
      if (!rfi) {
        throw new Error('RFI not found');
      }
      
      setCurrentRFI(rfi);
      return rfi;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [rfis]);

  const updateRFI = useCallback(async (id: string, data: UpdateRFIInput): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Validate input data
      const validatedData = updateRFISchema.parse(data);
      
      const existingRFI = rfis.find(r => r.id === id);
      if (!existingRFI) {
        throw new Error('RFI not found');
      }

      // Filter out null values to match RFI interface
      const filteredData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, value]) => value !== null)
      );

      const updatedRFI: RFI = {
        ...existingRFI,
        ...filteredData,
        updated_at: new Date().toISOString(),
      };

      setRFIs(prev => prev.map(rfi => rfi.id === id ? updatedRFI : rfi));
      setCurrentRFI(updatedRFI);
      return updatedRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [rfis]);

  const deleteRFI = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setRFIs(prev => prev.filter(rfi => rfi.id !== id));
      if (currentRFI?.id === id) {
        setCurrentRFI(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [currentRFI]);

  // Status Management
  const updateRFIStatus = useCallback(async (id: string, status: RFIStatus): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRFI = await updateRFI(id, { status });
      return updatedRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update RFI status';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [updateRFI]);

  const markAsOverdue = useCallback(async (id: string): Promise<RFI> => {
    return updateRFI(id, { stage: 'late_overdue' });
  }, [updateRFI]);

  const submitResponse = useCallback(async (id: string, response: string): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRFI = await updateRFI(id, {
        response,
        response_date: new Date().toISOString(),
        stage: 'response_received',
      });
      return updatedRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit response';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [updateRFI]);

  // Utility Functions
  const filterRFIsByStatus = useCallback((status: RFIStatus): RFI[] => {
    return rfis.filter(rfi => rfi.status === status);
  }, [rfis]);

  const getRFIsByProject = useCallback((projectId: string): RFI[] => {
    return rfis.filter(rfi => rfi.project_id === projectId);
  }, [rfis]);

  const getOverdueRFIs = useCallback((): RFI[] => {
    return rfis.filter(rfi => rfi.stage === 'late_overdue');
  }, [rfis]);

  // Memoized values
  const overdueRFIs = useMemo(() => getOverdueRFIs(), [getOverdueRFIs]);

  const value: RFIContextType = {
    // State
    rfis,
    loading,
    error,
    currentRFI,
    
    // CRUD Operations
    createRFI,
    getRFIs,
    getRFIById,
    updateRFI,
    deleteRFI,
    
    // Status Management
    updateRFIStatus,
    markAsOverdue,
    submitResponse,
    
    // Utility Functions
    getNextRFINumber,
    filterRFIsByStatus,
    getRFIsByProject,
    getOverdueRFIs,
  };

  return (
    <RFIContext.Provider value={value}>
      {children}
    </RFIContext.Provider>
  );
}

export function useRFIs() {
  const context = useContext(RFIContext);
  if (context === undefined) {
    throw new Error('useRFIs must be used within an RFIProvider');
  }
  return context;
} 
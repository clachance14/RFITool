"use client";

import { useState, useCallback, useMemo } from 'react';
import { RFI, CreateRFIInput, UpdateRFIInput, RFIStatus } from '@/lib/types';
import { createRFISchema, updateRFISchema } from '@/lib/validations';

// Types for the hook
type RFIResponse = {
  success: boolean;
  data?: RFI;
  error?: string;
};

// Mock data for development
const mockRFIs: RFI[] = [
  {
    id: '1',
    rfi_number: 'RFI-001',
    project_id: '1',
    subject: 'Foundation Design Clarification',
    description: 'Need clarification on foundation design specifications',
    status: 'draft',
    priority: 'low',
    assigned_to: null,
    due_date: null,
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    response: null,
    response_date: null,
    attachments: [],
  },
  {
    id: '2',
    rfi_number: 'RFI-002',
    project_id: '1',
    subject: 'Structural Steel Specifications',
    description: 'Need clarification on steel grade requirements',
    status: 'sent',
    priority: 'high',
    assigned_to: 'user2',
    due_date: '2024-02-01T00:00:00Z',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    response: 'Test Response',
    response_date: '2024-01-03T00:00:00Z',
    attachments: ['attachment-1'],
  },
];

export function useRFIs() {
  const [rfis, setRFIs] = useState<RFI[]>(mockRFIs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRFI, setCurrentRFI] = useState<RFI | null>(null);

  // CRUD Operations
  const createRFI = useCallback(async (data: CreateRFIInput): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Validate input data
      const validatedData = createRFISchema.parse(data);
      
      // Generate RFI number
      const rfiNumber = await getNextRFINumber();
      
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
      };

      setRFIs(prev => [...prev, newRFI]);
      return newRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRFIs = useCallback(async (projectId?: string): Promise<RFI[]> => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

      const updatedRFI: RFI = {
        ...existingRFI,
        ...validatedData,
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

  // RFI Status Management
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
    return updateRFIStatus(id, 'overdue');
  }, [updateRFIStatus]);

  const submitResponse = useCallback(async (id: string, response: string): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRFI = await updateRFI(id, {
        response,
        response_date: new Date().toISOString(),
        status: 'responded',
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

  // RFI Numbering Logic
  const generateRFINumber = useCallback((): string => {
    const lastRFI = [...rfis].sort((a, b) => 
      parseInt(b.rfi_number.split('-')[1]) - parseInt(a.rfi_number.split('-')[1])
    )[0];
    
    const lastNumber = lastRFI ? parseInt(lastRFI.rfi_number.split('-')[1]) : 0;
    const nextNumber = lastNumber + 1;
    return `RFI-${nextNumber.toString().padStart(3, '0')}`;
  }, [rfis]);

  const getNextRFINumber = useCallback(async (): Promise<string> => {
    return generateRFINumber();
  }, [generateRFINumber]);

  // Utility Functions
  const filterRFIsByStatus = useCallback((status: RFIStatus): RFI[] => {
    return rfis.filter(rfi => rfi.status === status);
  }, [rfis]);

  const getRFIsByProject = useCallback((projectId: string): RFI[] => {
    return rfis.filter(rfi => rfi.project_id === projectId);
  }, [rfis]);

  const getOverdueRFIs = useCallback((): RFI[] => {
    return rfis.filter(rfi => rfi.status === 'overdue' as RFIStatus);
  }, [rfis]);

  // Memoized values
  const overdueRFIs = useMemo(() => getOverdueRFIs(), [getOverdueRFIs]);

  return {
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
    filterRFIsByStatus,
    getRFIsByProject,
    overdueRFIs,
  };
} 
"use client";

import { useState, useCallback, useMemo } from 'react';
import { RFI, CreateRFIInput, UpdateRFIInput, RFIStatus } from '@/lib/types';
import { createRFISchema, updateRFISchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

// Types for the hook
type RFIResponse = {
  success: boolean;
  data?: RFI;
  error?: string;
};

export function useRFIs() {
  const [rfis, setRFIs] = useState<RFI[]>([]);
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
      
      // Create new RFI data
      const newRFIData = {
        rfi_number: rfiNumber,
        project_id: validatedData.project_id,
        subject: validatedData.subject,
        description: validatedData.reason_for_rfi,
        status: validatedData.status,
        priority: validatedData.urgency === 'urgent' ? 'high' : 'low',
        assigned_to: null,
        due_date: null,
        created_by: 'user1', // TODO: Replace with actual user ID from auth
        response: null,
        response_date: null,
        attachments: [],
      };

      const { data: newRFI, error } = await supabase
        .from('rfis')
        .insert(newRFIData)
        .select()
        .single();

      if (error) {
        const message = 'Failed to create RFI: ' + error.message;
        setError(message);
        throw new Error(message);
      }

      const rfi = newRFI as RFI;
      setRFIs(prev => [...prev, rfi]);
      return rfi;
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
      let query = supabase.from('rfis').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        const message = 'Failed to fetch RFIs: ' + error.message;
        setError(message);
        throw new Error(message);
      }
      
      const rfiData = data as RFI[];
      setRFIs(rfiData);
      return rfiData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch RFIs';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRFIById = useCallback(async (id: string): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('rfis')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        const message = 'Failed to fetch RFI: ' + error.message;
        setError(message);
        throw new Error(message);
      }
      
      if (!data) {
        const message = 'RFI not found';
        setError(message);
        throw new Error(message);
      }
      
      const rfi = data as RFI;
      setCurrentRFI(rfi);
      return rfi;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRFI = useCallback(async (id: string, data: UpdateRFIInput): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Validate input data
      const validatedData = updateRFISchema.parse(data);
      
      const { data: updatedData, error } = await supabase
        .from('rfis')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        const message = 'Failed to update RFI: ' + error.message;
        setError(message);
        throw new Error(message);
      }

      if (!updatedData) {
        const message = 'RFI not found';
        setError(message);
        throw new Error(message);
      }

      const updatedRFI = updatedData as RFI;
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
  }, []);

  const deleteRFI = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('rfis')
        .delete()
        .eq('id', id);
      
      if (error) {
        const message = 'Failed to delete RFI: ' + error.message;
        setError(message);
        throw new Error(message);
      }
      
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
  const generateRFINumber = useCallback(async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('rfis')
        .select('rfi_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error('Failed to generate RFI number: ' + error.message);
      }

      const lastRFI = data?.[0];
      const lastNumber = lastRFI ? parseInt(lastRFI.rfi_number.split('-')[1]) : 0;
      const nextNumber = lastNumber + 1;
      return `RFI-${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      // Fallback to timestamp-based numbering if query fails
      const timestamp = Date.now().toString().slice(-6);
      return `RFI-${timestamp}`;
    }
  }, []);

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
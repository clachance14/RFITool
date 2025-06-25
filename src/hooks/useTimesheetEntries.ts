"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RFITimesheetEntry, RFITimesheetSummary } from '@/lib/types';

export interface TimesheetEntryFormData {
  timesheet_number: string;
  labor_hours: number;
  labor_cost: number;
  material_cost: number;
  subcontractor_cost: number;
  equipment_cost: number;
  description: string;
  entry_date: string;
}

interface UseTimesheetEntriesReturn {
  entries: RFITimesheetEntry[];
  totals: RFITimesheetSummary;
  loading: boolean;
  error: string | null;
  fetchTimesheetEntries: () => Promise<void>;
  createTimesheetEntry: (data: TimesheetEntryFormData) => Promise<void>;
  updateTimesheetEntry: (id: string, data: TimesheetEntryFormData) => Promise<void>;
  deleteTimesheetEntry: (id: string) => Promise<void>;
}

export function useTimesheetEntries(rfiId: string): UseTimesheetEntriesReturn {
  const { session } = useAuth();
  const [entries, setEntries] = useState<RFITimesheetEntry[]>([]);
  const [totals, setTotals] = useState<RFITimesheetSummary>({
    rfi_id: rfiId,
    total_entries: 0,
    total_labor_hours: 0,
    total_labor_cost: 0,
    total_material_cost: 0,
    total_subcontractor_cost: 0,
    total_equipment_cost: 0,
    total_cost: 0,
    first_entry_date: '',
    last_entry_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheetEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/rfis/${rfiId}/timesheet-entries`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch timesheet entries');
      }

      if (result.success) {
        setEntries(result.data.entries || []);
        
        // Calculate totals from entries if no summary provided
        const entriesData = result.data.entries || [];
        const calculatedTotals: RFITimesheetSummary = {
          rfi_id: rfiId,
          total_entries: entriesData.length,
          total_labor_hours: entriesData.reduce((sum: number, entry: RFITimesheetEntry) => sum + entry.labor_hours, 0),
          total_labor_cost: entriesData.reduce((sum: number, entry: RFITimesheetEntry) => sum + entry.labor_cost, 0),
          total_material_cost: entriesData.reduce((sum: number, entry: RFITimesheetEntry) => sum + entry.material_cost, 0),
          total_subcontractor_cost: entriesData.reduce((sum: number, entry: RFITimesheetEntry) => sum + entry.subcontractor_cost, 0),
          total_equipment_cost: entriesData.reduce((sum: number, entry: RFITimesheetEntry) => sum + entry.equipment_cost, 0),
          total_cost: entriesData.reduce((sum: number, entry: RFITimesheetEntry) => 
            sum + entry.labor_cost + entry.material_cost + entry.subcontractor_cost + entry.equipment_cost, 0),
          first_entry_date: entriesData.length > 0 ? entriesData[entriesData.length - 1].entry_date : '',
          last_entry_date: entriesData.length > 0 ? entriesData[0].entry_date : ''
        };
        
        setTotals(result.data.summary || calculatedTotals);
      }
    } catch (err) {
      console.error('Error fetching timesheet entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch timesheet entries');
    } finally {
      setLoading(false);
    }
  }, [rfiId, session?.access_token]);

  const createTimesheetEntry = useCallback(async (data: TimesheetEntryFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/rfis/${rfiId}/timesheet-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create timesheet entry');
      }

      if (result.success) {
        // Refresh the entries list
        await fetchTimesheetEntries();
      }
    } catch (err) {
      console.error('Error creating timesheet entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to create timesheet entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [rfiId, session?.access_token, fetchTimesheetEntries]);

  const updateTimesheetEntry = useCallback(async (id: string, data: TimesheetEntryFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/rfis/${rfiId}/timesheet-entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update timesheet entry');
      }

      if (result.success) {
        // Refresh the entries list
        await fetchTimesheetEntries();
      }
    } catch (err) {
      console.error('Error updating timesheet entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update timesheet entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [rfiId, session?.access_token, fetchTimesheetEntries]);

  const deleteTimesheetEntry = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/rfis/${rfiId}/timesheet-entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete timesheet entry');
      }

      if (result.success) {
        // Refresh the entries list
        await fetchTimesheetEntries();
      }
    } catch (err) {
      console.error('Error deleting timesheet entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete timesheet entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [rfiId, session?.access_token, fetchTimesheetEntries]);

  return {
    entries,
    totals,
    loading,
    error,
    fetchTimesheetEntries,
    createTimesheetEntry,
    updateTimesheetEntry,
    deleteTimesheetEntry,
  };
} 
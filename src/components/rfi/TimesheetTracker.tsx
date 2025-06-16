'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useTimesheetEntries, TimesheetEntryFormData } from '@/hooks/useTimesheetEntries';
import { RFITimesheetEntry } from '@/lib/types';

interface TimesheetTrackerProps {
  rfiId: string;
  isReadOnly?: boolean;
}

export function TimesheetTracker({ rfiId, isReadOnly = false }: TimesheetTrackerProps) {
  console.log('TimesheetTracker loading for RFI:', rfiId, 'readOnly:', isReadOnly);
  
  const {
    entries,
    totals,
    loading,
    error,
    fetchTimesheetEntries,
    createTimesheetEntry,
    updateTimesheetEntry,
    deleteTimesheetEntry
  } = useTimesheetEntries(rfiId);
  
  console.log('TimesheetTracker state:', { entries, totals, loading, error });

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RFITimesheetEntry | null>(null);

  useEffect(() => {
    fetchTimesheetEntries();
  }, [fetchTimesheetEntries]);

  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  const handleEditEntry = (entry: RFITimesheetEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: TimesheetEntryFormData) => {
    try {
      if (editingEntry) {
        await updateTimesheetEntry(editingEntry.id, data);
      } else {
        await createTimesheetEntry(data);
      }
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this timesheet entry?')) {
      try {
        await deleteTimesheetEntry(entryId);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Actual Cost Tracking</h3>
          <p className="text-sm text-gray-600">Track actual costs with timesheet entries</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleAddEntry}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={showForm}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Timesheet Entry
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`border rounded-md p-4 ${
          error.includes('Database migration required') 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          {error.includes('Database migration required') ? (
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Database Migration Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The timesheet tracking feature requires database tables that haven't been created yet.
                    Please run the migration script: 
                  </p>
                  <div className="mt-2 p-2 bg-yellow-100 rounded font-mono text-xs">
                    scripts/add-timesheet-tracking.sql
                  </div>
                  <p className="mt-2">
                    Contact your administrator to execute this database migration.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <TimesheetForm
          entry={editingEntry || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={loading}
        />
      )}

      {/* Summary */}
      {totals.total_entries > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Cost Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-900">{totals.total_entries}</div>
              <div className="text-blue-700">Entries</div>
            </div>
            <div>
              <div className="font-medium text-blue-900">{totals.total_labor_hours.toFixed(2)}</div>
              <div className="text-blue-700">Labor Hours</div>
            </div>
            <div>
              <div className="font-medium text-blue-900">${totals.total_labor_cost.toLocaleString()}</div>
              <div className="text-blue-700">Labor Cost</div>
            </div>
            <div>
              <div className="font-medium text-blue-900">${totals.total_material_cost.toLocaleString()}</div>
              <div className="text-blue-700">Material Cost</div>
            </div>
            <div>
              <div className="font-medium text-blue-900">${totals.total_subcontractor_cost.toLocaleString()}</div>
              <div className="text-blue-700">Subcontractor</div>
            </div>
            <div className="bg-blue-100 rounded px-2 py-1">
              <div className="font-bold text-blue-900">${totals.total_cost.toLocaleString()}</div>
              <div className="text-blue-700">Total Cost</div>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      {entries.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-base font-medium text-gray-900">Timesheet Entries</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timesheet #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Labor Hours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Labor Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcontractor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  {!isReadOnly && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => {
                  const entryCost = entry.labor_cost + entry.material_cost + entry.subcontractor_cost + entry.equipment_cost;
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{entry.timesheet_number}</div>
                            {entry.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">{entry.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end text-sm text-gray-900">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          {entry.labor_hours.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end text-sm text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          {entry.labor_cost.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end text-sm text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          {entry.material_cost.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end text-sm text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          {entry.subcontractor_cost.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${entryCost.toLocaleString()}
                        </div>
                      </td>
                      {!isReadOnly && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={showForm}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={showForm}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : !showForm ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Timesheet Entries</h4>
          <p className="text-gray-600 mb-4">
            Start tracking actual costs by adding timesheet entries for this RFI.
          </p>
          {!isReadOnly && (
            <button
              onClick={handleAddEntry}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Entry
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Timesheet Form Component
interface TimesheetFormProps {
  entry?: RFITimesheetEntry;
  onSubmit: (data: TimesheetEntryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function TimesheetForm({ entry, onSubmit, onCancel, isLoading }: TimesheetFormProps) {
  const [formData, setFormData] = useState<TimesheetEntryFormData>({
    timesheet_number: entry?.timesheet_number || '',
    labor_hours: entry?.labor_hours || 0,
    labor_cost: entry?.labor_cost || 0,
    material_cost: entry?.material_cost || 0,
    subcontractor_cost: entry?.subcontractor_cost || 0,
    equipment_cost: entry?.equipment_cost || 0,
    description: entry?.description || '',
    entry_date: entry?.entry_date || new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.timesheet_number.trim()) {
      newErrors.timesheet_number = 'Timesheet number is required';
    }

    if (!formData.entry_date) {
      newErrors.entry_date = 'Entry date is required';
    }

    const totalCosts = formData.labor_cost + formData.material_cost + 
                      formData.subcontractor_cost + formData.equipment_cost;
    
    if (totalCosts <= 0 && formData.labor_hours <= 0) {
      newErrors.general = 'Please enter at least labor hours or some cost values';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting timesheet:', error);
    }
  };

  const handleInputChange = (field: keyof TimesheetEntryFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {entry ? 'Edit Timesheet Entry' : 'Add New Timesheet Entry'}
      </h3>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="timesheet_number" className="block text-sm font-medium text-gray-700 mb-1">
              Timesheet Number *
            </label>
            <input
              type="text"
              id="timesheet_number"
              value={formData.timesheet_number}
              onChange={(e) => handleInputChange('timesheet_number', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.timesheet_number ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="TS-2024-001"
              disabled={isLoading}
            />
            {errors.timesheet_number && (
              <p className="mt-1 text-sm text-red-600">{errors.timesheet_number}</p>
            )}
          </div>

          <div>
            <label htmlFor="entry_date" className="block text-sm font-medium text-gray-700 mb-1">
              Entry Date *
            </label>
            <input
              type="date"
              id="entry_date"
              value={formData.entry_date}
              onChange={(e) => handleInputChange('entry_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.entry_date ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.entry_date && (
              <p className="mt-1 text-sm text-red-600">{errors.entry_date}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="labor_hours" className="block text-sm font-medium text-gray-700 mb-1">
              Labor Hours
            </label>
            <input
              type="number"
              id="labor_hours"
              value={formData.labor_hours}
              onChange={(e) => handleInputChange('labor_hours', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.25"
              placeholder="8.00"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="labor_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Labor Cost ($)
            </label>
            <input
              type="number"
              id="labor_cost"
              value={formData.labor_cost}
              onChange={(e) => handleInputChange('labor_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
              placeholder="500.00"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="material_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Material Cost ($)
            </label>
            <input
              type="number"
              id="material_cost"
              value={formData.material_cost}
              onChange={(e) => handleInputChange('material_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
              placeholder="250.00"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="subcontractor_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Subcontractor Cost ($)
            </label>
            <input
              type="number"
              id="subcontractor_cost"
              value={formData.subcontractor_cost}
              onChange={(e) => handleInputChange('subcontractor_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
              placeholder="300.00"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="equipment_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Cost ($)
            </label>
            <input
              type="number"
              id="equipment_cost"
              value={formData.equipment_cost}
              onChange={(e) => handleInputChange('equipment_cost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
              placeholder="150.00"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of work performed..."
            disabled={isLoading}
          />
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm font-medium text-gray-700">
            Total Entry Cost: ${(formData.labor_cost + formData.material_cost + formData.subcontractor_cost + formData.equipment_cost).toFixed(2)}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (entry ? 'Update Entry' : 'Add Entry')}
          </button>
        </div>
      </form>
    </div>
  );
} 
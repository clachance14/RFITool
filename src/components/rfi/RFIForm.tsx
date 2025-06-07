"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createRFISchema } from '@/lib/validations';
import type { CreateRFIInput, RFI } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import ProjectSelect from '@/components/project/ProjectSelect';

// Form sections for better organization
const FORM_SECTIONS = [
  {
    title: 'Basic Information',
    fields: ['subject', 'to_recipient', 'company', 'contract_number'] as const,
  },
  {
    title: 'Project Details',
    fields: ['project_id', 'revision', 'date_created'] as const,
  },
  {
    title: 'Impact Assessment',
    fields: ['work_impact', 'cost_impact', 'schedule_impact'] as const,
  },
  {
    title: 'Technical Details',
    fields: ['discipline', 'system', 'sub_system', 'schedule_id'] as const,
  },
  {
    title: 'RFI Details',
    fields: ['reason_for_rfi', 'test_package', 'contractor_proposed_solution'] as const,
  },
  {
    title: 'References',
    fields: ['associated_reference_documents', 'requested_by', 'reviewed_by'] as const,
  },
  {
    title: 'Settings',
    fields: ['urgency', 'status'] as const,
  },
] as const;

// Auto-save key for localStorage
const AUTOSAVE_KEY = 'rfi_form_draft';

export function RFIForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize form with react-hook-form
  const form = useForm<CreateRFIInput>({
    resolver: zodResolver(createRFISchema),
    defaultValues: {
      subject: '',
      to_recipient: '',
      company: '',
      contract_number: '',
      project_id: '',
      revision: '',
      date_created: new Date().toISOString().split('T')[0],
      work_impact: '',
      cost_impact: '',
      schedule_impact: '',
      discipline: '',
      system: '',
      sub_system: '',
      schedule_id: '',
      reason_for_rfi: '',
      test_package: '',
      contractor_proposed_solution: '',
      associated_reference_documents: '',
      requested_by: '',
      reviewed_by: '',
      urgency: 'non-urgent' as const,
      status: 'draft' as const,
    },
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!isInitialLoad) return;

    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Only load if we have actual form data
        if (parsedDraft.subject || parsedDraft.to_recipient) {
          form.reset(parsedDraft);
          setLastSaved(new Date(parsedDraft.lastSaved));
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
    setIsInitialLoad(false);
  }, [form, isInitialLoad]);

  // Auto-save form data with debounce
  useEffect(() => {
    if (isInitialLoad) return;

    const subscription = form.watch((data) => {
      const formData = form.getValues();
      // Only save if we have actual form data
      if (formData.subject || formData.to_recipient) {
        localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({
            ...formData,
            lastSaved: new Date().toISOString(),
          })
        );
        setLastSaved(new Date());
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isInitialLoad]);

  // Handle form submission
  const onSubmit = async (data: CreateRFIInput) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/rfis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API validation errors
        if (response.status === 400 && result.error) {
          throw new Error(result.error);
        }
        // Handle other API errors
        throw new Error('Failed to create RFI. Please try again.');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create RFI');
      }

      // Show success message
      setSuccessMessage(`RFI ${result.data.rfi_number} created successfully!`);
      
      // Clear draft and form data
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
      
      // Reset form after a short delay
      setTimeout(() => {
        form.reset();
        setSuccessMessage(null);
        setIsInitialLoad(true); // Reset initial load state
      }, 3000);

    } catch (error) {
      console.error('Error submitting RFI:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setErrorMessage('Connection problem. Please check your internet and try again.');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save as draft
  const handleSaveDraft = useCallback(() => {
    const formData = form.getValues();
    // Only save if we have actual form data
    if (formData.subject || formData.to_recipient) {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({
          ...formData,
          lastSaved: new Date().toISOString(),
        })
      );
      setLastSaved(new Date());
      setSuccessMessage('Draft saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [form]);

  // Handle form reset
  const handleReset = useCallback(() => {
    if (showResetConfirm) {
      form.reset();
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
      setShowResetConfirm(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsInitialLoad(true); // Reset initial load state
    } else {
      setShowResetConfirm(true);
    }
  }, [form, showResetConfirm]);

  // Handle view created RFI
  const handleViewRFI = useCallback((rfiId: string) => {
    router.push(`/rfis/${rfiId}`);
  }, [router]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Create New RFI</h2>
        {lastSaved && (
          <p className="text-sm text-gray-500">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      {/* Form Sections */}
      {FORM_SECTIONS.map((section) => (
        <div key={section.title} className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{section.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.fields.map((field) => {
              if (field === 'project_id') {
                return (
                  <div key={field} className="col-span-full">
                    <ProjectSelect
                      value={form.watch('project_id')}
                      onChange={(value) => form.setValue('project_id', value)}
                      label="Project"
                      required
                      data-testid="project-select"
                    />
                    {form.formState.errors.project_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.project_id.message}
                      </p>
                    )}
                  </div>
                );
              }

              if (field === 'urgency' || field === 'status') {
                return (
                  <div key={field}>
                    <div className="space-y-2">
                      <label
                        htmlFor={field}
                        className="text-sm font-medium text-gray-700"
                      >
                        {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <SelectComponent
                        value={form.watch(field)}
                        onValueChange={(value: string) => {
                          if (field === 'urgency') {
                            form.setValue(field, value as 'urgent' | 'non-urgent');
                          } else if (field === 'status') {
                            form.setValue(field, value as 'draft' | 'sent' | 'responded' | 'overdue');
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field === 'urgency' ? (
                            <>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="non-urgent">Non-Urgent</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="responded">Responded</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </SelectComponent>
                      {form.formState.errors[field] && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors[field]?.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={field}>
                  <div className="space-y-2">
                    <label
                      htmlFor={field}
                      className="text-sm font-medium text-gray-700"
                    >
                      {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                    <Input
                      id={field}
                      {...form.register(field)}
                      placeholder={`Enter ${field.replace(/_/g, ' ')}...`}
                    />
                    {form.formState.errors[field] && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors[field]?.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          {showResetConfirm ? 'Confirm Reset' : 'Reset Form'}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create RFI'}
        </Button>
      </div>
    </form>
  );
} 
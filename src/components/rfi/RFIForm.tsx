"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useToast } from '@/components/ui/use-toast';
import { useRFI } from '@/hooks/useRFI';
import { Loader2 } from 'lucide-react';

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
  const { toast } = useToast();
  const { createRFI, isLoading, error } = useRFI();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize form with react-hook-form
  const { register, handleSubmit, formState, getValues, setValue, watch, reset, control } = useForm<CreateRFIInput>({
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
      urgency: 'non-urgent',
      status: 'draft'
    },
    mode: 'onChange'
  });
  const { errors, isDirty, isValid } = formState;

  // Watch for changes in form fields
  const formValues = watch();

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!isInitialLoad) return;

    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Only load if we have actual form data
        if (parsedDraft.subject || parsedDraft.to_recipient) {
          reset(parsedDraft);
          setLastSaved(new Date(parsedDraft.lastSaved));
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
    setIsInitialLoad(false);
  }, [reset, isInitialLoad]);

  // Auto-save effect
  useEffect(() => {
    if (isDirty) {
      const currentValues = getValues();
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        ...currentValues,
        lastSaved: new Date().toISOString()
      }));
      setLastSaved(new Date());
    }
  }, [formValues, isDirty, getValues]);

  // Handle form submission
  const onSubmit = async (data: CreateRFIInput) => {
    setIsSubmitting(true);
    try {
      const response = await createRFI(data);
      if (response) {
        setSuccessMessage(`RFI ${response.rfi_number} created successfully!`);
        localStorage.removeItem(AUTOSAVE_KEY);
        router.push('/rfis');
      }
    } catch (err) {
      // Error is handled by the useRFI hook
      console.error('Error creating RFI:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save as draft
  const handleSaveDraft = useCallback(() => {
    const formData = getValues();
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
  }, [getValues]);

  // Handle form reset
  const handleReset = useCallback(() => {
    if (showResetConfirm) {
      reset();
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
      setShowResetConfirm(false);
      setSuccessMessage(null);
      setIsInitialLoad(true); // Reset initial load state
    } else {
      setShowResetConfirm(true);
    }
  }, [reset, showResetConfirm]);

  // Handle view created RFI
  const handleViewRFI = useCallback((rfiId: string) => {
    router.push(`/rfis/${rfiId}`);
  }, [router]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Create New RFI</h2>
        {isLoading && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating RFI...
          </div>
        )}
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
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error.message || 'Connection problem. Please check your internet and try again.'}
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
                    <div className="space-y-2" data-testid="project-select">
                      <ProjectSelect
                        value={getValues('project_id')}
                        onChange={(value) => setValue('project_id', value)}
                        error={errors.project_id?.message}
                      />
                    </div>
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
                        value={getValues(field)}
                        onValueChange={(value: string) => {
                          if (field === 'urgency') {
                            setValue(field, value as 'urgent' | 'non-urgent');
                          } else if (field === 'status') {
                            setValue(field, value as 'draft' | 'sent' | 'responded' | 'overdue');
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
                      {errors[field] && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors[field]?.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              if (field === 'subject') {
                return (
                  <div key={field}>
                    <div className="space-y-2">
                      <label
                        htmlFor="subject"
                        className="text-sm font-medium text-gray-700"
                      >
                        Subject
                      </label>
                      <Controller
                        name="subject"
                        control={control}
                        rules={{ required: 'Subject is required' }}
                        render={({ field: { onChange, value, ...field }, fieldState }) => (
                          <>
                            <input
                              {...field}
                              id="subject"
                              data-testid="subject-input"
                              className="flex h-10 w-full rounded-md border"
                              placeholder="Enter subject..."
                              value={value}
                              onChange={(e) => {
                                onChange(e);
                                console.log('📝 Subject onChange triggered:', {
                                  value: e.target.value,
                                  name: e.target.name,
                                  formState: formState,
                                  currentValues: getValues()
                                });
                              }}
                            />
                            {fieldState.error && (
                              <p className="text-sm text-red-600 mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
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
                    <Controller
                      name={field}
                      control={control}
                      render={({ field: { onChange, value, ...field }, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            id={field.name}
                            value={value}
                            onChange={onChange}
                            placeholder={`Enter ${field.name.split('_').join(' ')}...`}
                            data-testid={`${field.name}-input`}
                          />
                          {fieldState.error && (
                            <p className="text-sm text-red-600 mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
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
          onClick={handleReset}
          disabled={isSubmitting}
        >
          {showResetConfirm ? 'Confirm Reset' : 'Reset Form'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
        >
          Save Draft
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating RFI...
            </>
          ) : (
            'Create RFI'
          )}
        </Button>
      </div>
    </form>
  );
} 
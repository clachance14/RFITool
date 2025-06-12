"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createRFISchema } from '@/lib/validations';
import type { CreateRFIInput } from '@/lib/types';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import ProjectSelect from '@/components/project/ProjectSelect';
import { FileUpload } from '@/components/ui/FileUpload';
import { validateAttachmentFile } from '@/lib/storage';

interface SimpleRFIFormWorkingProps {
  isReadOnly?: boolean;
}

export function SimpleRFIFormWorking({ isReadOnly = false }: SimpleRFIFormWorkingProps) {
  const router = useRouter();
  const { getProject, projects } = useProjects();
  const { createRFI, getNextRFINumber } = useRFIs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<'draft' | 'active'>('draft');
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [nextRFINumber, setNextRFINumber] = useState<string>('');
  const [hasCostImpact, setHasCostImpact] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const form = useForm<CreateRFIInput>({
    resolver: zodResolver(createRFISchema),
    defaultValues: {
      subject: '',
      reason_for_rfi: '',
      contractor_question: '',
      work_impact: '',
      cost_impact: undefined,
      discipline: '',
      schedule_impact: '',
      system: '',
      test_package: '',
      schedule_id: '',
      block_area: '',
      urgency: 'non-urgent',
      project_id: '',
      status: 'draft',
      contractor_proposed_solution: '',
      manhours: undefined,
      labor_costs: undefined,
      material_costs: undefined,
      equipment_costs: undefined,
      subcontractor_costs: undefined,
    },
  });

  // Auto-save and draft loading
  const formValues = form.watch();
  const selectedProjectId = form.watch('project_id');

  // Load project details when project is selected
  useEffect(() => {
    const loadProjectDetails = async () => {
      if (selectedProjectId && !isReadOnly) {
        try {
          const response = await getProject(selectedProjectId);
          if (response.data) {
            // Auto-populate fields based on project (if needed)
            // Example: form.setValue('company', response.data.client_company_name);
          }
        } catch (error) {
          console.error('Error loading project details:', error);
        }
      }
    };
    loadProjectDetails();
  }, [selectedProjectId, getProject, form, isReadOnly]);

  // Auto-save effect (disabled for read-only)
  useEffect(() => {
    if (formValues.subject && !isReadOnly) {
      localStorage.setItem('working_rfi_draft', JSON.stringify(formValues));
    }
  }, [formValues, isReadOnly]);

  // Load next RFI number when project changes
  useEffect(() => {
    const fetchNextRFINumber = async () => {
      if (selectedProjectId && !isReadOnly) {
        try {
          const rfiNumber = await getNextRFINumber(selectedProjectId);
          setNextRFINumber(rfiNumber);
        } catch (error) {
          console.error('Error fetching next RFI number:', error);
        }
      } else if (isReadOnly && selectedProjectId) {
        // Show demo RFI number for read-only users
        setNextRFINumber('RFI-DEMO-001');
      } else {
        setNextRFINumber('');
      }
    };
    fetchNextRFINumber();
  }, [selectedProjectId, getNextRFINumber, isReadOnly]);

  // Initialize with blank form (removed draft loading)
  useEffect(() => {
    // Start with a completely blank form
    form.reset({
      subject: '',
      reason_for_rfi: '',
      contractor_question: '',
      work_impact: '',
      cost_impact: undefined,
      discipline: '',
      schedule_impact: '',
      system: '',
      test_package: '',
      schedule_id: '',
      block_area: '',
      urgency: 'non-urgent',
      project_id: '',
      status: 'draft',
      contractor_proposed_solution: '',
      manhours: undefined,
      labor_costs: undefined,
      material_costs: undefined,
      equipment_costs: undefined,
      subcontractor_costs: undefined,
    });
  }, [form]);

  const handleProjectChange = (value: string) => {
    if (!isReadOnly) {
      form.setValue('project_id', value);
    }
  };

  const handleClearForm = () => {
    if (isReadOnly) {
      setSubmitMessage('Read-only access: Cannot modify form');
      return;
    }
    
    form.reset({
      subject: '',
      reason_for_rfi: '',
      contractor_question: '',
      work_impact: '',
      cost_impact: undefined,
      discipline: '',
      schedule_impact: '',
      system: '',
      test_package: '',
      schedule_id: '',
      block_area: '',
      urgency: 'non-urgent',
      project_id: '',
      status: 'draft',
      contractor_proposed_solution: '',
      manhours: undefined,
      labor_costs: undefined,
      material_costs: undefined,
      equipment_costs: undefined,
      subcontractor_costs: undefined,
    });
    localStorage.removeItem('working_rfi_draft');
    setSubmitMessage('');
    setHasCostImpact(false);
  };

  const onSubmit = async (data: CreateRFIInput) => {
    // Prevent submission for read-only users
    if (isReadOnly) {
      setSubmitMessage('Read-only access: Cannot create or modify RFIs');
      return;
    }

    console.log('📋 Form submitted with complete data:', data);
    
    // Debug: Check the current form values directly
    const watchedValues = {
      manhours: form.watch('manhours'),
      labor_costs: form.watch('labor_costs'),
      material_costs: form.watch('material_costs'),
      equipment_costs: form.watch('equipment_costs'),
      subcontractor_costs: form.watch('subcontractor_costs'),
    };
    console.log('🔍 Current form values from watch:', watchedValues);
    
    // Debug: Check the DOM input values directly
    const domValues = {
      manhours: (document.getElementById('manhours') as HTMLInputElement)?.value,
      labor_costs: (document.getElementById('labor_costs') as HTMLInputElement)?.value,
      material_costs: (document.getElementById('material_costs') as HTMLInputElement)?.value,
      equipment_costs: (document.getElementById('equipment_costs') as HTMLInputElement)?.value,
      subcontractor_costs: (document.getElementById('subcontractor_costs') as HTMLInputElement)?.value,
    };
    console.log('🔍 DOM input values:', domValues);
    
    // Debug: Check if form data matches watch data
    const submittedValues = {
      manhours: data.manhours,
      labor_costs: data.labor_costs,
      material_costs: data.material_costs,
      equipment_costs: data.equipment_costs,
      subcontractor_costs: data.subcontractor_costs,
    };
    console.log('💰 Cost data being submitted:', submittedValues);
    
    // Check for data tampering
    const isDataTampered = JSON.stringify(watchedValues) !== JSON.stringify(submittedValues);
    console.log('🚨 DATA TAMPERING DETECTED:', isDataTampered);
    if (isDataTampered) {
      console.log('⚠️ Browser extension or script may be modifying form data!');
      console.log('Expected:', watchedValues);
      console.log('Received:', submittedValues);
      
      // Use watched values as fallback
      Object.assign(data, watchedValues);
      console.log('✅ Using watched values as fallback:', data);
    }
    try {
      setIsSubmitting(true);
      setSubmitMessage('');
      
      // Add attachments to the form data (status is already set via form.setValue)
      const dataWithAttachments = {
        ...data,
        attachments: attachments
      };
      

      
      const newRFI = await createRFI(dataWithAttachments);
      
      // Show success message based on action
      const successMessage = submitAction === 'active' 
        ? `RFI created and activated successfully! Redirecting to RFI view...`
        : `RFI saved as draft successfully! Redirecting to RFI view...`;
      setSubmitMessage(successMessage);
      
      // Clean up form state
      form.reset();
      setAttachments([]);
      localStorage.removeItem('working_rfi_draft');
      
      // Navigate to view RFI page regardless of action after a brief delay
      setTimeout(() => {
        router.push(`/rfis/${newRFI.id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('RFI creation error:', error);
      setSubmitMessage(error?.message || 'Failed to create RFI. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRFI = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      setSubmitMessage('Read-only access: Cannot create RFIs');
      return;
    }
    setSubmitAction('active');
    // Update the form's status field directly
    form.setValue('status', 'active');
    form.handleSubmit(onSubmit)();
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      setSubmitMessage('Read-only access: Cannot save RFIs');
      return;
    }
    setSubmitAction('draft');
    // Update the form's status field directly
    form.setValue('status', 'draft');
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Demo Mode - Read Only Access</h3>
              <div className="mt-1 text-sm text-amber-700">
                You can view all RFI form features and fields, but cannot create, edit, or upload files. This is for demonstration purposes only.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{isReadOnly ? 'RFI Form Demo' : 'Create New RFI'}</h2>
        {nextRFINumber && selectedProjectId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-sm text-blue-600 font-medium">Next RFI Number: </span>
            <span className="text-lg font-bold text-blue-800">{nextRFINumber}</span>
            <div className="text-xs text-blue-500 mt-1">
              {projects.find(p => p.id === selectedProjectId)?.project_name}
            </div>
          </div>
        )}
      </div>
      
      {/* Form Validation Errors */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <h4 className="font-medium mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(form.formState.errors).map(([field, error]) => (
              <li key={field}>
                <strong>{field}:</strong> {error?.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Primary Information (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <ProjectSelect
                  value={form.watch('project_id')}
                  onChange={handleProjectChange}
                  label="Project"
                  required={true}
                  error={form.formState.errors.project_id?.message}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  id="subject"
                  {...form.register('subject')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter subject..."
                  disabled={isReadOnly}
                />
                {form.formState.errors.subject && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="discipline" className="block text-sm font-medium text-gray-700 mb-1">
                  Discipline
                </label>
                <select
                  id="discipline"
                  {...form.register('discipline')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  disabled={isReadOnly}
                >
                  <option value="">Select discipline...</option>
                  <option value="Pipe">Pipe</option>
                  <option value="Steel">Steel</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Instrumentation">Instrumentation</option>
                  <option value="Paint">Paint</option>
                  <option value="Insulation">Insulation</option>
                </select>
              </div>

              <div>
                <label htmlFor="reason_for_rfi" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for RFI *
                </label>
                <select
                  id="reason_for_rfi"
                  {...form.register('reason_for_rfi')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  disabled={isReadOnly}
                >
                  <option value="">Select reason...</option>
                  <option value="Design clarification">Design clarification</option>
                  <option value="Scope of work unclear">Scope of work unclear</option>
                  <option value="Conflict between drawings">Conflict between drawings</option>
                  <option value="Missing dimensions or details">Missing dimensions or details</option>
                  <option value="Material substitution request">Material substitution request</option>
                  <option value="Field condition not matching plans">Field condition not matching plans</option>
                  <option value="Fabrication error or discrepancy">Fabrication error or discrepancy</option>
                  <option value="Incorrect or missing work details">Incorrect or missing work details</option>
                  <option value="Shop drawing doesn't match IFC">Shop drawing doesn't match IFC</option>
                  <option value="Coordination issue with another trade">Coordination issue with another trade</option>
                  <option value="Verification of installation method">Verification of installation method</option>
                  <option value="Request for revised drawing">Request for revised drawing</option>
                  <option value="Documenting verbal instruction">Documenting verbal instruction</option>
                  <option value="Documenting field decision/change">Documenting field decision/change</option>
                  <option value="Request for confirmation of accepted deviation">Request for confirmation of accepted deviation</option>
                  <option value="Spec or Drawing compliance question">Spec or Drawing compliance question</option>
                  <option value="Change in sequence or constructability concern">Change in sequence or constructability concern</option>
                  <option value="Other">Other</option>
                </select>
                {form.formState.errors.reason_for_rfi && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.reason_for_rfi.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency
                </label>
                <select
                  id="urgency"
                  {...form.register('urgency')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  disabled={isReadOnly}
                >
                  <option value="non-urgent">Non-Urgent</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="contractor_question" className="block text-sm font-medium text-gray-700 mb-1">
                  Contractor Question *
                </label>
                <textarea
                  id="contractor_question"
                  {...form.register('contractor_question')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter the contractor's question..."
                  rows={3}
                  disabled={isReadOnly}
                />
                {form.formState.errors.contractor_question && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.contractor_question.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Proposed Solution Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposed Solution</h3>
            <div>
              <label htmlFor="contractor_proposed_solution" className="block text-sm font-medium text-gray-700 mb-1">
                Contractor Proposed Solution
              </label>
              <textarea
                id="contractor_proposed_solution"
                {...form.register('contractor_proposed_solution')}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="Describe your proposed solution..."
                rows={4}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearForm}
              className={`px-6 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center ${
                isReadOnly 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
              disabled={isSubmitting || isReadOnly}
              title={isReadOnly ? 'Read-only access: Cannot modify form' : 'Clear form'}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear RFI Form
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className={`px-6 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                  isReadOnly 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
                disabled={isSubmitting || isReadOnly}
                title={isReadOnly ? 'Read-only access: Cannot save RFIs' : 'Save as draft'}
              >
                {isSubmitting && submitAction === 'draft' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {isSubmitting && submitAction === 'draft' ? 'Saving Draft...' : 'Save as Draft'}
              </button>
              
              <button
                type="button"
                onClick={handleCreateRFI}
                className={`px-6 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                  isReadOnly 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={isSubmitting || isReadOnly}
                title={isReadOnly ? 'Read-only access: Cannot create RFIs' : 'Create RFI'}
              >
                {isSubmitting && submitAction === 'active' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {isSubmitting && submitAction === 'active' ? 'Creating RFI...' : 'Create RFI'}
              </button>
            </div>
          </div>

          {submitMessage && (
            <div className={`px-4 py-3 rounded-md ${
              submitMessage.includes('successfully') 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex items-center">
                {submitMessage.includes('successfully') && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                )}
                {submitMessage}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Secondary Information (1/3 width) */}
        <div className="space-y-6">
          
          {/* Classification Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="system" className="block text-sm font-medium text-gray-700 mb-1">
                  System
                </label>
                <input
                  id="system"
                  {...form.register('system')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter system..."
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label htmlFor="block_area" className="block text-sm font-medium text-gray-700 mb-1">
                  Block/Area
                </label>
                <input
                  id="block_area"
                  {...form.register('block_area')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter block or area..."
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label htmlFor="work_impact" className="block text-sm font-medium text-gray-700 mb-1">
                  Work Impact
                </label>
                <input
                  id="work_impact"
                  {...form.register('work_impact')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Describe work impact..."
                  disabled={isReadOnly}
                />
              </div>

              {/* Cost Impact Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Impact Present?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCostImpact"
                      value="no"
                      checked={!hasCostImpact}
                      onChange={() => {
                        if (!isReadOnly) {
                          setHasCostImpact(false);
                          // Clear cost fields when "No" is selected
                          form.setValue('manhours', undefined);
                          form.setValue('labor_costs', undefined);
                          form.setValue('material_costs', undefined);
                          form.setValue('equipment_costs', undefined);
                          form.setValue('subcontractor_costs', undefined);
                        }
                      }}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                      disabled={isReadOnly}
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCostImpact"
                      value="yes"
                      checked={hasCostImpact}
                      onChange={() => {
                        if (!isReadOnly) {
                          setHasCostImpact(true);
                        }
                      }}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                      disabled={isReadOnly}
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                </div>
              </div>

              {/* Cost Impact Details - Show only if hasCostImpact is true */}
              <div className={`bg-gray-50 p-4 rounded-md border border-gray-200 ${!hasCostImpact ? 'hidden' : ''}`}>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Cost Impact Details</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="manhours" className="block text-xs font-medium text-gray-700 mb-1">
                      Manhours
                    </label>
                    <input
                      id="manhours"
                      type="number"
                      step="0.5"
                      {...form.register('manhours', { valueAsNumber: true })}
                      className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!hasCostImpact || isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter manhours..."
                      disabled={isReadOnly || !hasCostImpact}
                      onFocus={(e) => {
                        if (!hasCostImpact || isReadOnly) {
                          e.target.blur();
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="labor_costs" className="block text-xs font-medium text-gray-700 mb-1">
                      Labor Costs ($)
                    </label>
                    <input
                      id="labor_costs"
                      type="number"
                      step="0.01"
                      {...form.register('labor_costs', { valueAsNumber: true })}
                      className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!hasCostImpact || isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter labor costs..."
                      disabled={isReadOnly || !hasCostImpact}
                      onFocus={(e) => {
                        if (!hasCostImpact || isReadOnly) {
                          e.target.blur();
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="material_costs" className="block text-xs font-medium text-gray-700 mb-1">
                      Material Costs ($)
                    </label>
                    <input
                      id="material_costs"
                      type="number"
                      step="0.01"
                      {...form.register('material_costs', { valueAsNumber: true })}
                      className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!hasCostImpact || isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter material costs..."
                      disabled={isReadOnly || !hasCostImpact}
                      onFocus={(e) => {
                        if (!hasCostImpact || isReadOnly) {
                          e.target.blur();
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="equipment_costs" className="block text-xs font-medium text-gray-700 mb-1">
                      Equipment Costs ($)
                    </label>
                    <input
                      id="equipment_costs"
                      type="number"
                      step="0.01"
                      {...form.register('equipment_costs', { valueAsNumber: true })}
                      className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!hasCostImpact || isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter equipment costs..."
                      disabled={isReadOnly || !hasCostImpact}
                      onFocus={(e) => {
                        if (!hasCostImpact || isReadOnly) {
                          e.target.blur();
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subcontractor_costs" className="block text-xs font-medium text-gray-700 mb-1">
                      Subcontractor Costs ($)
                    </label>
                    <input
                      id="subcontractor_costs"
                      type="number"
                      step="0.01"
                      {...form.register('subcontractor_costs', { valueAsNumber: true })}
                      className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${!hasCostImpact || isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter subcontractor costs..."
                      disabled={isReadOnly || !hasCostImpact}
                      onFocus={(e) => {
                        if (!hasCostImpact || isReadOnly) {
                          e.target.blur();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="schedule_impact" className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Impact
                </label>
                <textarea
                  id="schedule_impact"
                  {...form.register('schedule_impact')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Describe schedule impact..."
                  rows={2}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label htmlFor="test_package" className="block text-sm font-medium text-gray-700 mb-1">
                  Test Package
                </label>
                <input
                  id="test_package"
                  {...form.register('test_package')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter test package..."
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label htmlFor="schedule_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule ID
                </label>
                <input
                  id="schedule_id"
                  {...form.register('schedule_id')}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter schedule ID..."
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            <FileUpload
              files={attachments}
              onFilesChange={(newFiles) => {
                if (!isReadOnly) {
                  console.log('RFI Form: setAttachments called with:', newFiles);
                  setAttachments(newFiles);
                }
              }}
              maxFiles={10}
              maxFileSize={50}
              acceptedFileTypes={[]}
              placeholder={isReadOnly ? "File upload disabled in demo mode" : "Click to upload files or drag and drop"}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </form>
    </div>
  );
} 
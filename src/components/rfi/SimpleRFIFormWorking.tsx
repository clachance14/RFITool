"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createRFISchema } from '@/lib/validations';
import type { CreateRFIInput } from '@/lib/types';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/contexts/RFIContext';

export function SimpleRFIFormWorking() {
  const router = useRouter();
  const { getProject, projects } = useProjects();
  const { createRFI, getNextRFINumber } = useRFIs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [nextRFINumber, setNextRFINumber] = useState<string>('');
  const [hasCostImpact, setHasCostImpact] = useState<boolean>(false);
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
      if (selectedProjectId) {
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
  }, [selectedProjectId, getProject, form]);

  // Auto-save effect
  useEffect(() => {
    if (formValues.subject) {
      localStorage.setItem('working_rfi_draft', JSON.stringify(formValues));
    }
  }, [formValues]);

  // Load next RFI number when project changes
  useEffect(() => {
    const fetchNextRFINumber = async () => {
      if (selectedProjectId) {
        try {
          const rfiNumber = await getNextRFINumber(selectedProjectId);
          setNextRFINumber(rfiNumber);
        } catch (error) {
          console.error('Error fetching next RFI number:', error);
        }
      } else {
        setNextRFINumber('');
      }
    };
    fetchNextRFINumber();
  }, [selectedProjectId, getNextRFINumber]);

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

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    form.setValue('project_id', e.target.value);
  };

  const handleClearForm = () => {
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
    console.log('Form submitted with data:', data);
    try {
      setIsSubmitting(true);
      setSubmitMessage('');
      const newRFI = await createRFI(data);
      
      // Show success message briefly, then navigate to the professional RFI view
      setSubmitMessage(`RFI created successfully! Redirecting to professional view...`);
      
      // Clean up form state
      form.reset();
      localStorage.removeItem('working_rfi_draft');
      
      // Navigate to the professional RFI detail view after a brief delay
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Create New RFI</h2>
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
                <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Project *
                </label>
                <select
                  id="project_id"
                  {...form.register('project_id')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={handleProjectChange}
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.project_id && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.project_id.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  id="subject"
                  {...form.register('subject')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter subject..."
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the contractor's question..."
                  rows={3}
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your proposed solution..."
                rows={4}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearForm}
              className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear RFI Form
            </button>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isSubmitting ? 'Creating RFI...' : 'Create RFI'}
            </button>
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter system..."
                />
              </div>

              <div>
                <label htmlFor="block_area" className="block text-sm font-medium text-gray-700 mb-1">
                  Block/Area
                </label>
                <input
                  id="block_area"
                  {...form.register('block_area')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter block or area..."
                />
              </div>

              <div>
                <label htmlFor="work_impact" className="block text-sm font-medium text-gray-700 mb-1">
                  Work Impact
                </label>
                <input
                  id="work_impact"
                  {...form.register('work_impact')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe work impact..."
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
                      onChange={() => setHasCostImpact(false)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasCostImpact"
                      value="yes"
                      checked={hasCostImpact}
                      onChange={() => setHasCostImpact(true)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                </div>
              </div>

              {/* Cost Impact Details - Show only if hasCostImpact is true */}
              {hasCostImpact && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
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
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter manhours..."
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
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter labor costs..."
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
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter material costs..."
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
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter equipment costs..."
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
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter subcontractor costs..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="schedule_impact" className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Impact
                </label>
                <textarea
                  id="schedule_impact"
                  {...form.register('schedule_impact')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe schedule impact..."
                  rows={2}
                />
              </div>

              <div>
                <label htmlFor="test_package" className="block text-sm font-medium text-gray-700 mb-1">
                  Test Package
                </label>
                <input
                  id="test_package"
                  {...form.register('test_package')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter test package..."
                />
              </div>

              <div>
                <label htmlFor="schedule_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule ID
                </label>
                <input
                  id="schedule_id"
                  {...form.register('schedule_id')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter schedule ID..."
                />
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-2">File upload coming soon</p>
              <button type="button" className="text-xs text-blue-600 hover:text-blue-800" disabled>
                Browse files
              </button>
            </div>
          </div>

          {/* Activity Feed Placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Activity timeline will appear here</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 
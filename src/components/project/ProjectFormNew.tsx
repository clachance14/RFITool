"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function ProjectFormNew() {
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    mode: 'onChange',
    defaultValues: {
      project_name: '',
      job_contract_number: '',
      client_company_name: '',
      project_manager_contact: '',
      location: '',
      project_type: undefined,
      contract_value: undefined,
      start_date: '',
      expected_completion: '',
      project_description: '',
      default_urgency: 'non-urgent',
      standard_recipients: [''],
      project_disciplines: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "standard_recipients",
  });

  // Debug form setup
  console.log('🔧 Form object:', form);
  console.log('🔧 Form handleSubmit:', typeof form.handleSubmit);
  console.log('🔧 Form errors:', form.formState.errors);
  console.log('🔧 Form isValid:', form.formState.isValid);
  console.log('🔧 Form values:', form.getValues());

  const { register, handleSubmit, formState: { errors } } = form;
  const { createProject } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const router = useRouter();

  const onSubmit = async (data: CreateProjectInput) => {
    console.log('🎯 onSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      console.log('📡 Making API call to create project...');
      const result = await createProject(data);
      console.log('📡 API call result:', result);
      
      if (result.error) {
        console.error('❌ Error creating project:', result.error);
        toast.error(result.error);
        setSubmitMessage(`Error: ${result.error}`);
      } else {
        console.log('✅ Project created successfully:', result.data);
        toast.success('Project created successfully');
        setSubmitMessage('Project created successfully!');
        form.reset();
        router.push('/projects');
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('Failed to create project');
      setSubmitMessage('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log('📝 Form values changed:', value);
      console.log('📝 Form errors:', form.formState.errors);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Add form state debugging
  useEffect(() => {
    console.log('🔄 Form state updated:', {
      values: form.getValues(),
      errors: form.formState.errors,
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting
    });
  }, [form.formState]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Project Identification Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Project Identification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label htmlFor="project_name" className="block text-sm font-medium mb-1">
                Project Name *
              </label>
              <input
                id="project_name"
                {...register('project_name')}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., Downtown Office Building"
              />
              {errors.project_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.project_name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="job_contract_number" className="block text-sm font-medium mb-1">
                Job/Contract Number *
              </label>
              <input
                id="job_contract_number"
                {...register('job_contract_number')}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., CN-2024-001"
              />
              {errors.job_contract_number && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.job_contract_number.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="client_company_name" className="block text-sm font-medium mb-1">
                Client Company *
              </label>
              <input
                id="client_company_name"
                {...register('client_company_name')}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., ABC Development Corp"
              />
              {errors.client_company_name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.client_company_name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="project_manager_contact" className="block text-sm font-medium mb-1">
                Project Manager Email *
              </label>
              <input
                id="project_manager_contact"
                type="email"
                {...register('project_manager_contact')}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., pm@client.com"
              />
              {errors.project_manager_contact && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.project_manager_contact.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Project Details Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                Location
              </label>
              <input
                id="location"
                {...register('location')}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., 123 Main St, City, State"
              />
              {errors.location && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.location.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="project_type" className="block text-sm font-medium mb-1">
                Project Type
              </label>
              <select
                id="project_type"
                {...register('project_type')}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select project type...</option>
                <option value="mechanical">Mechanical</option>
                <option value="civil">Civil</option>
                <option value="ie">I&E (Instrumentation & Electrical)</option>
                <option value="other">Other</option>
              </select>
              {errors.project_type && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.project_type.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contract_value" className="block text-sm font-medium mb-1">
                Contract Value
              </label>
              <input
                id="contract_value"
                type="number"
                {...register('contract_value', { valueAsNumber: true })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., 500000"
              />
              {errors.contract_value && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.contract_value.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                id="start_date"
                type="date"
                {...register('start_date')}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {errors.start_date && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="expected_completion" className="block text-sm font-medium mb-1">
                Expected Completion
              </label>
              <input
                id="expected_completion"
                type="date"
                {...register('expected_completion')}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {errors.expected_completion && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.expected_completion.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="project_description" className="block text-sm font-medium mb-1">
                Project Description
              </label>
              <textarea
                id="project_description"
                {...register('project_description')}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
                placeholder="Brief description of the project..."
              />
              {errors.project_description && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.project_description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Default RFI Settings Section */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Default RFI Settings</h3>
          <div className="space-y-4">
            
            <div>
              <label htmlFor="default_urgency" className="block text-sm font-medium mb-1">
                Default Urgency Level *
              </label>
              <select
                id="default_urgency"
                {...register('default_urgency')}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="non-urgent">Non-Urgent (5 days response)</option>
                <option value="urgent">Urgent (1 day response)</option>
              </select>
              {errors.default_urgency && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.default_urgency.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Standard Recipients * (at least one required)
              </label>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <input
                      {...register(`standard_recipients.${index}` as const)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder={index === 0 ? "Primary recipient email" : "Additional recipient email"}
                      type="email"
                    />
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => append('')}
                className="mt-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm"
              >
                Add Recipient
              </button>
              
              {/* Updated Error Display Logic */}
              {errors.standard_recipients && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.standard_recipients.root?.message || errors.standard_recipients.message}
                </p>
              )}
              {errors.standard_recipients?.map?.((error, index) => 
                error?.message ? (
                  <p key={index} className="text-red-600 text-sm mt-1">
                    Recipient #{index + 1}: {error.message}
                  </p>
                ) : null
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Project Disciplines
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['HVAC', 'Electrical', 'Plumbing', 'Structural', 'Mechanical', 'Civil', 'Fire Safety', 'Other'].map((discipline) => (
                  <label key={discipline} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={discipline}
                      {...register('project_disciplines')}
                      className="rounded"
                    />
                    <span className="text-sm">{discipline}</span>
                  </label>
                ))}
              </div>
              {errors.project_disciplines && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.project_disciplines.message}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={() => console.log('🖱️ Submit button clicked')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating Project...' : 'Create Project'}
        </button>

        {submitMessage && (
          <div className={`mt-4 p-3 rounded ${submitMessage.includes('Error') || submitMessage.includes('Failed') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'}`}>
            {submitMessage}
          </div>
        )}

        {/* Debug Current Values */}
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <strong>Current Values:</strong>
          <pre className="text-sm">{JSON.stringify(form.watch(), null, 2)}</pre>
        </div>
      </form>
    </div>
  );
} 
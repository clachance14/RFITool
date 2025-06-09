"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRFISchema } from '@/lib/validations';
import type { CreateRFIInput } from '@/lib/types';
import ProjectSelect from '@/components/project/ProjectSelect';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';

interface Project {
  id: string;
  project_name: string;
  job_contract_number: string;
}

export function SimpleRFIFormWorking() {
  const { getProject, projects } = useProjects();
  const { createRFI } = useRFIs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const form = useForm<CreateRFIInput>({
    resolver: zodResolver(createRFISchema),
    defaultValues: {
      subject: '',
      to_recipient: '',
      reason_for_rfi: '',
      project_id: '',
      status: 'draft' as const,
      urgency: 'non-urgent' as const,
      company: '',
      contract_number: '',
    }
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
            // Auto-populate fields based on project
            form.setValue('company', response.data.client_company_name);
            form.setValue('contract_number', response.data.job_contract_number);
            form.setValue('urgency', response.data.default_urgency);
            
            // Auto-populate recipient with project manager or first standard recipient
            const recipient = response.data.project_manager_contact || 
                            (response.data.standard_recipients && response.data.standard_recipients[0]) || 
                            '';
            form.setValue('to_recipient', recipient);
          }
        } catch (error) {
          console.error('Error loading project details:', error);
        }
      } else {
        // Clear auto-populated fields when no project is selected
        form.setValue('company', '');
        form.setValue('contract_number', '');
        form.setValue('to_recipient', '');
        form.setValue('urgency', 'non-urgent');
      }
    };

    loadProjectDetails();
  }, [selectedProjectId, getProject, form]);

  // Auto-save effect with debugging
  useEffect(() => {
    console.log('🔄 Auto-save effect triggered with formValues:', formValues);
    if (formValues.subject || formValues.to_recipient) {
      console.log('💾 Saving to localStorage - formValues:', formValues);
      localStorage.setItem('working_rfi_draft', JSON.stringify(formValues));
      // Verify what was actually saved
      const saved = localStorage.getItem('working_rfi_draft');
      console.log('✅ Verified saved value:', saved);
    } else {
      console.log('❌ Not saving - no subject or to_recipient');
    }
  }, [formValues]);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('working_rfi_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('Loading draft:', parsed);
        form.reset(parsed);
      } catch (e) {
        console.log('Failed to load draft');
      }
    }
  }, [form]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    form.setValue('project_id', e.target.value);
  };

  const onSubmit = async (data: CreateRFIInput) => {
    console.log('RFI Form Submitted:', data);
    try {
      setIsSubmitting(true);
      setSubmitMessage('');
      const newRFI = await createRFI(data);
      setSubmitMessage(`RFI created successfully! ID: ${newRFI.id}`);
      form.reset();
      localStorage.removeItem('working_rfi_draft');
    } catch (error: any) {
      setSubmitMessage(error?.message || 'Failed to create RFI. Please try again.');
      console.error('RFI creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Working RFI Form</h2>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Project Selection */}
        <div className="mb-6">
          <label htmlFor="project_id" className="block text-sm font-medium mb-1">
            Project *
          </label>
          {projects.length === 0 ? (
            <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-gray-500">
              No projects available. 
              <a href="/projects/create-new" className="text-blue-600 underline ml-1">
                Create a project first
              </a>
            </div>
          ) : (
            <select
              id="project_id"
              {...form.register('project_id')}
              className="w-full border border-gray-300 rounded px-3 py-2"
              onChange={handleProjectChange}
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.project_name} ({project.job_contract_number})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Subject
          </label>
          <input
            id="subject"
            {...form.register('subject')}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter subject..."
          />
          {form.formState.errors.subject && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="to_recipient" className="block text-sm font-medium mb-1">
            To Recipient
          </label>
          <input
            id="to_recipient"
            {...form.register('to_recipient')}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter recipient..."
          />
          {form.formState.errors.to_recipient && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.to_recipient.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reason_for_rfi" className="block text-sm font-medium mb-1">
            Reason for RFI
          </label>
          <textarea
            id="reason_for_rfi"
            {...form.register('reason_for_rfi')}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Describe the reason for this RFI..."
            rows={3}
          />
          {form.formState.errors.reason_for_rfi && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.reason_for_rfi.message}
            </p>
          )}
        </div>

        {/* Company Field */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-1">
            Company
          </label>
          <input
            id="company"
            {...form.register('company')}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter company name..."
          />
          {form.formState.errors.company && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.company.message}
            </p>
          )}
        </div>

        {/* Contract Number Field */}
        <div>
          <label htmlFor="contract_number" className="block text-sm font-medium mb-1">
            Contract Number
          </label>
          <input
            id="contract_number"
            {...form.register('contract_number')}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter contract number..."
          />
          {form.formState.errors.contract_number && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.contract_number.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating RFI...' : 'Create RFI'}
        </button>

        {submitMessage && (
          <div className={`mt-4 p-3 rounded ${submitMessage.includes('Error') || submitMessage.includes('Failed') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'}`}>
            {submitMessage}
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <strong>Current Values:</strong>
          <pre>{JSON.stringify(formValues, null, 2)}</pre>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <strong>localStorage Debug:</strong>
          <button
            type="button"
            onClick={() => {
              const saved = localStorage.getItem('working_rfi_draft');
              alert(`localStorage: ${saved}`);
            }}
            className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded text-sm"
          >
            Check localStorage
          </button>
        </div>
      </form>
    </div>
  );
} 
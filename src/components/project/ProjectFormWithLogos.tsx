"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateProjectInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogoUpload } from '@/components/ui/LogoUpload';
import { STORAGE_BUCKETS } from '@/lib/storage';

interface ProjectFormWithLogosProps {
  initialData?: Partial<CreateProjectInput>;
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  submitLabel?: string;
}

export function ProjectFormWithLogos({ 
  initialData, 
  onSubmit, 
  submitLabel = 'Create Project' 
}: ProjectFormWithLogosProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateProjectInput>({
    project_name: initialData?.project_name || '',
    contractor_job_number: initialData?.contractor_job_number || '',
    job_contract_number: initialData?.job_contract_number || '',
    client_company_name: initialData?.client_company_name || '',
    company_id: initialData?.company_id || '',
    project_manager_contact: initialData?.project_manager_contact || '',
    client_contact_name: initialData?.client_contact_name || '',
    location: initialData?.location || '',
    project_type: initialData?.project_type || undefined,
    contract_value: initialData?.contract_value || undefined,
    start_date: initialData?.start_date || '',
    expected_completion: initialData?.expected_completion || '',
    project_description: initialData?.project_description || '',
    client_logo_url: initialData?.client_logo_url || '',
    default_urgency: initialData?.default_urgency || 'non-urgent',
    standard_recipients: initialData?.standard_recipients || [],
    project_disciplines: initialData?.project_disciplines || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('PROJECT FORM SUBMIT HANDLER CALLED');
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanedData = {
        ...formData,
      };

      console.log('🔍 Form data being submitted:', cleanedData);
      await onSubmit(cleanedData);
      // Navigation handled by parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateProjectInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Project Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="project_name">Project Name *</Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e) => handleChange('project_name', e.target.value)}
              required
              placeholder="Enter project name"
            />
          </div>

          <div>
            <Label htmlFor="contractor_job_number">Contractor Job Number *</Label>
            <Input
              id="contractor_job_number"
              value={formData.contractor_job_number}
              onChange={(e) => handleChange('contractor_job_number', e.target.value)}
              required
              placeholder="Internal job number"
            />
          </div>

          <div>
            <Label htmlFor="job_contract_number">Client Contract Number *</Label>
            <Input
              id="job_contract_number"
              value={formData.job_contract_number}
              onChange={(e) => handleChange('job_contract_number', e.target.value)}
              required
              placeholder="Client's contract number"
            />
          </div>

          <div>
            <Label htmlFor="client_company_name">Client Company Name *</Label>
            <Input
              id="client_company_name"
              value={formData.client_company_name}
              onChange={(e) => handleChange('client_company_name', e.target.value)}
              required
              placeholder="Enter client company name"
            />
          </div>

          <div>
            <Label htmlFor="project_manager_contact">Client Email *</Label>
            <Input
              id="project_manager_contact"
              type="email"
              value={formData.project_manager_contact}
              onChange={(e) => handleChange('project_manager_contact', e.target.value)}
              required
              placeholder="client.manager@example.com"
            />
          </div>

          <div>
            <Label htmlFor="client_contact_name">Client Contact Name *</Label>
            <Input
              id="client_contact_name"
              value={formData.client_contact_name}
              onChange={(e) => handleChange('client_contact_name', e.target.value)}
              required
              placeholder="Enter client contact name"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Project location"
            />
          </div>

          <div>
            <Label htmlFor="project_type">Project Type</Label>
            <Select
              value={formData.project_type || ''}
              onValueChange={(value) => handleChange('project_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mechanical">Mechanical</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="ie">Industrial Engineering</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start_date">Start Date (Optional)</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              placeholder="Select start date (optional)"
            />
          </div>

          <div>
            <Label htmlFor="expected_completion">Expected Completion (Optional)</Label>
            <Input
              id="expected_completion"
              type="date"
              value={formData.expected_completion}
              onChange={(e) => handleChange('expected_completion', e.target.value)}
              placeholder="Select completion date (optional)"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="project_description">Project Description</Label>
            <Textarea
              id="project_description"
              value={formData.project_description}
              onChange={(e) => handleChange('project_description', e.target.value)}
              placeholder="Describe the project..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logos</h3>
        <div className="grid grid-cols-1 gap-6">
          <LogoUpload
            currentLogoUrl={formData.client_logo_url}
            onLogoChange={(url) => handleChange('client_logo_url', url || '')}
            bucket="CLIENT_LOGOS"
            label="Client Logo"
            placeholder="Upload client company logo"
          />
        </div>
      </div>

      {/* RFI Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Default RFI Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="default_urgency">Default Urgency *</Label>
            <Select
              value={formData.default_urgency}
              onValueChange={(value) => handleChange('default_urgency', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="non-urgent">Non-Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="standard_recipients">Standard Recipients (Email addresses, one per line)</Label>
            <Textarea
              id="standard_recipients"
              value={formData.standard_recipients.join('\n')}
              onChange={(e) => handleChange('standard_recipients', e.target.value.split('\n').filter(email => email.trim()))}
              placeholder="Enter email addresses for default RFI recipients&#10;example1@company.com&#10;example2@company.com"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              These recipients will be included by default on all RFIs for this project
            </p>
          </div>

        </div>
      </div>

      {/* Submit Section */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
} 
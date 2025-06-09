import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SimpleRFIFormWorking } from '@/components/rfi/SimpleRFIFormWorking';

// Mock useProjects and useRFIs hooks
jest.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    projects: [
      { id: '1', project_name: 'Test Project', job_contract_number: '123', client_company_name: 'Test Client', project_manager_contact: 'pm@test.com', standard_recipients: [], project_disciplines: [], default_urgency: 'non-urgent', created_at: '', updated_at: '' }
    ],
    getProject: async () => ({ data: { client_company_name: 'Test Client', job_contract_number: '123', default_urgency: 'non-urgent', project_manager_contact: 'pm@test.com', standard_recipients: [] } })
  })
}));

jest.mock('@/hooks/useRFIs', () => ({
  useRFIs: () => ({
    createRFI: jest.fn().mockResolvedValue({ id: 'rfi-1' })
  })
}));

describe('SimpleRFIFormWorking input fields', () => {
  it('updates the Subject input field correctly', () => {
    render(<SimpleRFIFormWorking />);
    const subjectInput = screen.getByLabelText(/subject/i);
    fireEvent.change(subjectInput, { target: { value: 'Testing subject field' } });
    expect(subjectInput).toHaveValue('Testing subject field');
  });

  it('updates the Contractor Question textarea correctly', () => {
    render(<SimpleRFIFormWorking />);
    const contractorQuestion = screen.getByLabelText(/contractor question/i);
    fireEvent.change(contractorQuestion, { target: { value: 'This is a test question.' } });
    expect(contractorQuestion).toHaveValue('This is a test question.');
  });

  it('updates the Cost Impact number input correctly', () => {
    render(<SimpleRFIFormWorking />);
    const costImpactInput = screen.getByLabelText(/cost impact/i);
    fireEvent.change(costImpactInput, { target: { value: '1500.50' } });
    expect(costImpactInput).toHaveValue(1500.50);
  });
}); 
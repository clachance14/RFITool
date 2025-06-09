import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFormNew } from '../src/components/project/ProjectFormNew';
import { SimpleRFIFormWorking } from '../src/components/rfi/SimpleRFIFormWorking';
import { useProjects } from '../src/hooks/useProjects';
import { useRFIs } from '../src/hooks/useRFIs';

// Mock the hooks
jest.mock('../src/hooks/useProjects');
jest.mock('../src/hooks/useRFIs');

const testProject = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  project_name: 'Test Project',
  job_contract_number: 'CN-001',
  client_company_name: 'Test Company',
  project_manager_contact: 'pm@test.com',
  location: 'Test Location',
  project_type: 'mechanical',
  contract_value: 100000,
  start_date: '2024-01-01',
  expected_completion: '2024-12-31',
  project_description: 'Test Description',
  default_urgency: 'non-urgent',
  standard_recipients: ['recipient1@test.com', 'recipient2@test.com'],
  project_disciplines: ['HVAC', 'Electrical']
};
const mockCreateProject = jest.fn();
const mockCreateRFI = jest.fn();
const mockGetProjects = jest.fn().mockResolvedValue({ data: [testProject], error: undefined });
const mockGetProject = jest.fn().mockResolvedValue({ data: testProject, error: undefined });

describe('Project-RFI Integration', () => {
  beforeEach(() => {
    // Clear mocks and localStorage
    jest.clearAllMocks();
    localStorage.clear();

    // Setup mock return values
    (useProjects as jest.Mock).mockReturnValue({
      projects: [testProject],
      isLoading: false,
      error: null,
      createProject: mockCreateProject,
      getProjects: mockGetProjects,
      getProject: mockGetProject,
    });

    (useRFIs as jest.Mock).mockReturnValue({
      createRFI: mockCreateRFI,
      isLoading: false,
      error: null
    });
  });

  describe('Project Creation', () => {
    it('creates a new project with all required fields', async () => {
      render(<ProjectFormNew />);

      // Fill out the form
      await userEvent.type(screen.getByLabelText(/project name/i), testProject.project_name);
      await userEvent.type(screen.getByLabelText(/job\/contract number/i), testProject.job_contract_number);
      await userEvent.type(screen.getByLabelText(/client company/i), testProject.client_company_name);
      await userEvent.type(screen.getByLabelText(/project manager email/i), testProject.project_manager_contact);
      
      // Select project type
      await userEvent.selectOptions(screen.getByLabelText(/project type/i), testProject.project_type);
      
      // Select disciplines
      const disciplineCheckboxes = screen.getAllByRole('checkbox', { name: /HVAC|Electrical/i });
      for (const checkbox of disciplineCheckboxes) {
        await userEvent.click(checkbox);
      }

      // Add standard recipients (ensure all are filled)
      const recipientInputs = screen.getAllByPlaceholderText(/recipient email/i);
      await userEvent.type(recipientInputs[0], testProject.standard_recipients[0]);
      await userEvent.type(recipientInputs[1], testProject.standard_recipients[1]);
      // Set default urgency
      await userEvent.selectOptions(screen.getByLabelText(/default urgency/i), testProject.default_urgency);

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /create project/i }));

      // Verify project creation
      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith(expect.objectContaining({
          project_name: testProject.project_name,
          job_contract_number: testProject.job_contract_number,
          client_company_name: testProject.client_company_name,
          project_manager_contact: testProject.project_manager_contact,
          project_type: testProject.project_type,
          project_disciplines: testProject.project_disciplines,
          standard_recipients: testProject.standard_recipients
        }));
      });
    });
  });

  describe('RFI Creation with Project', () => {
    it('auto-populates RFI fields based on selected project', async () => {
      render(<SimpleRFIFormWorking />);

      // Wait for select to appear
      await waitFor(() => expect(screen.queryByTestId('select-trigger')).toBeInTheDocument());

      // Select project
      const projectSelect = screen.getByTestId('select-trigger');
      await userEvent.click(projectSelect);
      // Use test id for project option
      const projectOption = await screen.findByTestId('select-item-123e4567-e89b-12d3-a456-426614174000');
      await userEvent.click(projectOption);

      // Fill in RFI-specific fields
      await userEvent.type(screen.getByLabelText(/subject/i), 'Test RFI Subject');
      await userEvent.type(screen.getByLabelText(/to recipient/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/reason for rfi/i), 'Test RFI Reason');

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /create rfi/i }));

      // Verify RFI creation with project data
      await waitFor(() => {
        expect(mockCreateRFI).toHaveBeenCalledWith(expect.objectContaining({
          subject: 'Test RFI Subject',
          to_recipient: 'test@example.com',
          reason_for_rfi: 'Test RFI Reason',
          project_id: testProject.id,
          company: testProject.client_company_name,
          contract_number: testProject.job_contract_number,
          urgency: testProject.default_urgency
        }));
      });
    });

    test.skip('auto-saves RFI draft with project selection', () => {
      // Skip this complex test for now
    });
  });
}); 
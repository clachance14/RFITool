import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimpleRFIFormWorking } from '@/components/rfi/SimpleRFIFormWorking';
import { useProjects } from '@/hooks/useProjects';

// Mock the useProjects hook
jest.mock('@/hooks/useProjects');

describe('Working Form Test', () => {
  const mockProjects = [
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' },
  ];

  const mockProjectDetails = {
    id: '1',
    project_name: 'Project 1',
    job_contract_number: 'CN-001',
    client_company_name: 'Test Company',
    default_urgency: 'urgent',
  };

  const mockGetProjects = jest.fn();
  const mockGetProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProjects as jest.Mock).mockReturnValue({
      getProjects: mockGetProjects,
      getProject: mockGetProject,
    });
    mockGetProjects.mockResolvedValue({ data: mockProjects, error: undefined });
    mockGetProject.mockResolvedValue({ data: mockProjectDetails, error: undefined });
    localStorage.clear();
  });

  test('form input updates when typing', async () => {
    render(<SimpleRFIFormWorking />);
    
    const subjectInput = screen.getByLabelText('Subject');
    
    await userEvent.type(subjectInput, 'Test');
    
    expect(subjectInput).toHaveValue('Test');
    
    // Also check if it appears in the Current Values display
    expect(screen.getByText(/"subject": "Test"/)).toBeInTheDocument();
  });

  test('auto-saves to localStorage', async () => {
    render(<SimpleRFIFormWorking />);
    const subjectInput = screen.getByLabelText('Subject');
    await userEvent.type(subjectInput, 'Auto Save Test');
    // Wait for the correct value to appear in localStorage
    await waitFor(() => {
      const saved = localStorage.getItem('working_rfi_draft');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved || '{}');
      expect(parsed.subject).toBe('Auto Save Test');
    }, { timeout: 1000 });
  });

  test('auto-populates fields when project is selected', async () => {
    render(<SimpleRFIFormWorking />);

    // Wait for project select to load
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Select project
    const projectSelect = screen.getByTestId('project-select');
    await userEvent.click(projectSelect);
    const projectOption = await screen.findByText('Project 1');
    await userEvent.click(projectOption);

    // Wait for auto-population
    await waitFor(() => {
      expect(screen.getByLabelText('Company')).toHaveValue('Test Company');
      expect(screen.getByLabelText('Contract Number')).toHaveValue('CN-001');
    });

    // Verify project ID is set
    const formValuesText = screen.getByText(/"project_id": "1"/).textContent;
    const formValues = formValuesText ? JSON.parse(formValuesText) : {};
    expect(formValues.project_id).toBe('1');
  });

  test('shows error when submitting without project selection', async () => {
    render(<SimpleRFIFormWorking />);

    // Fill in other required fields
    await userEvent.type(screen.getByLabelText('Subject'), 'Test Subject');
    await userEvent.type(screen.getByLabelText('To Recipient'), 'Test Recipient');
    await userEvent.type(screen.getByLabelText('Reason for RFI'), 'Test Reason');

    // Try to submit
    await userEvent.click(screen.getByText('Create RFI'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Project selection is required')).toBeInTheDocument();
    });
  });
}); 
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RFIForm } from '@/components/rfi/RFIForm';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';

// Mock the hooks
jest.mock('@/hooks/useProjects');
jest.mock('@/hooks/useRFIs');

// Mock project data
const mockProjects = [
  { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test Project', contract_number: 'TEST-001' },
];

// Mock RFI data
const mockCreatedRFI = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  rfi_number: 'RFI-001',
  project_id: '123e4567-e89b-12d3-a456-426614174000',
  subject: 'Test RFI',
  to_recipient: 'Test Recipient',
  company: 'Test Company',
  contract_number: 'TEST-001',
  revision: '1',
  date_created: '2024-03-20',
  work_impact: 'None',
  cost_impact: 'None',
  schedule_impact: 'None',
  discipline: 'Test',
  system: 'Test',
  sub_system: 'Test',
  schedule_id: 'TEST-001',
  reason_for_rfi: 'Test',
  test_package: 'Test',
  contractor_proposed_solution: 'Test',
  associated_reference_documents: 'Test',
  requested_by: 'Test',
  reviewed_by: 'Test',
  urgency: 'non-urgent' as const,
  status: 'draft' as const,
};

describe('RFI Creation Flow', () => {
  const mockGetProjects = jest.fn();
  const mockCreateRFI = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementations
    (useProjects as jest.Mock).mockReturnValue({
      getProjects: mockGetProjects,
      loading: false,
      error: null,
    });

    (useRFIs as jest.Mock).mockReturnValue({
      createRFI: mockCreateRFI,
      loading: false,
      error: null,
    });

    // Mock successful project fetch
    mockGetProjects.mockResolvedValue({
      data: mockProjects,
      error: undefined,
    });
  });

  it('completes the full RFI creation flow', async () => {
    // Mock successful RFI creation
    mockCreateRFI.mockResolvedValue({
      success: true,
      data: mockCreatedRFI,
    });

    render(<RFIForm />);

    // Debug: Log initial render state
    screen.debug();

    // Fill in form fields
    await userEvent.type(screen.getByLabelText(/subject/i), 'Test RFI');
    await userEvent.type(screen.getByLabelText(/to recipient/i), 'Test Recipient');
    await userEvent.type(screen.getByLabelText(/company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/contract number/i), 'TEST-001');

    // Debug: Log state before project selection
    console.log('State before project selection:', {
      form: document.querySelector('form'),
      projectSelect: screen.getByTestId('project-select'),
    });

    // Select project
    const projectSelect = screen.getByTestId('project-select');
    await userEvent.click(projectSelect);
    
    // Debug: Log state after clicking project select
    console.log('State after clicking project select:', {
      projectSelect,
      projectOptions: screen.getAllByRole('option'),
    });

    // Select project option
    const projectOption = screen.getByText('Test Project');
    await userEvent.click(projectOption);

    // Debug: Log state after project selection
    console.log('State after project selection:', {
      selectedProject: screen.getByText('Test Project'),
      projectId: screen.getByTestId('project-select').getAttribute('value'),
    });

    // Fill in remaining fields
    await userEvent.type(screen.getByLabelText(/revision/i), '1');
    await userEvent.type(screen.getByLabelText(/date created/i), '2024-03-20');
    await userEvent.type(screen.getByLabelText(/work impact/i), 'None');
    await userEvent.type(screen.getByLabelText(/cost impact/i), 'None');
    await userEvent.type(screen.getByLabelText(/schedule impact/i), 'None');
    await userEvent.type(screen.getByLabelText(/discipline/i), 'Test');
    await userEvent.type(screen.getByLabelText(/system/i), 'Test');
    await userEvent.type(screen.getByLabelText(/sub system/i), 'Test');
    await userEvent.type(screen.getByLabelText(/schedule id/i), 'TEST-001');
    await userEvent.type(screen.getByLabelText(/reason for rfi/i), 'Test');
    await userEvent.type(screen.getByLabelText(/test package/i), 'Test');
    await userEvent.type(screen.getByLabelText(/contractor proposed solution/i), 'Test');
    await userEvent.type(screen.getByLabelText(/associated reference documents/i), 'Test');
    await userEvent.type(screen.getByLabelText(/requested by/i), 'Test');
    await userEvent.type(screen.getByLabelText(/reviewed by/i), 'Test');

    // Select urgency and status
    const urgencySelect = screen.getByLabelText(/urgency/i);
    await userEvent.click(urgencySelect);
    await userEvent.click(screen.getByText('Non-Urgent'));

    const statusSelect = screen.getByLabelText(/status/i);
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByText('Draft'));

    // Debug: Log form submission state
    console.log('Form submission state:', {
      form: document.querySelector('form'),
      formData: new FormData(document.querySelector('form') as HTMLFormElement),
    });

    // Submit form
    await userEvent.click(screen.getByText('Create RFI'));

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockCreateRFI).toHaveBeenCalled();
    });

    // Check for success message
    expect(screen.getByText(/RFI RFI-001 created successfully!/i)).toBeInTheDocument();
  });

  it('handles form validation errors', async () => {
    render(<RFIForm />);

    // Submit form without filling required fields
    await userEvent.click(screen.getByText('Create RFI'));

    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      expect(screen.getByText(/to recipient is required/i)).toBeInTheDocument();
      expect(screen.getByText(/project is required/i)).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    // Mock API error
    mockCreateRFI.mockRejectedValue(new Error('Failed to create RFI'));

    render(<RFIForm />);

    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/subject/i), 'Test RFI');
    await userEvent.type(screen.getByLabelText(/to recipient/i), 'Test Recipient');

    // Select project
    const projectSelect = screen.getByTestId('project-select');
    await userEvent.click(projectSelect);
    await userEvent.click(screen.getByText('Test Project'));

    // Submit form
    await userEvent.click(screen.getByText('Create RFI'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to create rfi/i)).toBeInTheDocument();
    });
  });

  it('handles invalid project ID', async () => {
    // Mock project fetch error
    mockGetProjects.mockRejectedValue(new Error('Failed to load projects'));

    render(<RFIForm />);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to load projects/i)).toBeInTheDocument();
    });
  });
}); 
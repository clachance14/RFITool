import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
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

describe('RFI Creation Integration', () => {
  const mockGetProjects = jest.fn();
  const mockCreateRFI = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProjects as jest.Mock).mockReturnValue({
      getProjects: mockGetProjects,
    });
    (useRFIs as jest.Mock).mockReturnValue({
      createRFI: mockCreateRFI,
    });
    mockGetProjects.mockResolvedValue({ data: mockProjects, error: undefined });
    localStorage.clear();
    (localStorage.getItem as jest.Mock).mockClear();
    (localStorage.setItem as jest.Mock).mockClear();
    (localStorage.removeItem as jest.Mock).mockClear();
    (localStorage.clear as jest.Mock).mockClear();
  });

  it('creates a new RFI with project selection', async () => {
    mockCreateRFI.mockResolvedValue({
      success: true,
      data: { id: 'rfi-001' },
      error: undefined,
    });

    await act(async () => {
      render(<RFIForm />);
    });

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Fill in form fields
    await userEvent.type(screen.getByLabelText(/subject/i), 'Test RFI');
    await userEvent.type(screen.getByLabelText(/to recipient/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/contract number/i), 'CN-001');

    // Select project
    const projectSelect = screen.getByTestId('project-select');
    fireEvent.pointerDown(projectSelect);
    const projectOption = await screen.findByText('Test Project', {}, { container: document.body });
    await userEvent.click(projectOption);

    // Submit form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /create rfi/i }));
    });

    // Check loading state
    expect(await screen.findByText(/creating rfi/i)).toBeInTheDocument();

    // Wait for success message
    expect(await screen.findByText(/rfi rfi-001 created successfully/i)).toBeInTheDocument();

    // Verify API calls
    expect(mockGetProjects).toHaveBeenCalled();
    expect(mockCreateRFI).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Test RFI',
      to_recipient: 'John Doe',
      company: 'Test Company',
      contract_number: 'CN-001',
      project_id: '123e4567-e89b-12d3-a456-426614174000',
    }));
  });

  it('handles validation errors', async () => {
    await act(async () => {
      render(<RFIForm />);
    });

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Submit form without filling required fields
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /create rfi/i }));
    });

    // Check validation errors
    expect(await screen.findByText(/subject is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/to recipient is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/company is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/contract number is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/project is required/i)).toBeInTheDocument();

    // Verify no API calls were made
    expect(mockCreateRFI).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    mockCreateRFI.mockRejectedValue(new Error('Connection problem'));

    await act(async () => {
      render(<RFIForm />);
    });

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Fill in form fields
    await userEvent.type(screen.getByLabelText(/subject/i), 'Test RFI');
    await userEvent.type(screen.getByLabelText(/to recipient/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/contract number/i), 'CN-001');

    // Select project
    const projectSelect = screen.getByTestId('project-select');
    fireEvent.pointerDown(projectSelect);
    const projectOption = await screen.findByText('Test Project', {}, { container: document.body });
    await userEvent.click(projectOption);

    // Submit form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /create rfi/i }));
    });

    // Check error message
    expect(await screen.findByText(/connection problem/i)).toBeInTheDocument();
  });
}); 
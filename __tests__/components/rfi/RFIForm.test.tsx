import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RFIForm } from '@/components/rfi/RFIForm';
import { useRouter } from 'next/navigation';
import { createRFISchema } from '@/lib/validations';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { jest } from '@jest/globals';
import type { CreateRFIInput } from '@/lib/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock the hooks
jest.mock('@/hooks/useProjects');
jest.mock('@/hooks/useRFIs');

// Mock heavy components
jest.mock('@/components/project/ProjectSelect', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-project-select" />
}));

describe('RFIForm Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockProjects = [
    { id: 'test-project-id', name: 'Test Project', contract_number: 'TEST-001' },
  ];

  const mockGetProjects = jest.fn();
  const mockCreateRFI = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (localStorage.getItem as jest.Mock).mockClear();
    (localStorage.setItem as jest.Mock).mockClear();
    (localStorage.removeItem as jest.Mock).mockClear();
    (localStorage.clear as jest.Mock).mockClear();
    jest.clearAllMocks();
    (useProjects as jest.Mock).mockReturnValue({
      getProjects: mockGetProjects,
    });
    (useRFIs as jest.Mock).mockReturnValue({
      createRFI: mockCreateRFI,
    });
    mockGetProjects.mockResolvedValue({ data: mockProjects, error: undefined });
    localStorage.clear();
  });

  describe('Form Rendering', () => {
    it('renders all form sections and fields correctly', () => {
      render(<RFIForm />);

      // Check section headers
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Project Details')).toBeInTheDocument();
      expect(screen.getByText('Impact Assessment')).toBeInTheDocument();
      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('RFI Details')).toBeInTheDocument();
      expect(screen.getByText('References')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Check essential fields
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to recipient/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contract number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reason for rfi/i)).toBeInTheDocument();
    });

    it('renders form action buttons', () => {
      render(<RFIForm />);

      expect(screen.getByRole('button', { name: /reset form/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create rfi/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
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
      expect(await screen.findByText(/reason for rfi is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/invalid project id/i)).toBeInTheDocument();
      // Optional fields should not show required errors
      expect(screen.queryByText(/company is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/contract number is required/i)).not.toBeInTheDocument();
    });

    it('validates field length constraints', async () => {
      await act(async () => {
        render(<RFIForm />);
      });

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      });

      // Type a long subject
      const subjectInput = screen.getByTestId('subject-input') as HTMLInputElement;
      await userEvent.type(subjectInput, 'a'.repeat(501));

      // Submit form
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /create rfi/i }));
      });

      // Check validation error
      expect(await screen.findByText(/subject too long/i)).toBeInTheDocument();
    }, 10000);
  });

  describe('Auto-save Functionality', () => {
    it('saves form data to localStorage on field change', async () => {
      // Arrange
      render(<RFIForm />);
      const subjectInput = await screen.findByTestId('subject-input') as HTMLInputElement;
      
      // Act & Assert - Step 1: Initial State
      expect(subjectInput).toHaveValue('');
      expect(localStorage.getItem('rfi_form_draft')).toBeNull();
      
      // Act - Step 2: Type in input
      await userEvent.type(subjectInput, 'Test Subject');
      expect(subjectInput).toHaveValue('Test Subject');
      
      // Assert - Step 3: Check localStorage
      await waitFor(() => {
        const saved = localStorage.getItem('rfi_form_draft');
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved || '{}');
        expect(parsed.subject).toBe('Test Subject');
      }, { timeout: 3000 });
    });

    it('loads saved draft on component mount', async () => {
      // Set up saved draft
      localStorage.setItem('rfi_form_draft', JSON.stringify({
        subject: 'Saved Subject',
        reason_for_rfi: 'Saved Reason',
      }));

      await act(async () => {
        render(<RFIForm />);
      });

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      });

      // Check if saved values are loaded
      expect(await screen.findByDisplayValue('Saved Subject')).toBeInTheDocument();
      expect(await screen.findByDisplayValue('Saved Reason')).toBeInTheDocument();
    });
  });

  describe('Save as Draft', () => {
    it('saves current form state as draft', async () => {
      render(<RFIForm />);

      const subjectInput = screen.getByTestId('subject-input') as HTMLInputElement;
      await userEvent.type(subjectInput, 'Draft Subject');

      const saveDraftButton = screen.getByRole('button', { name: 'Save Draft' });
      await userEvent.click(saveDraftButton);

      expect(await screen.findByText(/draft saved successfully/i)).toBeInTheDocument();
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form data correctly', async () => {
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
      expect(await screen.findByText('Creating RFI...')).toBeInTheDocument();

      // Wait for success message
      expect(await screen.findByText(/rfi rfi-001 created successfully/i)).toBeInTheDocument();

      // Verify API calls
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockCreateRFI).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Test RFI',
        to_recipient: 'John Doe',
        company: 'Test Company',
        contract_number: 'CN-001',
        project_id: 'test-project-id',
      }));
    });

    it('handles submission errors correctly', async () => {
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
      expect(await screen.findByText('Connection problem. Please check your internet and try again.')).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('shows confirmation dialog before resetting', async () => {
      render(<RFIForm />);

      // Fill some data
      await userEvent.type(screen.getByLabelText(/subject/i), 'Test Subject');

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset form/i });
      await userEvent.click(resetButton);

      // Check confirmation dialog
      expect(screen.getByRole('button', { name: /confirm reset/i })).toBeInTheDocument();

      // Confirm reset
      await userEvent.click(screen.getByRole('button', { name: /confirm reset/i }));

      // Check if form is cleared
      expect(screen.getByLabelText(/subject/i)).toHaveValue('');
    });

    it('clears localStorage on reset', async () => {
      await act(async () => {
        render(<RFIForm />);
      });

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      });

      // Click reset button
      await userEvent.click(screen.getByRole('button', { name: /reset/i }));

      // Confirm reset
      await userEvent.click(screen.getByRole('button', { name: /confirm reset/i }));

      // Verify localStorage was cleared
      expect(localStorage.removeItem).toHaveBeenCalledWith('rfi_form_draft');
    });
  });

  describe('Project Selection', () => {
    it('integrates with ProjectSelect component', async () => {
      await act(async () => {
        render(<RFIForm />);
      });

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      });

      // Select project
      const projectSelect = screen.getByTestId('project-select');
      fireEvent.pointerDown(projectSelect);
      const projectOption = await screen.findByText('Test Project', {}, { container: document.body });
      await userEvent.click(projectOption);

      // Verify selection
      expect(screen.getByTestId('project-select').querySelector('[role="combobox"]')).toHaveTextContent('Test Project');
    });
  });
});

describe('RFIForm - Form State Updates', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('input value updates when typing', async () => {
    // Arrange
    render(<RFIForm />);
    
    // Act
    const input = await screen.findByTestId('subject-input');
    await userEvent.type(input, 'Test');
    
    // Assert
    expect(input).toHaveValue('Test');
  });

  test('saves form data to localStorage on field change', async () => {
    // Arrange
    render(<RFIForm />);
    const input = await screen.findByTestId('subject-input');
    
    // Act
    await userEvent.type(input, 'Test Subject');
    
    // Assert
    const saved = localStorage.getItem('rfi_form_draft');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved || '{}');
    expect(parsed.subject).toBe('Test Subject');
  });
}); 
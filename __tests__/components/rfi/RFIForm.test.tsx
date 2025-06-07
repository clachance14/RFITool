import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RFIForm } from '@/components/rfi/RFIForm';
import { useRouter } from 'next/navigation';
import { createRFISchema } from '@/lib/validations';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Add this at the top of the file after imports
jest.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    getProjects: jest.fn().mockResolvedValue({
      data: [
        { id: 'test-project-id', name: 'Test Project' }
      ],
      error: undefined,
    }),
    loading: false,
    error: null,
  })
}));

describe('RFIForm Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorage.clear();
    jest.clearAllMocks();
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
      expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create rfi/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', async () => {
      render(<RFIForm />);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create rfi/i });
      await userEvent.click(submitButton);

      // Check for validation messages
      expect(await screen.findByText(/subject is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/reason for rfi is required/i)).toBeInTheDocument();
    });

    it('validates field length constraints', async () => {
      render(<RFIForm />);

      const subjectInput = screen.getByLabelText(/subject/i);
      await userEvent.type(subjectInput, 'a'.repeat(501)); // Exceed max length

      const submitButton = screen.getByRole('button', { name: /create rfi/i });
      await userEvent.click(submitButton);

      expect(await screen.findByText(/subject too long/i)).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('saves form data to localStorage on field change', async () => {
      // Spy on localStorage.setItem
      const setItemSpy = jest.spyOn(window.localStorage, 'setItem');
      render(<RFIForm />);

      const subjectInput = screen.getByLabelText(/subject/i);
      await userEvent.type(subjectInput, 'Test Subject');

      // Wait for auto-save
      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalled();
      });

      // Check if data was saved correctly
      const savedData = JSON.parse(window.localStorage.getItem('rfi_form_draft') || '{}');
      expect(savedData.subject).toBe('Test Subject');
    });

    it('loads saved draft on component mount', () => {
      const savedDraft = {
        subject: 'Saved Subject',
        reason_for_rfi: 'Saved Reason',
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem('rfi_form_draft', JSON.stringify(savedDraft));

      render(<RFIForm />);

      expect(screen.getByDisplayValue('Saved Subject')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Saved Reason')).toBeInTheDocument();
    });
  });

  describe('Save as Draft', () => {
    it('saves current form state as draft', async () => {
      render(<RFIForm />);

      const subjectInput = screen.getByLabelText(/subject/i);
      await userEvent.type(subjectInput, 'Draft Subject');

      const saveDraftButton = screen.getByRole('button', { name: /save as draft/i });
      await userEvent.click(saveDraftButton);

      expect(await screen.findByText(/draft saved successfully/i)).toBeInTheDocument();
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form data correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '123',
          rfi_number: 'RFI-001',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      render(<RFIForm />);

      // Fill required fields
      await userEvent.type(screen.getByLabelText(/subject/i), 'Test Subject');
      await userEvent.type(screen.getByLabelText(/reason for rfi/i), 'Test Reason');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create rfi/i });
      await userEvent.click(submitButton);

      // Check loading state
      expect(screen.getByText(/creating rfi/i)).toBeInTheDocument();

      // Wait for success message
      expect(await screen.findByText(/rfi rfi-001 created successfully/i)).toBeInTheDocument();

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith('/api/rfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });
    });

    it('handles submission errors correctly', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RFIForm />);

      // Fill required fields
      await userEvent.type(screen.getByLabelText(/subject/i), 'Test Subject');
      await userEvent.type(screen.getByLabelText(/reason for rfi/i), 'Test Reason');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create rfi/i });
      await userEvent.click(submitButton);

      // Check error message
      expect(await screen.findByText(/connection problem/i)).toBeInTheDocument();
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
      render(<RFIForm />);

      // Fill some data
      await userEvent.type(screen.getByLabelText(/subject/i), 'Test Subject');

      // Reset form
      const resetButton = screen.getByRole('button', { name: /reset form/i });
      await userEvent.click(resetButton);
      await userEvent.click(screen.getByRole('button', { name: /confirm reset/i }));

      expect(localStorage.removeItem).toHaveBeenCalledWith('rfi_form_draft');
    });
  });

  describe('Project Selection', () => {
    it('integrates with ProjectSelect component', async () => {
      render(<RFIForm />);
      screen.debug();

      // Check if ProjectSelect is rendered
      expect(screen.getByTestId('project-select')).toBeInTheDocument();

      // Simulate project selection
      const projectSelect = screen.getByTestId('project-select');
      await userEvent.click(projectSelect);
      await userEvent.click(screen.getByText('Test Project'));

      // Verify selection
      expect(projectSelect).toHaveValue('test-project-id');
    });
  });
}); 
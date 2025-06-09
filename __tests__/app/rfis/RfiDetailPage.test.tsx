import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RFIDetailPage from '@/app/rfis/[id]/page';
import type { RFI, Project, RFIStatus, RFIPriority } from '@/lib/types';

// Mock next/navigation
const mockPush = jest.fn();
const mockParams = { id: 'test-rfi-id' };

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the RfiDetailView component to isolate the page logic
jest.mock('@/components/rfi/RfiDetailView', () => ({
  RfiDetailView: ({ rfi }: { rfi: RFI }) => (
    <div data-testid="rfi-detail-view">
      <h1>{rfi.rfi_number}</h1>
      <h2>{rfi.subject}</h2>
      <p>{rfi.description}</p>
      <span data-testid="status">{rfi.status}</span>
      <span data-testid="priority">{rfi.priority}</span>
    </div>
  ),
}));

// Sample test data
const mockRFI: RFI = {
  id: 'test-rfi-id',
  rfi_number: 'RFI-001',
  project_id: 'project-1',
  subject: 'Test RFI Subject',
  description: 'This is a test RFI description',
  status: 'sent' as RFIStatus,
  priority: 'high' as RFIPriority,
  assigned_to: 'John Doe',
  due_date: '2024-12-31',
  created_by: 'user1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  response: null,
  response_date: null,
  attachments: [],
};

const mockProject: Project = {
  id: 'project-1',
  project_name: 'Test Project',
  job_contract_number: 'CONTRACT-001',
  client_company_name: 'Test Client',
  project_manager_contact: 'pm@test.com',
  default_urgency: 'non-urgent',
  standard_recipients: [],
  project_disciplines: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock useRFIs hook
const mockGetRFIById = jest.fn();
const mockUseRFIs = {
  getRFIById: mockGetRFIById,
  loading: false,
  error: null,
};

jest.mock('@/hooks/useRFIs', () => ({
  useRFIs: () => mockUseRFIs,
}));

// Mock useProjects hook
jest.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    projects: [mockProject],
    loading: false,
    error: null,
  }),
}));

describe('RFI Detail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state before each test
    mockUseRFIs.loading = false;
    mockUseRFIs.error = null;
  });

  describe('Success Case', () => {
    it('should render RFI details when data is successfully loaded', async () => {
      // Arrange
      mockGetRFIById.mockResolvedValue(mockRFI);

      // Act
      render(<RFIDetailPage />);

      // Assert - Wait for loading to complete and check that RFI details are displayed
      await waitFor(() => {
        expect(screen.getByTestId('rfi-detail-view')).toBeInTheDocument();
      });

      expect(screen.getByText('RFI-001')).toBeInTheDocument();
      expect(screen.getByText('Test RFI Subject')).toBeInTheDocument();
      expect(screen.getByText('This is a test RFI description')).toBeInTheDocument();
      expect(screen.getByTestId('status')).toHaveTextContent('sent');
      expect(screen.getByTestId('priority')).toHaveTextContent('high');

      // Verify that getRFIById was called with the correct ID
      expect(mockGetRFIById).toHaveBeenCalledWith('test-rfi-id');
      expect(mockGetRFIById).toHaveBeenCalledTimes(1);
    });

    it('should handle RFI with response data', async () => {
      // Arrange
      const rfiWithResponse: RFI = {
        ...mockRFI,
        response: 'This is the response to the RFI',
        response_date: '2024-01-10T00:00:00Z',
        status: 'responded',
      };
      mockGetRFIById.mockResolvedValue(rfiWithResponse);

      // Act
      render(<RFIDetailPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('rfi-detail-view')).toBeInTheDocument();
      });

      expect(screen.getByTestId('status')).toHaveTextContent('responded');
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when data is being fetched', () => {
      // Arrange
      mockUseRFIs.loading = true;
      mockGetRFIById.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      render(<RFIDetailPage />);

      // Assert
      expect(screen.getByText('Loading RFI details...')).toBeInTheDocument();
      
      // Check that the loading spinner is visible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Verify RFI details are not shown during loading
      expect(screen.queryByTestId('rfi-detail-view')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when RFI is not found', async () => {
      // Arrange
      const errorMessage = 'RFI not found';
      mockGetRFIById.mockRejectedValue(new Error(errorMessage));

      // Act
      render(<RFIDetailPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('RFI Not Found')).toBeInTheDocument();
      });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument(); // Error icon
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      
      // Verify RFI details are not shown during error state
      expect(screen.queryByTestId('rfi-detail-view')).not.toBeInTheDocument();
    });

    it('should display error message when useRFIs hook returns an error', () => {
      // Arrange
      const errorMessage = 'Failed to fetch RFI data';
      Object.assign(mockUseRFIs, { error: errorMessage, loading: false });

      // Act
      render(<RFIDetailPage />);

      // Assert
      expect(screen.getByText('RFI Not Found')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('should handle generic fetch errors', async () => {
      // Arrange
      mockGetRFIById.mockRejectedValue(new Error('Network error'));

      // Act
      render(<RFIDetailPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('RFI Not Found')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      mockGetRFIById.mockRejectedValue('String error');

      // Act
      render(<RFIDetailPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('RFI Not Found')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to fetch RFI')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing RFI ID in URL params', async () => {
      // Arrange
      mockParams.id = '';
      mockGetRFIById.mockResolvedValue(null);

      // Act
      render(<RFIDetailPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No RFI data available.')).toBeInTheDocument();
      });

      // getRFIById should not be called if there's no ID
      expect(mockGetRFIById).not.toHaveBeenCalled();
    });

    it('should handle null RFI data', async () => {
      // Arrange
      mockParams.id = 'test-rfi-id';
      mockGetRFIById.mockResolvedValue(null);

      // Act
      render(<RFIDetailPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No RFI data available.')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should call getRFIById when component mounts with valid ID', () => {
      // Arrange
      mockParams.id = 'valid-rfi-id';
      mockGetRFIById.mockResolvedValue(mockRFI);

      // Act
      render(<RFIDetailPage />);

      // Assert
      expect(mockGetRFIById).toHaveBeenCalledWith('valid-rfi-id');
    });

    it('should re-fetch data when RFI ID changes', async () => {
      // This test simulates what would happen if the route changes
      // In a real scenario, this would be handled by Next.js routing
      
      // Arrange
      mockGetRFIById.mockResolvedValue(mockRFI);
      const { rerender } = render(<RFIDetailPage />);

      // Act - Simulate route change by changing the mocked ID
      mockParams.id = 'new-rfi-id';
      rerender(<RFIDetailPage />);

      // Assert
      await waitFor(() => {
        expect(mockGetRFIById).toHaveBeenCalledWith('new-rfi-id');
      });
    });
  });
}); 
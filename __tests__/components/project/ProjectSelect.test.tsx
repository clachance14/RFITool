import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import ProjectSelect from '@/components/project/ProjectSelect';
import { useProjects } from '@/hooks/useProjects';

// Mock the useProjects hook
jest.mock('@/hooks/useProjects');

describe('ProjectSelect Component', () => {
  const mockProjects = [
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' },
  ];

  const mockGetProjects = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProjects as jest.Mock).mockReturnValue({
      getProjects: mockGetProjects,
    });
  });

  it('renders loading state initially', () => {
    mockGetProjects.mockResolvedValue({ data: mockProjects, error: undefined });
    
    render(
      <ProjectSelect
        value=""
        onChange={() => {}}
        data-testid="project-select"
      />
    );

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });

  it('renders projects after loading', async () => {
    mockGetProjects.mockResolvedValue({ data: mockProjects, error: undefined });
    
    await act(async () => {
      render(
        <ProjectSelect
          value=""
          onChange={() => {}}
          data-testid="project-select"
        />
      );
    });

    // Wait for loading to complete and projects to be rendered
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Verify projects are rendered
    expect(screen.getByTestId('select-item-1')).toHaveTextContent('Project 1');
    expect(screen.getByTestId('select-item-2')).toHaveTextContent('Project 2');
  });

  it('handles error state', async () => {
    mockGetProjects.mockRejectedValue(new Error('Failed to load projects'));
    
    await act(async () => {
      render(
        <ProjectSelect
          value=""
          onChange={() => {}}
          data-testid="project-select"
        />
      );
    });

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
    });

    // Verify retry button is present
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls onChange when project is selected', async () => {
    mockGetProjects.mockResolvedValue({ data: mockProjects, error: undefined });
    const handleChange = jest.fn();
    
    await act(async () => {
      render(
        <ProjectSelect
          value=""
          onChange={handleChange}
          data-testid="project-select"
        />
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Step 1: Click the trigger to open dropdown
    await userEvent.click(screen.getByTestId('select-trigger'));

    // Step 2: Click the specific option
    await userEvent.click(screen.getByTestId('select-item-1'));

    // Verify onChange was called with correct value
    expect(handleChange).toHaveBeenCalledWith('1');
  });

  it('shows no projects message when empty', async () => {
    mockGetProjects.mockResolvedValue({ data: [], error: undefined });
    
    await act(async () => {
      render(
        <ProjectSelect
          value=""
          onChange={() => {}}
          data-testid="project-select"
        />
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
    });

    // Verify no projects message
    expect(screen.getByText('No projects available')).toBeInTheDocument();
  });
}); 
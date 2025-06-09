import React from 'react';
import { render, screen, waitFor, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectForm } from '@/components/project/ProjectForm';
import { SimpleRFIFormWorking } from '@/components/rfi/SimpleRFIFormWorking';
import { useProjects } from '@/hooks/useProjects';
import { Project, CreateRFIInput, ProjectFormData } from '@/lib/types';

// Mock the hooks
jest.mock('@/hooks/useProjects');

// Create manual mock for RFI Context since SimpleRFIFormWorking uses it
const mockCreateRFI = jest.fn();
const mockGetNextRFINumber = jest.fn();

jest.mock('@/contexts/RFIContext', () => ({
  useRFIs: () => ({
    rfis: [],
    loading: false,
    error: null,
    createRFI: mockCreateRFI,
    getNextRFINumber: mockGetNextRFINumber,
  }),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

// Test data
const testProjectData: ProjectFormData = {
  name: 'End-to-End Test Project',
  client_name: 'E2E Test Company',
  job_number: 'JOB-E2E-001',
  contract_number: 'CN-E2E-001',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  status: 'active',
  description: 'A comprehensive test project for end-to-end testing',
};

const createdProject: Project = {
  id: 'proj-e2e-123',
  project_name: testProjectData.name,
  job_contract_number: testProjectData.job_number,
  client_company_name: testProjectData.client_name,
  project_manager_contact: 'pm@e2etest.com',
  location: 'Test Location',
  project_type: 'mechanical',
  contract_value: 500000,
  start_date: testProjectData.start_date,
  expected_completion: testProjectData.end_date,
  project_description: testProjectData.description,
  default_urgency: 'non-urgent',
  standard_recipients: ['recipient@e2etest.com'],
  project_disciplines: ['HVAC', 'Electrical'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const testRFIData: Partial<CreateRFIInput> = {
  subject: 'E2E Test RFI Subject',
  reason_for_rfi: 'Design clarification',
  contractor_question: 'Need clarification on HVAC specifications for the test project',
  urgency: 'non-urgent',
  status: 'draft',
};

describe('Full Workflow Integration Test', () => {
  // Mock functions
  const mockCreateProject = jest.fn();
  const mockGetProject = jest.fn();

  // State management for the mocked hooks
  let mockProjectsState: Project[] = [];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorage.clear();
    mockPush.mockClear();

    // Reset state
    mockProjectsState = [];

    // Setup mock implementations
    mockCreateProject.mockImplementation(async (data: ProjectFormData) => {
      const newProject: Project = {
        ...createdProject,
        project_name: data.name,
        job_contract_number: data.job_number,
        client_company_name: data.client_name,
        project_description: data.description,
      };
      
      // Add to mock state
      mockProjectsState.push(newProject);
      
      return { data: newProject, error: undefined };
    });

    mockCreateRFI.mockImplementation(async (data: CreateRFIInput) => {
      return {
        id: 'rfi-e2e-456',
        rfi_number: 'RFI-001',
        project_id: data.project_id,
        subject: data.subject,
        description: data.reason_for_rfi,
        status: data.status,
        priority: data.urgency === 'urgent' ? 'high' : 'low',
        assigned_to: null,
        due_date: null,
        created_by: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        response: null,
        response_date: null,
        attachments: [],
      };
    });

    mockGetNextRFINumber.mockResolvedValue('RFI-001');
    mockGetProject.mockResolvedValue({ data: createdProject, error: undefined });
  });

  afterEach(() => {
    cleanup();
  });

  it('should successfully create a project with all required data', async () => {
    const user = userEvent.setup();

    // Setup useProjects hook mock for project creation
    (useProjects as jest.Mock).mockImplementation(() => ({
      projects: mockProjectsState,
      loading: false,
      error: null,
      createProject: mockCreateProject,
      getProject: mockGetProject,
    }));

    // Render the ProjectForm component
    render(<ProjectForm onSubmit={mockCreateProject} />);

    // Fill out all required project fields
    await user.clear(screen.getByLabelText(/project name/i));
    await user.type(screen.getByLabelText(/project name/i), testProjectData.name);
    
    await user.clear(screen.getByLabelText(/client name/i));
    await user.type(screen.getByLabelText(/client name/i), testProjectData.client_name);
    
    await user.clear(screen.getByLabelText(/job number.*contractor/i));
    await user.type(screen.getByLabelText(/job number.*contractor/i), testProjectData.job_number);
    
    await user.clear(screen.getByLabelText(/contract number.*client/i));
    await user.type(screen.getByLabelText(/contract number.*client/i), testProjectData.contract_number);
    
    // Clear and set the start date field
    const startDateField = screen.getByLabelText(/start date/i);
    await user.clear(startDateField);
    await user.type(startDateField, testProjectData.start_date);
    
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), testProjectData.description);

    // Submit the project form
    await user.click(screen.getByRole('button', { name: /create project/i }));

    // Assert that createProject was called with correct data
    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: testProjectData.name,
          client_name: testProjectData.client_name,
          job_number: testProjectData.job_number,
          contract_number: testProjectData.contract_number,
          start_date: testProjectData.start_date,
          description: testProjectData.description,
        })
      );
    });

    expect(mockCreateProject).toHaveBeenCalledTimes(1);
  });

  it('should render RFI form with project data and show created project in dropdown', async () => {
    // Setup with a pre-created project
    (useProjects as jest.Mock).mockImplementation(() => ({
      projects: [createdProject],
      loading: false,
      error: null,
      createProject: mockCreateProject,
      getProject: mockGetProject,
    }));

    // Render the SimpleRFIFormWorking component
    render(<SimpleRFIFormWorking />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/create new rfi/i)).toBeInTheDocument();
    });

    // Verify that the created project appears in the dropdown options
    await waitFor(() => {
      expect(screen.getByTestId(`select-item-${createdProject.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`select-item-${createdProject.id}`)).toHaveTextContent(createdProject.project_name);
      expect(screen.getByTestId(`select-item-${createdProject.id}`)).toHaveTextContent(createdProject.job_contract_number);
    });

    // Verify all required form fields are present
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason for rfi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contractor question/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create rfi/i })).toBeInTheDocument();
  });

  it('should verify the complete workflow components work together', async () => {
    const user = userEvent.setup();

    // PART 1: Verify Project Creation
    (useProjects as jest.Mock).mockImplementation(() => ({
      projects: [],
      loading: false,
      error: null,
      createProject: mockCreateProject,
      getProject: mockGetProject,
    }));

    const { unmount: unmountProjectForm } = render(<ProjectForm onSubmit={mockCreateProject} />);

    // Fill and submit project form
    await user.type(screen.getByLabelText(/project name/i), testProjectData.name);
    await user.type(screen.getByLabelText(/client name/i), testProjectData.client_name);
    await user.type(screen.getByLabelText(/job number.*contractor/i), testProjectData.job_number);
    await user.type(screen.getByLabelText(/contract number.*client/i), testProjectData.contract_number);
    await user.type(screen.getByLabelText(/start date/i), testProjectData.start_date);
    await user.type(screen.getByLabelText(/description/i), testProjectData.description);
    await user.click(screen.getByRole('button', { name: /create project/i }));

    // Verify project creation
    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(expect.objectContaining({
        name: testProjectData.name,
        client_name: testProjectData.client_name,
        job_number: testProjectData.job_number,
      }));
    });

    unmountProjectForm();

    // PART 2: Verify RFI Form Integration
    // Simulate the state after project creation
    (useProjects as jest.Mock).mockImplementation(() => ({
      projects: [createdProject],
      loading: false,
      error: null,
      createProject: mockCreateProject,
      getProject: mockGetProject,
    }));

    render(<SimpleRFIFormWorking />);

    // Verify the created project is available in the RFI form
    await waitFor(() => {
      expect(screen.getByTestId(`select-item-${createdProject.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`select-item-${createdProject.id}`)).toHaveTextContent(testProjectData.name);
    });

    // Fill out RFI form fields
    await user.type(screen.getByLabelText(/subject/i), testRFIData.subject!);
    await user.selectOptions(screen.getByLabelText(/reason for rfi/i), testRFIData.reason_for_rfi!);
    await user.type(screen.getByLabelText(/contractor question/i), testRFIData.contractor_question!);

    // Verify that form fields are filled correctly
    expect(screen.getByDisplayValue(testRFIData.subject!)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testRFIData.contractor_question!)).toBeInTheDocument();

    // Verify the complete workflow state
    expect(mockCreateProject).toHaveBeenCalledTimes(1);
    
    // Log successful completion
    console.log('Full workflow integration verified:');
    console.log('1. Project creation completed successfully');
    console.log('2. RFI form renders with created project available');
    console.log('3. Form fields can be filled with RFI data');
    console.log('4. Integration between components confirmed');
  });

  it('should handle errors gracefully during project creation', async () => {
    const user = userEvent.setup();
    
    // Mock project creation to fail
    mockCreateProject.mockRejectedValue(new Error('Failed to save project'));

    // Setup useProjects hook mock
    (useProjects as jest.Mock).mockImplementation(() => ({
      projects: [],
      loading: false,
      error: null,
      createProject: mockCreateProject,
      getProject: mockGetProject,
    }));

    render(<ProjectForm onSubmit={mockCreateProject} />);

    // Fill out required fields
    await user.clear(screen.getByLabelText(/project name/i));
    await user.type(screen.getByLabelText(/project name/i), 'Test Project');
    
    await user.clear(screen.getByLabelText(/client name/i));
    await user.type(screen.getByLabelText(/client name/i), 'Test Client');
    
    await user.clear(screen.getByLabelText(/job number.*contractor/i));
    await user.type(screen.getByLabelText(/job number.*contractor/i), 'JOB-001');
    
    await user.clear(screen.getByLabelText(/contract number.*client/i));
    await user.type(screen.getByLabelText(/contract number.*client/i), 'CN-001');
    
    const startDateField = screen.getByLabelText(/start date/i);
    await user.clear(startDateField);
    await user.type(startDateField, '2024-01-01');
    
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create project/i }));

    // Wait for error message to appear (checking for the actual error message from the component)
    await waitFor(() => {
      expect(screen.getByText(/failed to save project/i)).toBeInTheDocument();
    });

    expect(mockCreateProject).toHaveBeenCalledTimes(1);
  });

  it('should handle validation errors during RFI creation when project is not selected', async () => {
    const user = userEvent.setup();
    
    // Setup projects available but RFI creation should show validation error
    (useProjects as jest.Mock).mockReturnValue({
      projects: [createdProject],
      loading: false,
      error: null,
      createProject: mockCreateProject,
      getProject: mockGetProject,
    });

    render(<SimpleRFIFormWorking />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/create new rfi/i)).toBeInTheDocument();
    });

    // Fill RFI fields but intentionally don't select a project
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.selectOptions(screen.getByLabelText(/reason for rfi/i), 'Design clarification');
    await user.type(screen.getByLabelText(/contractor question/i), 'Test question');

    // Submit form without selecting project
    await user.click(screen.getByRole('button', { name: /create rfi/i }));

    // Should show validation error for project selection
    await waitFor(() => {
      const errorDiv = document.querySelector('.bg-red-50');
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveTextContent(/project.*required/i);
    });

    // RFI should not be created
    expect(mockCreateRFI).not.toHaveBeenCalled();
  });

  it('should validate that project selection is required for RFI creation', async () => {
    const user = userEvent.setup();
    
    (useProjects as jest.Mock).mockReturnValue({
      projects: [createdProject],
      loading: false,
      error: null,
      createProject: mockCreateProject,
      getProject: mockGetProject,
    });

    render(<SimpleRFIFormWorking />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/create new rfi/i)).toBeInTheDocument();
    });

    // Fill RFI fields without selecting a project
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.selectOptions(screen.getByLabelText(/reason for rfi/i), 'Design clarification');
    await user.type(screen.getByLabelText(/contractor question/i), 'Test question');

    // Try to submit form
    await user.click(screen.getByRole('button', { name: /create rfi/i }));

    // Should show validation error for project selection (checking for any of the error messages)
    await waitFor(() => {
      expect(screen.getAllByText(/project.*required/i).length).toBeGreaterThan(0);
    });

    // RFI should not be created
    expect(mockCreateRFI).not.toHaveBeenCalled();
  });
});

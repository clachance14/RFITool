import { renderHook, act } from '@testing-library/react';
import { useProjects } from '../useProjects';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useProjects Hook', () => {
  beforeEach(() => {
    // Reset axios mock before each test
    jest.clearAllMocks();
  });

  it('should create a project successfully', async () => {
    const mockProject = { id: '1', project_name: 'Test Project' };
    const mockResponse = {
      data: {
        success: true,
        data: mockProject
      }
    };
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useProjects());

    const testProjectData = {
      project_name: 'Test Project',
      job_contract_number: 'TEST-001',
      client_company_name: 'Test Company',
      project_manager_contact: 'test@example.com',
      default_urgency: 'non-urgent' as const,
      standard_recipients: ['test@example.com'],
      project_disciplines: ['HVAC']
    };

    let createResult;
    await act(async () => {
      createResult = await result.current.createProject(testProjectData);
    });

    expect(mockedAxios.post).toHaveBeenCalledWith('/api/projects', testProjectData);
    expect(createResult).toEqual({ data: mockProject });
  });
}); 
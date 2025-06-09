import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFormNew } from '@/components/project/ProjectFormNew';

// Mock the useProjects hook to see what's being called
const mockCreateProject = jest.fn();
jest.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    createProject: mockCreateProject,
    projects: [],
    loading: false,
    error: null
  })
}));

describe('Debug Project Creation', () => {
  beforeEach(() => {
    mockCreateProject.mockClear();
    console.log('🧪 Test started - mocks cleared');
  });

  test('debug project form submission', async () => {
    console.log('🎯 Rendering ProjectFormNew...');
    render(<ProjectFormNew />);
    
    // Fill required fields
    console.log('📝 Filling form fields...');
    await userEvent.type(screen.getByLabelText(/project name/i), 'Test Project');
    await userEvent.type(screen.getByLabelText(/contract number/i), 'CN-001');
    await userEvent.type(screen.getByLabelText(/client company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/project manager email/i), 'test@example.com');
    
    // Fill standard recipient (required)
    await userEvent.type(screen.getByPlaceholderText(/primary recipient/i), 'recipient@test.com');
    
    // Check if submit button exists
    const submitButton = screen.getByRole('button', { name: /create project/i });
    console.log('🔍 Submit button found:', submitButton);
    
    // Set up mock response
    mockCreateProject.mockResolvedValue({
      success: true,
      data: { id: 'test-id', project_name: 'Test Project' }
    });
    
    console.log('🖱️ Clicking submit button...');
    await userEvent.click(submitButton);
    
    console.log('⏳ Waiting for createProject to be called...');
    await waitFor(() => {
      console.log('📞 Mock call count:', mockCreateProject.mock.calls.length);
      if (mockCreateProject.mock.calls.length > 0) {
        console.log('📞 Mock called with:', mockCreateProject.mock.calls[0][0]);
      }
      expect(mockCreateProject).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
    
    console.log('✅ Test completed successfully');
  });
}); 
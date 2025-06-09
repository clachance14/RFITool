import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFormNew } from '@/components/project/ProjectFormNew';

describe('ProjectFormNew', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders all form sections and fields', () => {
    render(<ProjectFormNew />);

    // Check section headers
    expect(screen.getByText('Project Identification')).toBeInTheDocument();
    expect(screen.getByText('Project Details')).toBeInTheDocument();
    expect(screen.getByText('Default RFI Settings')).toBeInTheDocument();

    // Check required fields
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job\/contract number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project manager email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/default urgency level/i)).toBeInTheDocument();
  });

  test('form validation works correctly', async () => {
    render(<ProjectFormNew />);

    // Try to submit empty form
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    // Check for required field errors
    expect(await screen.findByText(/project name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/contract number is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/client company is required/i)).toBeInTheDocument();
  });

  test('can fill out complete form', async () => {
    render(<ProjectFormNew />);

    // Fill required fields
    await userEvent.type(screen.getByLabelText(/project name/i), 'Test Project');
    await userEvent.type(screen.getByLabelText(/job\/contract number/i), 'CN-2024-001');
    await userEvent.type(screen.getByLabelText(/client company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/project manager email/i), 'pm@test.com');

    // Fill optional fields
    await userEvent.type(screen.getByLabelText(/location/i), '123 Test St');
    await userEvent.selectOptions(screen.getByLabelText(/project type/i), 'mechanical');
    await userEvent.type(screen.getByLabelText(/contract value/i), '500000');

    // Check values are set
    expect(screen.getByLabelText(/project name/i)).toHaveValue('Test Project');
    expect(screen.getByLabelText(/job\/contract number/i)).toHaveValue('CN-2024-001');
    expect(screen.getByLabelText(/client company/i)).toHaveValue('Test Company');
    expect(screen.getByLabelText(/project manager email/i)).toHaveValue('pm@test.com');
  });

  test('project disciplines checkboxes work', async () => {
    render(<ProjectFormNew />);

    // Check some disciplines
    await userEvent.click(screen.getByLabelText(/hvac/i));
    await userEvent.click(screen.getByLabelText(/electrical/i));

    // Verify they're checked
    expect(screen.getByLabelText(/hvac/i)).toBeChecked();
    expect(screen.getByLabelText(/electrical/i)).toBeChecked();
  });

  test('form submission logs correct data', async () => {
    // Mock console.log to verify it's called
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<ProjectFormNew />);

    // Fill ALL required fields including the ones we missed
    await userEvent.type(screen.getByLabelText(/project name/i), 'Test Project');
    await userEvent.type(screen.getByLabelText(/job\/contract number/i), 'CN-2024-001');
    await userEvent.type(screen.getByLabelText(/client company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/project manager email/i), 'pm@test.com');
    
    // Fill project details that might be required
    await userEvent.selectOptions(screen.getByLabelText(/project type/i), 'mechanical');
    await userEvent.type(screen.getByLabelText(/contract value/i), '500000');
    
    // Fill standard recipients (required - at least one)
    await userEvent.type(screen.getByPlaceholderText(/primary recipient/i), 'primary@test.com');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    // Wait for form submission
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Project Form Submitted:', expect.objectContaining({
        project_name: 'Test Project',
        job_contract_number: 'CN-2024-001',
      }));
    });

    consoleSpy.mockRestore();
  });

  test('optional fields can be left empty', async () => {
    render(<ProjectFormNew />);

    // Fill only required fields
    await userEvent.type(screen.getByLabelText(/project name/i), 'Test Project');
    await userEvent.type(screen.getByLabelText(/job\/contract number/i), 'CN-2024-001');
    await userEvent.type(screen.getByLabelText(/client company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/project manager email/i), 'pm@test.com');
    await userEvent.type(screen.getByPlaceholderText(/primary recipient/i), 'primary@test.com');

    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    // Form should submit without errors
    expect(screen.queryByText(/location is required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/project type is required/i)).not.toBeInTheDocument();
  });

  test('form submission works with basic required fields', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<ProjectFormNew />);

    // Fill only the core project identification fields
    await userEvent.type(screen.getByLabelText(/project name/i), 'Test Project');
    await userEvent.type(screen.getByLabelText(/job\/contract number/i), 'CN-2024-001');
    await userEvent.type(screen.getByLabelText(/client company/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/project manager email/i), 'pm@company.com');
    await userEvent.type(screen.getByPlaceholderText(/primary recipient/i), 'client@company.com');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    // Verify form submission happens
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    consoleSpy.mockRestore();
  });

  test('form shows validation errors for required fields', async () => {
    render(<ProjectFormNew />);

    // Try to submit empty form
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));

    // Check that required field errors appear
    expect(await screen.findByText(/project name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/contract number is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/client company is required/i)).toBeInTheDocument();
  });

  test('project type and other optional fields work correctly', async () => {
    render(<ProjectFormNew />);

    // Test project type selection
    const select = screen.getByLabelText(/project type/i);
    await userEvent.selectOptions(select, 'mechanical');
    expect((select as HTMLSelectElement).value).toBe('mechanical');

    // Test location field
    await userEvent.type(screen.getByLabelText(/location/i), 'Test Location');
    expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
  });
}); 
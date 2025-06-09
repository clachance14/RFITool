import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RFIForm } from '@/components/rfi/RFIForm';

// Minimal mocks only
jest.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({ getProjects: jest.fn().mockResolvedValue({ data: [], error: null }) })
}));

jest.mock('@/hooks/useRFIs', () => ({
  useRFIs: () => ({ createRFI: jest.fn() })
}));

// Mock ProjectSelect to reduce complexity
jest.mock('@/components/project/ProjectSelect', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-project-select" />
}));

describe('Debug Form State', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('does input value update when typing?', async () => {
    render(<RFIForm />);
    
    const input = await screen.findByTestId('subject-input') as HTMLInputElement;
    console.log('BEFORE typing - input.value:', input.value);
    
    await userEvent.type(input, 'Test');
    console.log('AFTER typing - input.value:', input.value);
    
    // Simple assertion
    expect(input.value).toBe('Test');
  });
}); 
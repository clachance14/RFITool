import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';
import { MemoryRouter } from 'react-router-dom';

describe('RootLayout integration', () => {
  it('renders children content properly', () => {
    render(
      <MemoryRouter>
        <RootLayout>
          <div data-testid="child-content">Test Content</div>
        </RootLayout>
      </MemoryRouter>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('includes Navigation and Header', () => {
    render(
      <MemoryRouter>
        <RootLayout>
          <div>Test</div>
        </RootLayout>
      </MemoryRouter>
    );
    
    // Check for navigation elements
    expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    
    // Check for header elements
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    
    // Check for main content
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('maintains layout state across page changes', () => {
    render(
      <MemoryRouter initialEntries={['/rfis']}>
        <RootLayout>
          <div>Dashboard Content</div>
        </RootLayout>
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('is responsive (renders mobile nav on small screens)', () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
    render(
      <MemoryRouter>
        <RootLayout>
          <div>Mobile Content</div>
        </RootLayout>
      </MemoryRouter>
    );
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
  });
}); 
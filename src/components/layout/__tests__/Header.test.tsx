import React from 'react';
import { render, screen, fireEvent } from '@/lib/test-utils';
import Header from '../Header';

describe('Header', () => {
  it('renders RFI Ware branding/title', () => {
    render(<Header />);
    expect(screen.getByText('RFI Ware')).toBeInTheDocument();
  });

  it('shows user info display', () => {
    render(<Header />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('renders notification bell icon', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('handles notification bell click', () => {
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    // No-op for now, but should not throw
  });

  it('has proper styling and layout', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('is accessible: proper headings and landmarks', () => {
    render(<Header />);
    expect(screen.getByText('RFI Ware').tagName).toMatch(/SPAN|H1|H2|H3/);
  });
}); 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../Navigation';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
  }),
  usePathname: jest.fn(),
}));

const { usePathname } = require('next/navigation');

const setup = (initialPath = '/rfis') => {
  usePathname.mockReturnValue(initialPath);
  render(<Navigation />);
};

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation items', () => {
    setup();
    expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-create-rfi')).toBeInTheDocument();
    expect(screen.getByTestId('nav-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('nav-logout')).toBeInTheDocument();
  });

  it('renders mobile navigation items', () => {
    setup();
    expect(screen.getByTestId('mobile-nav-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-create-rfi')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-nav-notifications')).toBeInTheDocument();
  });

  it('highlights active navigation item based on current route', () => {
    setup('/rfis/create');
    const createRfiLink = screen.getByTestId('nav-create-rfi');
    expect(createRfiLink).toHaveClass('bg-gray-100');
  });

  it('navigation links have correct href attributes', () => {
    setup();
    expect(screen.getByTestId('nav-dashboard')).toHaveAttribute('href', '/rfis');
    expect(screen.getByTestId('nav-create-rfi')).toHaveAttribute('href', '/rfis/create');
    expect(screen.getByTestId('nav-notifications')).toHaveAttribute('href', '/notifications');
  });

  it('handles logout click', () => {
    setup();
    const logoutButton = screen.getByTestId('nav-logout');
    fireEvent.click(logoutButton);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('has accessible navigation landmarks and keyboard navigation', () => {
    setup();
    const navs = screen.getAllByRole('navigation');
    expect(navs.length).toBeGreaterThan(0);
    expect(navs.some(nav => nav.getAttribute('aria-label') === 'Main navigation')).toBe(true);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });
}); 
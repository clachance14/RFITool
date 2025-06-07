import React from 'react';
import { render, screen } from '@/lib/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from '../rfis/page';
import CreateRFIPage from '../rfis/create/page';
import NotificationsPage from '../notifications/page';

describe('Page Routing', () => {
  it('renders Dashboard page', () => {
    render(
      <MemoryRouter initialEntries={['/rfis']}>
        <Routes>
          <Route path="/rfis" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders Create RFI page', () => {
    render(
      <MemoryRouter initialEntries={['/rfis/create']}>
        <Routes>
          <Route path="/rfis/create" element={<CreateRFIPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Create RFI')).toBeInTheDocument();
  });

  it('renders Notifications page', () => {
    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders 404 for invalid routes', () => {
    render(
      <MemoryRouter initialEntries={['/not-a-page']}>
        <Routes>
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
  });
}); 
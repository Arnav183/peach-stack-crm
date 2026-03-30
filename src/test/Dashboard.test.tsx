import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from '../pages/Dashboard';

describe('Dashboard', () => {
  it('renders fallback initial when client names are missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({
        totalClients: 1,
        totalRevenue: 0,
        upcomingAppointments: 1,
        newClientsThisMonth: 0,
        revenueByMonth: [],
        revenueByService: [],
        nextAppointments: [{ id: 1, client_name: '', service: 'Service', date: '2026-03-31T10:00:00Z' }],
        topClients: [{ id: 2, name: '', email: 'blank@example.com', total_revenue: 0 }],
      }),
    } as Response);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText('No upcoming appointments')).not.toBeInTheDocument());
    expect(screen.getAllByText('N').length).toBeGreaterThan(0);
  });
});

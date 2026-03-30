import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Appointments from '../pages/Appointments';
import Clients from '../pages/Clients';

function mockFetchForClients() {
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/clients')) return Promise.resolve({ json: async () => [] } as Response);
    if (url.includes('/api/business/profile')) return Promise.resolve({ json: async () => ({ plan_services: '["crm"]' }) } as Response);
    return Promise.resolve({ json: async () => ({}) } as Response);
  });
}

function mockFetchForAppointments() {
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/appointments')) return Promise.resolve({ json: async () => [] } as Response);
    if (url.includes('/api/clients')) return Promise.resolve({ json: async () => [] } as Response);
    if (url.includes('/api/services')) return Promise.resolve({ json: async () => [{ name: 'Brow Threading', duration: 60, price: 25 }] } as Response);
    if (url.includes('/api/business/profile')) return Promise.resolve({ json: async () => ({ plan_services: '["crm"]' }) } as Response);
    return Promise.resolve({ json: async () => ({}) } as Response);
  });
}

describe('query param add=true modal behavior', () => {
  it('opens client modal from ?add=true', async () => {
    mockFetchForClients();

    render(
      <MemoryRouter initialEntries={['/dashboard/clients?add=true']}>
        <Routes>
          <Route path="/dashboard/clients" element={<Clients />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Add New Client')).toBeInTheDocument());
  });

  it('opens appointment modal from ?add=true', async () => {
    mockFetchForAppointments();

    render(
      <MemoryRouter initialEntries={['/dashboard/appointments?add=true']}>
        <Routes>
          <Route path="/dashboard/appointments" element={<Appointments />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'New Appointment' })).toBeInTheDocument());
  });
});

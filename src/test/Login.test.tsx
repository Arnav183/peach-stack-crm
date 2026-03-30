import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from '../pages/Login';

describe('Login', () => {
  it('writes auth values before onLogin callback', async () => {
    const onLogin = vi.fn(() => {
      expect(localStorage.getItem('token')).toBe('token-1');
      expect(localStorage.getItem('role')).toBe('business_admin');
      expect(localStorage.getItem('businessId')).toBe('7');
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'token-1',
        user: { role: 'business_admin', businessId: 7 },
      }),
    } as Response);

    render(
      <MemoryRouter>
        <Login onLogin={onLogin} />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByPlaceholderText('you@yourbusiness.com'), 'owner@test.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'demo1234');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In →' }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Accounts from '../pages/Accounts';

describe('Accounts', () => {
  it('reads /auth/me response from nested user object', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ user: { name: 'Priya Sharma', email: 'priya@luxethreading.com' } }),
    } as Response);

    render(<Accounts />);

    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
    expect(screen.getByDisplayValue('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByDisplayValue('priya@luxethreading.com')).toBeInTheDocument();
  });
});

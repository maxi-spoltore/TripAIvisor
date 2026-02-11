import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    social: vi.fn()
  }
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    if (key === 'continueWithGoogle') return 'Continuar con Google';
    if (key === 'signIn') return 'Iniciar sesión';
    return key;
  }
}));

import LoginPage from '../login/page';

describe('LoginPage', () => {
  it('renders Google login button', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('button', {
        name: /continuar con google/i
      })
    ).toBeTruthy();
  });
});

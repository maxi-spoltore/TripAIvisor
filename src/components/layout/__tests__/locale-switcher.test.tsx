import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn()
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'es'
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push
  }),
  usePathname: () => '/es/trips'
}));

import { LocaleSwitcher } from '../locale-switcher';

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    mocks.push.mockClear();
  });

  it('displays the current locale', () => {
    render(<LocaleSwitcher />);
    expect(screen.getByRole('button', { name: 'Español' })).toBeTruthy();
  });

  it('pushes updated localized path', () => {
    render(<LocaleSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Español' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(mocks.push).toHaveBeenCalledWith('/en/trips');
  });
});

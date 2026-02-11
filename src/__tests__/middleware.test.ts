import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  intlHandler: vi.fn(() => NextResponse.next()),
  createIntlMiddleware: vi.fn()
}));

vi.mock('next-intl/middleware', () => {
  mocks.createIntlMiddleware.mockReturnValue(mocks.intlHandler);

  return {
    default: mocks.createIntlMiddleware
  };
});

import { middleware } from '@/middleware';

describe('middleware', () => {
  beforeEach(() => {
    mocks.intlHandler.mockClear();
    mocks.createIntlMiddleware.mockClear();
  });

  it('redirects unauthenticated users on protected routes', () => {
    const request = new NextRequest('http://localhost/es/trips');
    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/es/login?redirectTo=%2Fes%2Ftrips');
  });

  it('allows access to public routes without auth', () => {
    const request = new NextRequest('http://localhost/es/share/abc');
    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(mocks.intlHandler).toHaveBeenCalledTimes(1);
  });

  it('uses default locale for non-prefixed unauthenticated routes', () => {
    const request = new NextRequest('http://localhost/trips');
    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/es/login?redirectTo=%2Ftrips');
  });
});

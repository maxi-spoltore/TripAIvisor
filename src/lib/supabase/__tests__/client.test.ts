import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(() => ({ kind: 'browser' })),
  createServerClient: vi.fn(() => ({ kind: 'server' })),
  createAdminClient: vi.fn(() => ({ kind: 'admin' })),
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn()
  }))
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mocks.createBrowserClient,
  createServerClient: mocks.createServerClient
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createAdminClient
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies
}));

import { createAdminClient } from '../admin';
import { createClient as createBrowserClient } from '../client';
import { createClient as createServerClient } from '../server';

describe('Supabase clients', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    mocks.createBrowserClient.mockClear();
    mocks.createServerClient.mockClear();
    mocks.createAdminClient.mockClear();
    mocks.cookies.mockClear();
  });

  it('creates browser client with public credentials', () => {
    createBrowserClient();

    expect(mocks.createBrowserClient).toHaveBeenCalledWith(
      'http://localhost:54321',
      'anon-key'
    );
  });

  it('creates server client with cookie handlers', async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn()
    };
    mocks.cookies.mockReturnValue(cookieStore);

    await createServerClient();

    const [, , options] = mocks.createServerClient.mock.calls[0];
    expect(options.cookies.getAll()).toEqual([]);
    options.cookies.setAll([{ name: 'sb', value: 'token', options: { path: '/' } }]);
    expect(cookieStore.set).toHaveBeenCalledWith('sb', 'token', { path: '/' });
  });

  it('creates admin client with service role key and no session persistence', () => {
    createAdminClient();

    expect(mocks.createAdminClient).toHaveBeenCalledWith(
      'http://localhost:54321',
      'service-role-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  });
});

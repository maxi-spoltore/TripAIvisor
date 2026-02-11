import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn(() => ({ kind: 'auth-instance' })),
  Pool: vi.fn()
}));

vi.mock('better-auth', () => ({
  betterAuth: mocks.betterAuth
}));

vi.mock('pg', () => ({
  Pool: mocks.Pool
}));

describe('Better Auth configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.betterAuth.mockClear();
    mocks.Pool.mockClear();
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/tripaivisor';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
  });

  it('configures google provider', async () => {
    await import('../auth');

    const [options] = mocks.betterAuth.mock.calls[0];
    expect(options.socialProviders?.google).toMatchObject({
      clientId: 'google-client-id',
      clientSecret: 'google-client-secret'
    });
  });

  it('sets session expiration to 7 days', async () => {
    await import('../auth');

    const [options] = mocks.betterAuth.mock.calls[0];
    expect(options.session?.expiresIn).toBe(60 * 60 * 24 * 7);
    expect(options.session?.updateAge).toBe(60 * 60 * 24);
  });

  it('uses serial ids and verification table mapping', async () => {
    await import('../auth');

    const [options] = mocks.betterAuth.mock.calls[0];
    expect(options.advanced?.database?.generateId).toBe('serial');
    expect(options.verification?.modelName).toBe('verification');
    expect(options.verification?.fields?.expiresAt).toBe('expires_at');
  });
});
